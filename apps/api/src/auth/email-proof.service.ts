import {
  createHash,
  createHmac,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiErrorCode } from '@bidplace/contracts';
import type { AuthFlow, Prisma } from '@bidplace/database';
import { PrismaService } from '../core/database';
import { AppException } from '../core/errors';
import { MailTransport } from '../core/mail';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import {
  MAIL_BUDGET_PURPOSES,
  MAIL_SPEND_STATUSES,
  MAIL_MONTH_WINDOW_MS,
  PERSONAL_MAIL_WINDOW_MS,
  AntifraudService,
} from '../antifraud';
import type { SessionRequest } from './session.service';
import { SessionService } from './session.service';

const proofLifetimeMs = 10 * 60_000;
const resendWaitMs = 60_000;
const addressDailyLimit = 10;
const browserHash = (sid: string) =>
  createHash('sha256').update(sid).digest('hex');
const operationKey = (flowId: string, requestKey: string) =>
  createHash('sha256').update(`${flowId}\0${requestKey}`).digest('hex');

@Injectable()
export class EmailProofService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailTransport,
    private readonly abuse: AntifraudService,
    private readonly sessions: SessionService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  private hash(flowId: string, email: string, code: string): Buffer {
    return createHmac('sha256', this.env.OTP_HASH_SECRET)
      .update(`${flowId}\0${email}\0${code}`)
      .digest();
  }

  private assertRequestFlow(
    flow: AuthFlow | null,
    request: SessionRequest,
    email: string,
    intent: 'register' | 'onboarding',
    now: Date,
  ): asserts flow is AuthFlow {
    if (
      !flow ||
      flow.browserHash !== browserHash(request.sessionID) ||
      flow.stage !== 'email' ||
      flow.email !== email ||
      flow.expiresAt <= now ||
      (intent === 'register'
        ? flow.intent !== 'register'
        : flow.intent !== 'login' || !flow.provider)
    )
      throw new UnauthorizedException('Email proof expired');
  }

  private replay(operation: { status: string; createdAt: Date }) {
    if (operation.status === 'rejected') throw this.mailRejected();
    return {
      code: null,
      operationId: null,
      delivery:
        operation.status === 'accepted'
          ? 'accepted' as const
          : 'unknown' as const,
      retryAt: new Date(operation.createdAt.getTime() + resendWaitMs),
    };
  }

  private mailRejected() {
    return new AppException({
      status: HttpStatus.SERVICE_UNAVAILABLE,
      code: ApiErrorCode.MAIL_REJECTED,
      message: 'Email was rejected by the mail server',
    });
  }

  async startRegistration(
    request: SessionRequest,
    email: string,
  ): Promise<void> {
    const normalized = email.trim().toLowerCase();
    await this.sessions.withLease(request, async () => {
      const digest = browserHash(request.sessionID);
      if (request.session.flowId) {
        const current = await this.prisma.authFlow.findUnique({
          where: { id: request.session.flowId },
        });
        if (
          current?.browserHash === digest &&
          current.intent === 'register' &&
          current.stage === 'email' &&
          current.email === normalized &&
          current.expiresAt > new Date()
        )
          return;
      }
      const flow = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`auth-flow:${digest}`}, 0))`;
        await tx.authFlow.updateMany({
          where: {
            browserHash: digest,
            stage: { notIn: ['complete', 'cancelled', 'failed'] },
          },
          data: { stage: 'cancelled' },
        });
        return tx.authFlow.create({
          data: {
            browserHash: digest,
            intent: 'register',
            stage: 'email',
            returnPath: '/',
            email: normalized,
            expiresAt: new Date(Date.now() + proofLifetimeMs),
          },
        });
      });
      request.session.flowId = flow.id;
      await this.sessions.save(request);
    });
  }

  async assertRegistrationReady(
    request: SessionRequest,
    email: string,
  ): Promise<void> {
    if (!request.session.flowId)
      throw new UnauthorizedException('Email proof required');
    const flow = await this.prisma.authFlow.findUnique({
      where: { id: request.session.flowId },
    });
    if (
      !flow ||
      flow.intent !== 'register' ||
      flow.stage !== 'email' ||
      flow.email !== email.trim().toLowerCase() ||
      flow.browserHash !== browserHash(request.sessionID) ||
      !flow.emailProvedAt ||
      flow.expiresAt <= new Date()
    )
      throw new UnauthorizedException('Email proof required');
  }

  async completeRegistration(request: SessionRequest): Promise<void> {
    if (!request.session.flowId)
      throw new UnauthorizedException('Email proof required');
    await this.prisma.authFlow.updateMany({
      where: {
        id: request.session.flowId,
        browserHash: browserHash(request.sessionID),
        intent: 'register',
        stage: 'email',
        emailProvedAt: { not: null },
      },
      data: { stage: 'complete' },
    });
  }

  async request(
    request: SessionRequest,
    input: {
      email: string;
      idempotencyKey: string;
      turnstileToken: string;
      ip: string;
      intent: 'register' | 'onboarding';
    },
  ): Promise<{
    ok: true;
    serverNow: string;
    resendAvailableAt: string;
    delivery: 'accepted' | 'unknown';
  }> {
    if (!request.session.flowId)
      throw new UnauthorizedException('Email proof expired');
    const flowId = request.session.flowId;
    const email = input.email.trim().toLowerCase();
    const current = await this.prisma.authFlow.findUnique({
      where: { id: flowId },
    });
    this.assertRequestFlow(current, request, email, input.intent, new Date());
    const requestKey = operationKey(flowId, input.idempotencyKey);
    const existing = await this.prisma.authAbuseOperation.findUnique({
      where: {
        purpose_idempotencyKey: {
          purpose: 'email_proof_send',
          idempotencyKey: requestKey,
        },
      },
    });
    if (existing) {
      const replay = this.replay(existing);
      return {
        ok: true,
        delivery: replay.delivery,
        serverNow: new Date().toISOString(),
        resendAvailableAt: replay.retryAt.toISOString(),
      };
    }
    const proof = {
      email,
      turnstileToken: input.turnstileToken,
      ip: input.ip,
    };
    if (input.intent === 'register') await this.abuse.assertRegistration(proof);
    else await this.abuse.assertOnboardingEmailProof(proof);

    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM auth_flows WHERE id = CAST(${flowId} AS uuid) FOR UPDATE`;
      const flow = await tx.authFlow.findUnique({
        where: { id: flowId },
      });
      this.assertRequestFlow(flow, request, email, input.intent, now);
      const previous = await tx.authAbuseOperation.findUnique({
        where: {
          purpose_idempotencyKey: {
            purpose: 'email_proof_send',
            idempotencyKey: requestKey,
          },
        },
      });
      if (previous) return this.replay(previous);
      if (flow.emailProvedAt)
        return {
          code: null,
          retryAt: now,
          operationId: null,
          delivery: 'unknown' as const,
        };
      if (
        flow.codeSentAt &&
        flow.codeSentAt.getTime() + resendWaitMs > now.getTime()
      )
        return {
          code: null,
          operationId: null,
          delivery: 'unknown' as const,
          retryAt: new Date(flow.codeSentAt.getTime() + resendWaitMs),
        };
      if (flow.codeSends >= 3)
        throw new HttpException(
          'Email proof limit reached',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'abuse:mail:global'}, 0))`;
      const usage = await tx.authAbuseOperation.count({
        where: {
          email,
          purpose: { in: [...MAIL_BUDGET_PURPOSES] },
          status: { in: [...MAIL_SPEND_STATUSES] },
          createdAt: { gt: new Date(now.getTime() - PERSONAL_MAIL_WINDOW_MS) },
        },
      });
      if (usage >= addressDailyLimit)
        throw new HttpException(
          'Email proof limit reached',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      const [dailyCount, monthlyCount] = await Promise.all([
        tx.authAbuseOperation.count({
          where: {
            purpose: { in: [...MAIL_BUDGET_PURPOSES] },
            status: { in: [...MAIL_SPEND_STATUSES] },
            createdAt: {
              gt: new Date(now.getTime() - PERSONAL_MAIL_WINDOW_MS),
            },
          },
        }),
        tx.authAbuseOperation.count({
          where: {
            purpose: { in: [...MAIL_BUDGET_PURPOSES] },
            status: { in: [...MAIL_SPEND_STATUSES] },
            createdAt: { gt: new Date(now.getTime() - MAIL_MONTH_WINDOW_MS) },
          },
        }),
      ]);
      if (
        dailyCount >= this.env.AUTH_MAIL_DAILY_BUDGET ||
        monthlyCount >= this.env.AUTH_MAIL_MONTHLY_BUDGET
      )
        throw new ServiceUnavailableException('Email budget exhausted');
      const operation = await tx.authAbuseOperation.create({
        data: {
          email,
          purpose: 'email_proof_send',
          status: 'reserved',
          idempotencyKey: requestKey,
          contentHash: createHash('sha256')
            .update(`${flow.id}\0${email}`)
            .digest('hex'),
          createdAt: now,
        },
      });
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await tx.authFlow.update({
        where: { id: flow.id },
        data: {
          codeHash: this.hash(flow.id, email, code).toString('hex'),
          codeExpiresAt: new Date(now.getTime() + proofLifetimeMs),
          codeSentAt: now,
          codeAttempts: 0,
          codeSends: { increment: 1 },
          codeRequestKey: input.idempotencyKey,
        },
      });
      return {
        code,
        operationId: operation.id,
        delivery: 'unknown' as const,
        retryAt: new Date(now.getTime() + resendWaitMs),
      };
    });
    let delivery: 'accepted' | 'unknown' = result.delivery;
    if (result.code && result.operationId) {
      const operationId = result.operationId;
      let outcome: 'accepted' | 'unknown' | 'rejected' = 'accepted';
      try {
        await this.mail.send({
          to: email,
          subject: 'Код подтверждения почты bidplace',
          text: `Код подтверждения почты bidplace: ${result.code}. Если вы не запрашивали код, проигнорируйте письмо.`,
        });
      } catch (error) {
        outcome = this.abuse.classifyMailFailure(error);
      }
      if (outcome === 'rejected') {
        await this.prisma.$transaction(async (tx) => {
          await tx.authAbuseOperation.update({
            where: { id: operationId },
            data: { status: 'rejected', completedAt: new Date() },
          });
          await tx.authFlow.updateMany({
            where: { id: flowId, codeRequestKey: input.idempotencyKey },
            data: { codeHash: null, codeExpiresAt: null, codeSentAt: null },
          });
        });
        throw this.mailRejected();
      }
      await this.prisma.authAbuseOperation.update({
        where: { id: operationId },
        data: { status: outcome, completedAt: new Date() },
      });
      delivery = outcome;
    }
    return {
      ok: true,
      delivery,
      serverNow: new Date().toISOString(),
      resendAvailableAt: result.retryAt.toISOString(),
    };
  }

  async deliveryState(
    flowId: string,
    requestKey: string | null,
    db: Pick<Prisma.TransactionClient, 'authAbuseOperation'> = this.prisma,
  ) {
    if (!requestKey) return 'none' as const;
    const operation = await db.authAbuseOperation.findUnique({
      where: {
        purpose_idempotencyKey: {
          purpose: 'email_proof_send',
          idempotencyKey: operationKey(flowId, requestKey),
        },
      },
      select: { status: true },
    });
    if (operation?.status === 'accepted') return 'accepted' as const;
    if (operation?.status === 'rejected') return 'rejected' as const;
    return 'unknown' as const;
  }

  async verify(request: SessionRequest, code: string): Promise<void> {
    if (!request.session.flowId)
      throw new ForbiddenException('Email proof invalid');
    const flowId = request.session.flowId;
    const now = new Date();
    await this.prisma
      .$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM auth_flows WHERE id = CAST(${flowId} AS uuid) FOR UPDATE`;
        const flow = await tx.authFlow.findUnique({
          where: { id: flowId },
        });
        if (
          !flow ||
          flow.browserHash !== browserHash(request.sessionID) ||
          flow.stage !== 'email' ||
          !flow.email ||
          !flow.codeHash ||
          !flow.codeExpiresAt ||
          flow.codeExpiresAt <= now ||
          flow.expiresAt <= now
        )
          throw new ForbiddenException('Email proof invalid');
        if (flow.codeAttempts >= 5)
          throw new HttpException(
            'Email proof attempts exhausted',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        const valid = timingSafeEqual(
          Buffer.from(flow.codeHash, 'hex'),
          this.hash(flow.id, flow.email, code),
        );
        if (!valid) {
          await tx.authFlow.update({
            where: { id: flow.id },
            data: { codeAttempts: { increment: 1 } },
          });
          return false;
        }
        await tx.authFlow.update({
          where: { id: flow.id },
          data: { emailProvedAt: now },
        });
        return true;
      })
      .then((valid) => {
        if (!valid) throw new ForbiddenException('Email proof invalid');
      });
  }
}

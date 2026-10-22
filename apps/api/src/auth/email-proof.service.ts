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
import { PrismaService } from '../core/database';
import { MailTransport } from '../core/mail';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import {
  MAIL_BUDGET_PURPOSES,
  MAIL_SPEND_STATUSES,
  MAIL_MONTH_WINDOW_MS,
  PERSONAL_MAIL_WINDOW_MS,
} from '../auth-abuse/auth-abuse.policy';
import { classifyMailFailure } from '../auth-abuse/mail-outcome';
import { AuthAbuseService } from '../auth-abuse/auth-abuse.service';
import type { SessionRequest } from './session.service';
import { SessionService } from './session.service';

const proofLifetimeMs = 10 * 60_000;
const resendWaitMs = 60_000;
const addressDailyLimit = 10;
const browserHash = (sid: string) =>
  createHash('sha256').update(sid).digest('hex');

@Injectable()
export class EmailProofService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailTransport,
    private readonly abuse: AuthAbuseService,
    private readonly sessions: SessionService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  private hash(flowId: string, email: string, code: string): Buffer {
    return createHmac('sha256', this.env.OTP_HASH_SECRET)
      .update(`${flowId}\0${email}\0${code}`)
      .digest();
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
    const replay = await this.prisma.authFlow.findUnique({
      where: { id: flowId },
    });
    if (
      replay?.browserHash === browserHash(request.sessionID) &&
      replay.stage === 'email' &&
      (input.intent === 'register'
        ? replay.intent === 'register'
        : replay.intent === 'login' && Boolean(replay.provider)) &&
      replay.email === email &&
      replay.expiresAt > new Date() &&
      replay.codeRequestKey === input.idempotencyKey &&
      replay.codeSentAt
    ) {
      return {
        ok: true,
        delivery: 'unknown',
        serverNow: new Date().toISOString(),
        resendAvailableAt: new Date(
          replay.codeSentAt.getTime() + resendWaitMs,
        ).toISOString(),
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
      if (
        !flow ||
        flow.browserHash !== browserHash(request.sessionID) ||
        flow.stage !== 'email' ||
        flow.email !== email ||
        flow.expiresAt <= now ||
        (input.intent === 'register'
          ? flow.intent !== 'register'
          : flow.intent !== 'login' || !flow.provider)
      )
        throw new UnauthorizedException('Email proof expired');
      const requestKey = createHash('sha256')
        .update(`${flow.id}\0${input.idempotencyKey}`)
        .digest('hex');
      const previous = await tx.authAbuseOperation.findUnique({
        where: {
          purpose_idempotencyKey: {
            purpose: 'email_proof_send',
            idempotencyKey: requestKey,
          },
        },
      });
      if (previous)
        return {
          code: null,
          operationId: null,
          retryAt: new Date(flow.codeSentAt!.getTime() + resendWaitMs),
        };
      if (flow.emailProvedAt)
        return { code: null, retryAt: now, operationId: null };
      if (
        flow.codeSentAt &&
        (flow.codeRequestKey === input.idempotencyKey ||
          flow.codeSentAt.getTime() + resendWaitMs > now.getTime())
      )
        return {
          code: null,
          operationId: null,
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
        retryAt: new Date(now.getTime() + resendWaitMs),
      };
    });
    let delivery: 'accepted' | 'unknown' = 'unknown';
    if (result.code && result.operationId) {
      try {
        await this.mail.send({
          to: email,
          subject: 'Код подтверждения почты bidplace',
          text: `Код подтверждения почты bidplace: ${result.code}. Если вы не запрашивали код, проигнорируйте письмо.`,
        });
        delivery = 'accepted';
      } catch (error) {
        const outcome = classifyMailFailure(error);
        await this.prisma.authAbuseOperation.update({
          where: { id: result.operationId },
          data: { status: outcome, completedAt: new Date() },
        });
        if (outcome === 'rejected') {
          await this.prisma.authFlow.updateMany({
            where: { id: flowId, codeRequestKey: input.idempotencyKey },
            data: { codeHash: null, codeExpiresAt: null },
          });
          throw new ServiceUnavailableException('Email delivery unavailable');
        }
      }
      if (delivery === 'accepted')
        await this.prisma.authAbuseOperation.update({
          where: { id: result.operationId },
          data: { status: 'accepted', completedAt: new Date() },
        });
    }
    return {
      ok: true,
      delivery,
      serverNow: new Date().toISOString(),
      resendAvailableAt: result.retryAt.toISOString(),
    };
  }

  async deliveryState(flowId: string, requestKey: string | null) {
    if (!requestKey) return 'none' as const;
    const operation = await this.prisma.authAbuseOperation.findUnique({
      where: {
        purpose_idempotencyKey: {
          purpose: 'email_proof_send',
          idempotencyKey: createHash('sha256')
            .update(`${flowId}\0${requestKey}`)
            .digest('hex'),
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

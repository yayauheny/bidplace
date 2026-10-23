import {
  ApiErrorCode,
  type AuthProvider,
  type EmailLoginRequest,
  type OnboardingRequest,
} from '@bidplace/contracts';
import { type AuthFlow, type Prisma } from '@bidplace/database';
import {
  ConflictException,
  Inject,
  Injectable,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as oidc from 'openid-client';
import { AuthAbuseService } from '../auth-abuse/auth-abuse.service';
import { lockAbuseUser, otpCodeHash } from '../auth-abuse/auth-abuse.store';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import { PrismaService, isPrismaUniqueConstraintError } from '../core/database';
import { AppException } from '../core/errors';
import { EmailProofService } from './email-proof.service';
import { AuthService } from './auth.service';
import { readRegistrationLegalVersion } from './legal-documents';
import { OidcProvidersService } from './oidc-providers.service';
import { SessionService, type SessionRequest } from './session.service';

const FLOW_TTL_MS = 10 * 60_000;
const LINK_FRESHNESS_MS = 5 * 60_000;
const terminalStages = ['complete', 'cancelled', 'failed'];
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export function safeAuthReturnPath(value: string): string {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    [...value].some((character) => character.charCodeAt(0) < 32)
  )
    throw new ConflictException('Invalid return path');
  return value;
}

export function authFailureRedirect(
  returnPath: string | undefined,
  reason: 'failed' | 'cancelled' | 'link_required',
): string {
  const query = new URLSearchParams({ authError: reason });
  if (returnPath) query.set('redirectTo', safeAuthReturnPath(returnPath));
  return '/login?' + query.toString();
}

@Injectable()
export class AuthFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: OidcProvidersService,
    private readonly sessions: SessionService,
    private readonly auth: AuthService,
    private readonly abuse: AuthAbuseService,
    private readonly emailProof: EmailProofService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  private async begin(
    request: SessionRequest,
    data: Pick<Prisma.AuthFlowCreateInput, 'intent' | 'stage' | 'returnPath'> &
      Partial<Prisma.AuthFlowCreateInput>,
  ): Promise<AuthFlow> {
    return this.sessions.withLease(request, () =>
      this.createFlow(request, data),
    );
  }

  private async createFlow(
    request: SessionRequest,
    data: Pick<Prisma.AuthFlowCreateInput, 'intent' | 'stage' | 'returnPath'> &
      Partial<Prisma.AuthFlowCreateInput>,
  ): Promise<AuthFlow> {
    const browserHash = digest(request.sessionID);
    const now = new Date();
    const flow = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`auth-flow:${browserHash}`}, 0))`;
      await tx.authFlow.updateMany({
        where: { browserHash, stage: { notIn: terminalStages } },
        data: { stage: 'cancelled', verifier: null, nonce: null },
      });
      return tx.authFlow.create({
        data: {
          ...data,
          browserHash,
          expiresAt: new Date(now.getTime() + FLOW_TTL_MS),
        },
      });
    });
    request.session.flowId = flow.id;
    await this.sessions.save(request);
    const stale = await this.prisma.authFlow.findMany({
      where: { expiresAt: { lt: new Date(now.getTime() - 86_400_000) } },
      select: { id: true },
      take: 50,
    });
    if (stale.length)
      await this.prisma.authFlow.deleteMany({
        where: { id: { in: stale.map((row) => row.id) } },
      });
    return flow;
  }

  private async flow(
    request: SessionRequest,
    stages: string[],
    db: Pick<Prisma.TransactionClient, 'authFlow'> = this.prisma,
  ): Promise<AuthFlow> {
    const id = request.session.flowId;
    if (!id)
      throw new UnauthorizedException('Попытка входа завершена. Начните снова');
    const flow = await db.authFlow.findFirst({
      where: {
        id,
        browserHash: digest(request.sessionID),
      },
    });
    if (flow) request.authReturnPath = safeAuthReturnPath(flow.returnPath);
    if (!flow || !stages.includes(flow.stage) || flow.expiresAt <= new Date())
      throw new UnauthorizedException('Попытка входа завершена. Начните снова');
    return flow;
  }

  private async lockFlow(
    tx: Prisma.TransactionClient,
    flow: AuthFlow,
    stages: string[],
  ): Promise<AuthFlow> {
    if (flow.userId) await lockAbuseUser(tx, flow.userId);
    await tx.$queryRaw`SELECT id FROM auth_flows WHERE id = CAST(${flow.id} AS uuid) FOR UPDATE`;
    const current = await tx.authFlow.findUniqueOrThrow({
      where: { id: flow.id },
    });
    if (
      !stages.includes(current.stage) ||
      current.expiresAt <= new Date() ||
      current.browserHash !== flow.browserHash
    )
      throw new UnauthorizedException('Попытка входа завершена');
    if (current.userId) {
      const user = await tx.user.findUnique({
        where: { id: current.userId },
        select: { sessionVersion: true, status: true },
      });
      if (
        !user ||
        user.status !== 'active' ||
        user.sessionVersion !== current.version
      )
        throw new UnauthorizedException('Доступ отозван');
    }
    return current;
  }

  private async finish(request: SessionRequest, flow: AuthFlow): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const current = await this.lockFlow(tx, flow, ['ready']);
      if (!current.userId || current.version === null)
        throw new UnauthorizedException('Нет подтверждения входа');
      await tx.authFlow.update({
        where: { id: flow.id },
        data: { stage: 'issuing' },
      });
    });
    try {
      await this.sessions.login(request, flow.userId!, flow.version!, flow.id);
    } catch (error) {
      await this.prisma.authFlow.updateMany({
        where: { id: flow.id, stage: 'issuing' },
        data: { stage: 'ready' },
      });
      throw error;
    }
    const completed = await this.prisma.authFlow.updateMany({
      where: { id: flow.id, stage: 'issuing' },
      data: { stage: 'complete' },
    });
    if (completed.count !== 1) {
      await this.sessions.destroy(request);
      throw new UnauthorizedException('Попытка отменена');
    }
  }

  async start(
    request: SessionRequest,
    provider: AuthProvider,
    intent: 'login' | 'link',
    returnPath: string,
  ) {
    this.providers.settings(provider);
    if (intent === 'link') {
      await this.sessions.authenticate(request);
      if (
        Date.now() - request.session.principal!.authenticatedAt >
        LINK_FRESHNESS_MS
      )
        throw new UnauthorizedException(
          'Для подключения войдите в аккаунт заново',
        );
    } else if (request.session.principal) {
      throw new ConflictException(
        'Выйдите из текущего аккаунта перед новым входом',
      );
    }
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const verifier = oidc.randomPKCECodeVerifier();
    const url = await this.providers.authorization(
      provider,
      state,
      nonce,
      verifier,
    );
    await this.begin(request, {
      provider,
      intent,
      stage: 'provider',
      returnPath: safeAuthReturnPath(returnPath),
      stateHash: digest(state),
      nonce,
      verifier,
      ...(intent === 'link'
        ? { userId: request.auth!.sub, version: request.auth!.sessionVersion }
        : {}),
    });
    return { url };
  }

  async callback(
    request: SessionRequest,
    provider: AuthProvider,
  ): Promise<string> {
    const flow = await this.flow(request, ['provider', 'ready']);
    const query = new URL(request.originalUrl, 'http://local.invalid')
      .searchParams;
    const state = query.get('state');
    if (
      !state ||
      state.length > 512 ||
      flow.provider !== provider ||
      !flow.stateHash ||
      flow.stateHash !== digest(state)
    )
      throw new UnauthorizedException('Недействительная попытка входа');
    if (flow.stage === 'ready' && flow.intent === 'login') {
      await this.finish(request, flow);
      return flow.returnPath;
    }
    if (!flow.nonce || !flow.verifier)
      throw new UnauthorizedException('Попытка завершена');
    if (query.has('error')) {
      await this.cancel(request);
      return authFailureRedirect(flow.returnPath, 'cancelled');
    }
    if (flow.intent === 'link') {
      await this.sessions.authenticate(request);
      if (
        request.auth!.sub !== flow.userId ||
        request.auth!.sessionVersion !== flow.version ||
        Date.now() - request.session.principal!.authenticatedAt >
          LINK_FRESHNESS_MS
      )
        throw new UnauthorizedException('Повторите подключение после входа');
    }
    const claimed = await this.prisma.authFlow.updateMany({
      where: { id: flow.id, stage: 'provider', expiresAt: { gt: new Date() } },
      data: { stage: 'exchanging' },
    });
    if (claimed.count !== 1)
      throw new UnauthorizedException('Попытка уже использована');
    let proof;
    try {
      proof = await this.providers.exchange(
        provider,
        query.toString(),
        state,
        flow.nonce,
        flow.verifier,
      );
    } catch (error) {
      await this.prisma.authFlow.updateMany({
        where: { id: flow.id, stage: 'exchanging' },
        data: { stage: 'failed', verifier: null, nonce: null },
      });
      throw error;
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await this.lockFlow(tx, flow, ['exchanging']);
      const identity = await tx.externalIdentity.findUnique({
        where: {
          issuer_subject: { issuer: proof.issuer, subject: proof.subject },
        },
        include: { user: true },
      });
      const proofData = {
        issuer: proof.issuer,
        subject: proof.subject,
        email: proof.email,
        emailProof: proof.emailProof,
        verifier: null,
        nonce: null,
      };
      if (flow.intent === 'link') {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: current.userId! },
        });
        if (!user.emailVerifiedAt)
          throw new ConflictException('Сначала подтвердите почту аккаунта');
        if (identity && identity.userId !== user.id)
          throw new ConflictException(
            'Этот способ входа уже подключён к другому аккаунту',
          );
        if (!identity)
          await tx.externalIdentity.create({
            data: {
              userId: user.id,
              provider,
              issuer: proof.issuer,
              subject: proof.subject,
              activatedAt: new Date(),
              pendingVersion: user.sessionVersion,
            },
          });
        else if (!identity.activatedAt)
          await tx.externalIdentity.update({
            where: { id: identity.id },
            data: {
              activatedAt: new Date(),
              pendingVersion: user.sessionVersion,
            },
          });
        await tx.authFlow.update({
          where: { id: flow.id },
          data: { ...proofData, stage: 'complete' },
        });
        return { userId: null, version: null, redirect: flow.returnPath };
      }
      if (identity) {
        if (identity.user.status !== 'active')
          throw new UnauthorizedException('Вход недоступен');
        if (identity.activatedAt && identity.user.emailVerifiedAt) {
          await tx.authFlow.update({
            where: { id: flow.id },
            data: {
              ...proofData,
              stage: 'ready',
              userId: identity.userId,
              version: identity.user.sessionVersion,
            },
          });
          return {
            userId: identity.userId,
            version: identity.user.sessionVersion,
            redirect: flow.returnPath,
          };
        }
        if (identity.pendingVersion !== identity.user.sessionVersion)
          throw new UnauthorizedException(
            'Войдите прежним способом и подключите провайдера заново',
          );
        await tx.authFlow.update({
          where: { id: flow.id },
          data: {
            ...proofData,
            stage: 'email',
            userId: identity.userId,
            version: identity.user.sessionVersion,
            email: identity.user.email,
          },
        });
        return { userId: null, version: null, redirect: '/auth/complete' };
      }
      if (
        proof.emailProof &&
        (await tx.user.findUnique({
          where: { email: proof.emailProof },
          select: { id: true },
        }))
      ) {
        await tx.authFlow.update({
          where: { id: flow.id },
          data: { verifier: null, nonce: null, stage: 'cancelled' },
        });
        return {
          userId: null,
          version: null,
          redirect: authFailureRedirect(flow.returnPath, 'link_required'),
        };
      }
      await tx.authFlow.update({
        where: { id: flow.id },
        data: { ...proofData, stage: 'profile' },
      });
      return { userId: null, version: null, redirect: '/auth/complete' };
    });
    if (result.userId && result.version !== null)
      await this.finish(request, {
        ...flow,
        userId: result.userId,
        version: result.version,
      });
    return result.redirect;
  }

  async state(request: SessionRequest) {
    const flow = await this.flow(request, ['profile', 'email', 'ready']);
    if (flow.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: flow.userId },
        select: { email: true, sessionVersion: true, status: true },
      });
      if (
        !user ||
        user.status !== 'active' ||
        user.sessionVersion !== flow.version
      )
        throw new UnauthorizedException('Попытка завершена');
      return {
        stage: flow.stage,
        provider: flow.provider,
        email: user.email,
        returnPath: flow.returnPath,
      };
    }
    return {
      stage: flow.stage,
      provider: flow.provider,
      email: flow.email,
      returnPath: flow.returnPath,
    };
  }

  async resume(request: SessionRequest) {
    const flow = await this.flow(request, ['ready']);
    if (!flow.provider || flow.intent !== 'login')
      throw new UnauthorizedException('Нет подтверждения провайдера');
    await this.finish(request, flow);
    return {
      next: 'authenticated' as const,
      user: await this.auth.me(flow.userId!),
      returnPath: flow.returnPath,
    };
  }

  async complete(request: SessionRequest, input: OnboardingRequest) {
    const flow = await this.flow(request, ['profile', 'ready']);
    if (flow.stage === 'ready') {
      await this.finish(request, flow);
      return {
        next: 'authenticated' as const,
        user: await this.auth.me(flow.userId!),
        returnPath: flow.returnPath,
      };
    }
    if (!flow.provider || !flow.issuer || !flow.subject)
      throw new UnauthorizedException('Нет подтверждения провайдера');
    const email = input.email.trim().toLowerCase();
    const version = readRegistrationLegalVersion();
    if (
      [
        input.legal.agreement,
        input.legal.privacy,
        input.legal.dataConsent,
      ].some((item) => item.version !== undefined && item.version !== version)
    )
      throw new ConflictException('Версия документов обновилась');
    this.abuse.assertRegistrationEmail(email);
    const verified = email === flow.emailProof;
    if (!verified) {
      await this.prisma.$transaction(async (tx) => {
        await this.lockFlow(tx, flow, ['profile']);
        await tx.authFlow.update({
          where: { id: flow.id },
          data: {
            stage: 'email',
            email,
            profileSlug: input.slug,
            legalVersion: version,
            legalAcceptedAt: new Date(),
          },
        });
      });
      return { next: 'email' as const };
    }
    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        await this.lockFlow(tx, flow, ['profile']);
        const now = new Date();
        const user = await tx.user.create({
          data: {
            email,
            slug: input.slug,
            passwordHash: null,
            emailVerifiedAt: now,
            registrationLegalEvidence: {
              create: {
                agreementVersion: version,
                agreementAcceptedAt: now,
                privacyVersion: version,
                privacyAcknowledgedAt: now,
                dataConsentVersion: version,
                dataConsentedAt: now,
                age18ConfirmedAt: now,
              },
            },
          },
        });
        await tx.externalIdentity.create({
          data: {
            userId: user.id,
            provider: flow.provider!,
            issuer: flow.issuer!,
            subject: flow.subject!,
            activatedAt: now,
            pendingVersion: user.sessionVersion,
          },
        });
        await tx.authFlow.update({
          where: { id: flow.id },
          data: {
            stage: 'ready',
            userId: user.id,
            email,
            version: user.sessionVersion,
          },
        });
        return user;
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        if (
          await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
          })
        )
          await this.cancel(request);
        throw new ConflictException(
          'Почта или ник уже используются. Войдите в существующий аккаунт и подключите провайдера в настройках',
        );
      }
      throw error;
    }
    await this.finish(request, {
      ...flow,
      userId: result.id,
      version: result.sessionVersion,
    });
    return {
      next: 'authenticated' as const,
      user: await this.auth.me(result.id),
      returnPath: flow.returnPath,
    };
  }

  async requestVerification(
    request: SessionRequest,
    input: { idempotencyKey: string; turnstileToken: string },
    ip: string,
  ) {
    const flow = await this.flow(request, ['email']);
    if (!flow.email) throw new UnauthorizedException('Повторите вход');
    const result = await this.emailProof.request(request, {
      ...input,
      email: flow.email,
      ip,
      intent: 'onboarding',
    });
    return { delivery: result.delivery };
  }

  async verificationState(request: SessionRequest) {
    return this.prisma.$transaction(
      async (tx) => {
        const flow = await this.flow(request, ['email'], tx);
        return {
          serverNow: new Date().toISOString(),
          email: flow.email!,
          verified: Boolean(flow.emailProvedAt),
          sendStatus: await this.emailProof.deliveryState(
            flow.id, flow.codeRequestKey, tx,
          ),
          codeExpiresAt: flow.codeExpiresAt?.toISOString() ?? null,
          resendAvailableAt: flow.codeSentAt
            ? new Date(flow.codeSentAt.getTime() + 60_000).toISOString()
            : null,
          pausedUntil: null,
          quotaResetsAt: null,
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }

  async verifyOnboarding(
    request: SessionRequest,
    code: string,
  ) {
    const flow = await this.flow(request, ['email', 'ready']);
    if (flow.stage === 'email') await this.emailProof.verify(request, code);
    let user;
    try {
      user = await this.prisma.$transaction(async (tx) => {
        await this.lockFlow(tx, flow, ['email', 'ready']);
        const current = await tx.authFlow.findUniqueOrThrow({ where: { id: flow.id } });
        if (current.stage === 'ready' && current.userId)
          return tx.user.findUniqueOrThrow({ where: { id: current.userId } });
        if (!current.emailProvedAt) throw new UnauthorizedException('Нет подтверждения почты этой попытки');
        if (current.userId) {
          const existing = await tx.user.findUniqueOrThrow({ where: { id: current.userId } });
          if (existing.status !== 'active' || existing.sessionVersion !== current.version || existing.email !== current.email)
            throw new UnauthorizedException('Доступ отозван');
          const activated = await tx.externalIdentity.updateMany({
            where: { userId: existing.id, issuer: current.issuer!, subject: current.subject!, activatedAt: null, pendingVersion: existing.sessionVersion },
            data: { activatedAt: new Date() },
          });
          if (activated.count !== 1) throw new UnauthorizedException('Подключение недоступно');
          await tx.authFlow.update({ where: { id: current.id }, data: { stage: 'ready' } });
          return tx.user.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date() } });
        }
        if (
          !current.emailProvedAt ||
          !current.email ||
          !current.profileSlug ||
          !current.legalVersion ||
          !current.legalAcceptedAt ||
          !current.provider ||
          !current.issuer ||
          !current.subject
        ) throw new UnauthorizedException('Нет подтверждения почты этой попытки');
        const now = new Date();
        const created = await tx.user.create({
          data: {
            email: current.email,
            slug: current.profileSlug,
            passwordHash: null,
            emailVerifiedAt: now,
            registrationLegalEvidence: {
              create: {
                agreementVersion: current.legalVersion,
                agreementAcceptedAt: current.legalAcceptedAt,
                privacyVersion: current.legalVersion,
                privacyAcknowledgedAt: current.legalAcceptedAt,
                dataConsentVersion: current.legalVersion,
                dataConsentedAt: current.legalAcceptedAt,
                age18ConfirmedAt: current.legalAcceptedAt,
              },
            },
          },
        });
        await tx.externalIdentity.create({
          data: {
            userId: created.id,
            provider: current.provider,
            issuer: current.issuer,
            subject: current.subject,
            activatedAt: now,
            pendingVersion: created.sessionVersion,
          },
        });
        await tx.authFlow.update({
          where: { id: flow.id },
          data: { stage: 'ready', userId: created.id, version: created.sessionVersion },
        });
        return created;
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error))
        throw new ConflictException(
          'Почта или ник уже используются. Войдите в существующий аккаунт и подключите провайдера в настройках',
        );
      throw error;
    }
    await this.finish(request, {
      ...flow,
      userId: user.id,
      version: user.sessionVersion,
    });
    return {
      next: 'authenticated' as const,
      user: await this.auth.me(user.id),
      returnPath: flow.returnPath,
    };
  }

  async requestLoginCode(
    request: SessionRequest,
    input: EmailLoginRequest,
    ip: string,
  ) {
    const email = input.email.trim().toLowerCase();
    if (request.session.principal) throw new ConflictException('Вы уже вошли');
    const existing = request.session.flowId
      ? await this.prisma.authFlow.findFirst({
          where: {
            id: request.session.flowId,
            browserHash: digest(request.sessionID),
            stage: 'email_login',
            email,
            expiresAt: { gt: new Date() },
          },
        })
      : null;
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        sessionVersion: true,
        emailVerifiedAt: true,
        status: true,
      },
    });
    const eligible = user?.emailVerifiedAt && user.status === 'active';
    const flow =
      (existing &&
      (!eligible ||
        (existing.userId === user.id &&
          existing.version === user.sessionVersion))
        ? existing
        : null) ??
      (await this.begin(request, {
        intent: 'email_login',
        stage: 'email_login',
        returnPath: '/',
        email,
        userId: eligible ? user.id : null,
        version: eligible ? user.sessionVersion : null,
      }));
    const retryAt = await this.abuse.sendEmailLogin({
      ...input,
      email,
      flowId: flow.id,
      ip,
    });
    return {
      ok: true as const,
      serverNow: new Date().toISOString(),
      resendAvailableAt: retryAt.toISOString(),
    };
  }

  async loginCodeState(request: SessionRequest) {
    const flow = await this.flow(request, ['email_login', 'ready']);
    return this.abuse.readEmailLoginState(flow.browserHash, flow.email!);
  }

  async verifyLogin(
    request: SessionRequest,
    code: string,
    idempotencyKey: string,
  ) {
    try {
      return await this.completeLoginCode(request, code, idempotencyKey);
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() >= 400 &&
        error.getStatus() < 500
      ) {
        throw new AppException({
          status: 403,
          code: ApiErrorCode.EMAIL_LOGIN_REJECTED,
          message: 'Email login could not be verified',
        });
      }
      throw error;
    }
  }

  private async completeLoginCode(
    request: SessionRequest,
    code: string,
    idempotencyKey: string,
  ) {
    const flow = await this.flow(request, ['email_login', 'ready']);
    await this.abuse.verifyEmailCode({
      userId: flow.userId ?? flow.id,
      ...(!flow.userId ? { unregisteredEmail: flow.email! } : {}),
      purpose: 'email_login',
      flowId: flow.id,
      code,
      idempotencyKey,
    });
    if (!flow.userId)
      throw new UnauthorizedException('Код недействителен или истёк');
    await this.prisma.$transaction(async (tx) => {
      await this.lockFlow(tx, flow, ['email_login', 'ready']);
      const user = await tx.user.findUniqueOrThrow({
        where: { id: flow.userId! },
      });
      if (!user.emailVerifiedAt || user.email !== flow.email)
        throw new UnauthorizedException('Почта аккаунта изменилась');
      const consumed = await tx.emailVerificationCode.findFirst({
        where: {
          userId: user.id,
          purpose: 'email_login',
          flowId: flow.id,
          version: user.sessionVersion,
          codeHash: otpCodeHash(
            this.env.OTP_HASH_SECRET,
            user.id,
            user.email,
            code,
            'email_login',
            flow.id,
          ),
          usedAt: { not: null },
          expiresAt: { gt: new Date() },
        },
      });
      if (!consumed)
        throw new UnauthorizedException('Код недействителен или истёк');
      await tx.authFlow.update({
        where: { id: flow.id },
        data: { stage: 'ready' },
      });
    });
    await this.finish(request, flow);
    return { user: await this.auth.me(flow.userId) };
  }

  async connections(request: SessionRequest) {
    await this.sessions.authenticate(request);
    const rows = await this.prisma.externalIdentity.findMany({
      where: { userId: request.auth!.sub, activatedAt: { not: null } },
      select: { provider: true },
    });
    return { connections: rows };
  }

  async cancel(request: SessionRequest): Promise<void> {
    return this.sessions.withLease(request, () => this.cancelFlow(request));
  }

  private async cancelFlow(request: SessionRequest): Promise<void> {
    if (request.session.flowId)
      await this.prisma.authFlow.updateMany({
        where: {
          id: request.session.flowId,
          browserHash: digest(request.sessionID),
          stage: { notIn: terminalStages },
        },
        data: { stage: 'cancelled', verifier: null, nonce: null },
      });
    delete request.session.flowId;
    await this.sessions.save(request);
  }
}

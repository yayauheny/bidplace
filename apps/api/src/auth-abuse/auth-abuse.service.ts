import { ApiErrorCode } from '@bidplace/contracts';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';

import {
  SERVER_ENV,
  type ServerEnv,
  isTestEmailBypassEnabled,
  resolveCorsOrigin,
} from '../core/config';
import { PrismaService } from '../core/database';
import { AppException } from '../core/errors';
import { MailTransport } from '../core/mail';
import { safeFailureLocation } from '../core/request-context/safe-request-log';
import { buildPasswordResetLink } from '../password-reset/password-reset-link';
import { normalizeEmail } from './auth-abuse.policy';
import {
  AuthAbuseStore,
  type LoginDecision,
  mailContentHash,
  resetContentHash,
} from './auth-abuse.store';
import { DisposableEmailList } from './disposable-email';
import { classifyMailFailure } from './mail-outcome';
import { TurnstileVerifier, turnstileValidationId } from './turnstile-verifier';

const IDEMPOTENCY_KEY = /^[A-Za-z0-9:_-]{8,80}$/;

export type MailDelivery = 'accepted' | 'unknown' | 'already_verified';

function abuseError(
  status: number,
  code: (typeof ApiErrorCode)[keyof typeof ApiErrorCode],
  message: string,
  details?: Record<string, string>,
): AppException {
  return new AppException({ status, code, message, details });
}

@Injectable()
export class AuthAbuseService {
  private readonly logger = new Logger(AuthAbuseService.name);

  constructor(
    private readonly store: AuthAbuseStore,
    private readonly prisma: PrismaService,
    private readonly mail: MailTransport,
    private readonly turnstile: TurnstileVerifier,
    private readonly disposable: DisposableEmailList,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  isDisposable(email: string): boolean {
    return this.disposable.contains(email);
  }

  async assertRegistration(input: {
    email: string;
    turnstileToken: string;
    ip: string;
  }): Promise<void> {
    await this.requireTurnstile('register', input.turnstileToken, input.ip);
    if (this.disposable.contains(input.email)) {
      throw abuseError(
        HttpStatus.BAD_REQUEST,
        ApiErrorCode.DISPOSABLE_EMAIL,
        'Disposable email domains cannot be registered',
      );
    }
  }

  async assessLogin(input: {
    email: string;
    ip: string;
    passwordAccepted: boolean;
    turnstileToken?: string | undefined;
  }): Promise<LoginDecision> {
    const now = new Date();
    const preliminary = await this.store.evaluateLogin({
      email: input.email,
      ip: input.ip,
      passwordAccepted: input.passwordAccepted,
      turnstile: 'unchecked',
      now,
    });
    if (preliminary.outcome !== 'challenge') return preliminary;
    if (!input.turnstileToken) return { outcome: 'turnstile_required' };

    const decision = await this.turnstile.verify({
      token: input.turnstileToken,
      action: 'login',
      remoteIp: input.ip,
    });
    return this.store.evaluateLogin({
      email: input.email,
      ip: input.ip,
      passwordAccepted: input.passwordAccepted,
      turnstile:
        decision.outcome === 'accepted'
          ? 'accepted'
          : decision.outcome === 'unavailable'
            ? 'unavailable'
            : 'rejected',
      now: new Date(),
    });
  }

  async sendEmailVerification(input: {
    userId: string;
    idempotencyKey: string;
    turnstileToken: string;
    ip: string;
  }): Promise<{ delivery: MailDelivery }> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user) {
      throw abuseError(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, 'User is not available');
    }

    this.assertIdempotencyKey(input.idempotencyKey);
    const hash = mailContentHash('email_verification_send', user.id, user.email);
    const existing = await this.store.findByKey(
      'email_verification_send',
      input.idempotencyKey,
    );
    if (existing) {
      this.assertSameContent(existing.contentHash, hash, existing.ownerUserId, user.id);
      if (existing.status === 'rejected') {
        throw abuseError(
          HttpStatus.SERVICE_UNAVAILABLE,
          ApiErrorCode.MAIL_REJECTED,
          'Email was rejected by the mail server',
        );
      }
      return { delivery: deliveryOf(existing.status) };
    }

    if (user.emailVerifiedAt) {
      const stored = await this.store.recordVerifiedNoSend({
        idempotencyKey: input.idempotencyKey,
        ownerUserId: user.id,
        email: user.email,
        contentHash: hash,
        now: new Date(),
      });
      if (stored === 'conflict') this.throwContentConflict();
      return { delivery: 'already_verified' };
    }

    await this.requireTurnstile('email_verification', input.turnstileToken, input.ip, {
      operationKey: input.idempotencyKey,
      contentHash: hash,
    });
    const reserved = await this.store.reserveMail({
      purpose: 'email_verification_send',
      idempotencyKey: input.idempotencyKey,
      ownerUserId: user.id,
      contentHash: hash,
      now: new Date(),
      dailyBudget: this.env.AUTH_MAIL_DAILY_BUDGET,
      monthlyBudget: this.env.AUTH_MAIL_MONTHLY_BUDGET,
    });
    if (reserved.kind === 'replay') {
      if (reserved.status === 'rejected') {
        throw abuseError(
          HttpStatus.SERVICE_UNAVAILABLE,
          ApiErrorCode.MAIL_REJECTED,
          'Email was rejected by the mail server',
        );
      }
      return { delivery: deliveryOf(reserved.status) };
    }
    if (reserved.kind !== 'reserved') throw this.reservationError(reserved);

    if (isTestEmailBypassEnabled(this.env)) {
      await this.store.completeMail({
        operationId: reserved.operationId,
        outcome: 'accepted',
        purpose: 'email_verification_send',
        verifyUserId: user.id,
      });
      return { delivery: 'accepted' };
    }

    return this.finishSend({
      operationId: reserved.operationId,
      purpose: 'email_verification_send',
      message: {
        to: user.email,
        subject: 'bidplace email verification code',
        text: `Your bidplace verification code is ${reserved.rawSecret}.`,
      },
    });
  }

  async verifyEmailCode(input: {
    userId: string;
    code: string;
    idempotencyKey: string;
  }): Promise<void> {
    this.assertIdempotencyKey(input.idempotencyKey);
    const decision = await this.store.verifyEmailCode({
      userId: input.userId,
      code: input.code,
      idempotencyKey: input.idempotencyKey,
    });

    if (decision.outcome === 'verified' || decision.outcome === 'already_verified') return;
    if (decision.outcome === 'missing') {
      throw abuseError(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, 'User is not available');
    }
    if (decision.outcome === 'conflict') {
      throw abuseError(
        HttpStatus.CONFLICT,
        ApiErrorCode.IDEMPOTENCY_CONFLICT,
        'Idempotency key does not match request',
      );
    }
    if (decision.outcome === 'expired') {
      throw abuseError(HttpStatus.FORBIDDEN, ApiErrorCode.OTP_EXPIRED, 'OTP has expired');
    }
    if (decision.outcome === 'paused') {
      throw abuseError(HttpStatus.TOO_MANY_REQUESTS, ApiErrorCode.OTP_PAUSED, 'OTP retry pause is active', {
        pausedUntil: decision.pausedUntil.toISOString(),
      });
    }
    throw abuseError(HttpStatus.FORBIDDEN, ApiErrorCode.OTP_INVALID, 'OTP is invalid');
  }

  async readVerificationState(userId: string) {
    const now = new Date();
    const state = await this.store.readVerificationState(userId, now);
    if (!state) {
      throw abuseError(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, 'User is not available');
    }
    return {
      serverNow: now.toISOString(),
      email: state.email,
      verified: state.verified,
      sendStatus: state.sendStatus,
      codeExpiresAt: state.codeExpiresAt?.toISOString() ?? null,
      resendAvailableAt: state.resendAvailableAt?.toISOString() ?? null,
      pausedUntil: state.pausedUntil?.toISOString() ?? null,
      quotaResetsAt: state.quotaResetsAt?.toISOString() ?? null,
    };
  }

  async correctEmail(input: { userId: string; email: string }): Promise<void> {
    const email = normalizeEmail(input.email);
    if (this.disposable.contains(email)) {
      throw abuseError(
        HttpStatus.BAD_REQUEST,
        ApiErrorCode.DISPOSABLE_EMAIL,
        'Disposable email domains cannot be used',
      );
    }
    const decision = await this.store.correctEmail({
      userId: input.userId,
      email,
      now: new Date(),
    });
    if (decision.outcome === 'missing') {
      throw abuseError(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, 'User is not available');
    }
    if (decision.outcome === 'verified') {
      throw abuseError(
        HttpStatus.CONFLICT,
        ApiErrorCode.CONFLICT,
        'Verified email cannot be changed here',
      );
    }
    if (decision.outcome === 'taken') {
      throw abuseError(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, 'Email or phone already in use');
    }
  }

  async sendPasswordReset(input: {
    email: string;
    turnstileToken: string;
    idempotencyKey: string;
    ip: string;
  }): Promise<void> {
    const email = normalizeEmail(input.email);
    this.assertIdempotencyKey(input.idempotencyKey);
    const hash = resetContentHash(email);
    const existing = await this.store.findByKey('password_reset_send', input.idempotencyKey);
    if (existing) {
      if (existing.contentHash !== hash) this.throwContentConflict();
      return;
    }

    await this.requireTurnstile('password_reset', input.turnstileToken, input.ip, {
      operationKey: input.idempotencyKey,
      contentHash: hash,
    });
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });
    if (!user || user.status !== 'active') {
      const stored = await this.store.suppressReset({
        idempotencyKey: input.idempotencyKey,
        email,
        contentHash: hash,
        now: new Date(),
      });
      if (stored === 'conflict') this.throwContentConflict();
      return;
    }

    const reserved = await this.store.reserveMail({
      purpose: 'password_reset_send',
      idempotencyKey: input.idempotencyKey,
      ownerUserId: user.id,
      contentHash: hash,
      now: new Date(),
      dailyBudget: this.env.AUTH_MAIL_DAILY_BUDGET,
      monthlyBudget: this.env.AUTH_MAIL_MONTHLY_BUDGET,
    });
    if (reserved.kind === 'replay') return;
    if (reserved.kind === 'conflict') throw this.reservationError(reserved);
    if (reserved.kind !== 'reserved') return;

    const resetUrlBase = this.env.PASSWORD_RESET_URL_BASE ?? resolveCorsOrigin(this.env);
    if (!resetUrlBase) {
      await this.store.completeMail({
        operationId: reserved.operationId,
        outcome: 'rejected',
        purpose: 'password_reset_send',
      });
      this.logger.error('Password reset link base URL is not configured; reservation released');
      return;
    }

    await this.finishSend({
      operationId: reserved.operationId,
      purpose: 'password_reset_send',
      neutral: true,
      message: {
        to: user.email,
        subject: 'bidplace password reset',
        text: `Reset your bidplace password using this link: ${buildPasswordResetLink(resetUrlBase, reserved.rawSecret)}`,
      },
    });
  }

  private async finishSend(input: {
    operationId: string;
    purpose: 'email_verification_send' | 'password_reset_send';
    message: { to: string; subject: string; text: string };
    neutral?: boolean;
  }): Promise<{ delivery: MailDelivery }> {
    try {
      await this.mail.send(input.message);
      await this.store.completeMail({
        operationId: input.operationId,
        outcome: 'accepted',
        purpose: input.purpose,
      });
      return { delivery: 'accepted' };
    } catch (error) {
      const outcome = classifyMailFailure(error);
      await this.store.completeMail({
        operationId: input.operationId,
        outcome,
        purpose: input.purpose,
      });
      const location = safeFailureLocation(error);
      this.logger.error(
        location
          ? `Email send outcome=${outcome} at=${location}`
          : `Email send outcome=${outcome}`,
      );
      if (outcome === 'unknown' || input.neutral) return { delivery: 'unknown' };
      throw abuseError(
        HttpStatus.SERVICE_UNAVAILABLE,
        ApiErrorCode.MAIL_REJECTED,
        'Email was rejected by the mail server',
      );
    }
  }

  private async requireTurnstile(
    action: string,
    token: string,
    ip: string,
    validation?: { operationKey: string; contentHash: string },
  ): Promise<void> {
    if (!token) {
      throw abuseError(
        HttpStatus.FORBIDDEN,
        ApiErrorCode.TURNSTILE_REQUIRED,
        'Turnstile token is required',
      );
    }
    const decision = await this.turnstile.verify({
      token,
      action,
      remoteIp: ip,
      ...(validation
        ? {
            idempotencyKey: turnstileValidationId({
              action,
              operationKey: validation.operationKey,
              contentHash: validation.contentHash,
              proof: token,
            }),
          }
        : {}),
    });
    if (decision.outcome === 'unavailable') {
      throw abuseError(
        HttpStatus.SERVICE_UNAVAILABLE,
        ApiErrorCode.TURNSTILE_UNAVAILABLE,
        'Turnstile verification is unavailable',
      );
    }
    if (decision.outcome === 'rejected') {
      throw abuseError(
        HttpStatus.FORBIDDEN,
        ApiErrorCode.TURNSTILE_FAILED,
        'Turnstile verification failed',
      );
    }
  }

  private assertIdempotencyKey(key: string): asserts key is string {
    if (!key || !IDEMPOTENCY_KEY.test(key)) {
      throw abuseError(
        HttpStatus.BAD_REQUEST,
        ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED,
        'Idempotency-Key is required',
      );
    }
  }

  private throwContentConflict(): never {
    throw abuseError(
      HttpStatus.CONFLICT,
      ApiErrorCode.IDEMPOTENCY_CONFLICT,
      'Idempotency key does not match request',
    );
  }

  private assertSameContent(
    storedHash: string,
    hash: string,
    storedOwner: string | null,
    ownerUserId: string,
  ): void {
    if (storedHash !== hash || storedOwner !== ownerUserId) {
      throw abuseError(
        HttpStatus.CONFLICT,
        ApiErrorCode.IDEMPOTENCY_CONFLICT,
        'Idempotency key does not match request',
      );
    }
  }

  private reservationError(
    reserved: Exclude<
      Awaited<ReturnType<AuthAbuseStore['reserveMail']>>,
      { kind: 'reserved' | 'replay' }
    >,
  ): AppException {
    if (reserved.kind === 'conflict') {
      return abuseError(
        HttpStatus.CONFLICT,
        ApiErrorCode.IDEMPOTENCY_CONFLICT,
        'Idempotency key does not match request',
      );
    }
    if (reserved.kind === 'cooldown') {
      return abuseError(
        HttpStatus.TOO_MANY_REQUESTS,
        ApiErrorCode.MAIL_COOLDOWN,
        'Email resend cooldown is active',
        { retryAt: reserved.retryAt.toISOString() },
      );
    }
    if (reserved.kind === 'quota') {
      return abuseError(
        HttpStatus.TOO_MANY_REQUESTS,
        ApiErrorCode.MAIL_QUOTA,
        'Email quota is exhausted',
        { retryAt: reserved.resetsAt.toISOString() },
      );
    }
    return abuseError(
      HttpStatus.TOO_MANY_REQUESTS,
      ApiErrorCode.MAIL_BUDGET,
      'Email budget is exhausted',
    );
  }
}

function deliveryOf(status: string): MailDelivery {
  if (status === 'accepted') return 'accepted';
  if (status === 'suppressed') return 'already_verified';
  return 'unknown';
}

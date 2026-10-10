import { Prisma } from '@bidplace/database';
import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';

import { PrismaService } from '../core/database';
import { Clock } from '../core/time';
import {
  LOGIN_PAIR_PAUSE_AFTER,
  LOGIN_PAUSE_MS,
  LOGIN_TURNSTILE_AFTER,
  MAIL_PURPOSES,
  MAIL_SPEND_STATUSES,
  OTP_PAUSE_AFTER,
  OTP_PAUSE_MS,
  OTP_TTL_MS,
  RESET_TOKEN_TTL_MS,
  PERSONAL_MAIL_WINDOW_MS,
  MAIL_MONTH_WINDOW_MS,
  cooldownAfterSends,
  latestExhaustedQuotaReset,
  recentLoginFailures,
} from './auth-abuse.policy';

type Tx = Prisma.TransactionClient;

export type MailPurpose = (typeof MAIL_PURPOSES)[number];

export type StoredOperation = {
  id: string;
  ownerUserId: string | null;
  email: string;
  purpose: string;
  idempotencyKey: string;
  contentHash: string;
  status: string;
  secretId: string | null;
  createdAt: Date;
};

export type ReserveMailResult =
  | {
      kind: 'reserved';
      operationId: string;
      secretId: string;
      rawSecret: string;
    }
  | { kind: 'replay'; status: string }
  | { kind: 'conflict' }
  | { kind: 'cooldown'; retryAt: Date }
  | { kind: 'quota'; resetsAt: Date }
  | { kind: 'budget' };

export type LoginTurnstile = 'unchecked' | 'accepted' | 'rejected' | 'unavailable';

export type LoginDecision =
  | { outcome: 'accepted' }
  | { outcome: 'invalid' }
  | { outcome: 'paused'; pausedUntil: Date }
  | { outcome: 'challenge' }
  | { outcome: 'turnstile_required' }
  | { outcome: 'turnstile_rejected' }
  | { outcome: 'turnstile_unavailable' };

export type VerifyDecision =
  | { outcome: 'verified' }
  | { outcome: 'already_verified' }
  | { outcome: 'invalid' }
  | { outcome: 'expired' }
  | { outcome: 'paused'; pausedUntil: Date }
  | { outcome: 'conflict' }
  | { outcome: 'missing' };

export type CorrectEmailDecision =
  | { outcome: 'updated'; email: string; slug: string | null }
  | { outcome: 'unchanged'; email: string; slug: string | null }
  | { outcome: 'taken' }
  | { outcome: 'verified' }
  | { outcome: 'missing' };

type CounterState = {
  failures: number;
  windowStart: Date;
  pausedUntil: Date | null;
};

const spendFilter = { in: [...MAIL_SPEND_STATUSES] };

function contentHash(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('\u0000')).digest('hex');
}

function verifiedNoSendRow(input: {
  ownerUserId: string;
  email: string;
  idempotencyKey: string;
  contentHash: string;
  now: Date;
}) {
  return {
    ownerUserId: input.ownerUserId,
    email: input.email,
    purpose: 'email_verification_send' as const,
    idempotencyKey: input.idempotencyKey,
    contentHash: input.contentHash,
    status: 'suppressed' as const,
    createdAt: input.now,
  };
}

export function mailContentHash(purpose: string, ownerUserId: string, email: string): string {
  return contentHash([purpose, ownerUserId, email]);
}

export function verifyContentHash(userId: string, email: string, code: string): string {
  return contentHash(['email_verification_verify', userId, email, code]);
}

export function resetContentHash(email: string): string {
  return contentHash(['password_reset_send', email]);
}

function subjectHash(scope: string, subject: string): string {
  return createHash('sha256').update(`${scope}\n${subject}`).digest('hex');
}

function codeHash(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

async function lockAll(tx: Tx, keys: string[]): Promise<void> {
  for (const key of [...new Set(keys)].sort()) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  }
}

export async function lockAbuseUser(tx: Tx, userId: string): Promise<void> {
  await lockAll(tx, [`abuse:user:${userId}`]);
  await tx.$queryRaw`
    SELECT id FROM users WHERE id = CAST(${userId} AS uuid) FOR UPDATE
  `;
}

@Injectable()
export class AuthAbuseStore {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async findByKey(purpose: string, idempotencyKey: string): Promise<StoredOperation | null> {
    return this.prisma.authAbuseOperation.findUnique({
      where: { purpose_idempotencyKey: { purpose, idempotencyKey } },
    });
  }

  async reserveMail(
    input: {
      purpose: MailPurpose;
      idempotencyKey: string;
      ownerUserId: string;
      contentHash: string;
      now: Date;
      dailyBudget: number;
      monthlyBudget: number;
    },
  ): Promise<ReserveMailResult> {
    return this.transaction((tx) => this.reserveInTransaction(tx, input));
  }

  async suppressReset(input: {
    idempotencyKey: string;
    email: string;
    contentHash: string;
    now: Date;
  }): Promise<'replay' | 'conflict' | 'stored'> {
    return this.transaction(async (tx) => {
      await lockAll(tx, [`op:password_reset_send:${input.idempotencyKey}`]);
      const existing = await tx.authAbuseOperation.findUnique({
        where: {
          purpose_idempotencyKey: {
            purpose: 'password_reset_send',
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) {
        return existing.contentHash === input.contentHash ? 'replay' : 'conflict';
      }
      await tx.authAbuseOperation.create({
        data: {
          email: input.email,
          purpose: 'password_reset_send',
          idempotencyKey: input.idempotencyKey,
          contentHash: input.contentHash,
          status: 'suppressed',
          createdAt: input.now,
        },
      });
      return 'stored';
    });
  }

  async recordVerifiedNoSend(input: {
    idempotencyKey: string;
    ownerUserId: string;
    email: string;
    contentHash: string;
    now: Date;
  }): Promise<'stored' | 'replay' | 'conflict'> {
    return this.transaction(async (tx) => {
      await lockAll(tx, [`op:email_verification_send:${input.idempotencyKey}`]);
      const existing = await tx.authAbuseOperation.findUnique({
        where: {
          purpose_idempotencyKey: {
            purpose: 'email_verification_send',
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) {
        return existing.contentHash === input.contentHash && existing.ownerUserId === input.ownerUserId
          ? 'replay'
          : 'conflict';
      }
      await tx.authAbuseOperation.create({
        data: verifiedNoSendRow(input),
      });
      return 'stored';
    });
  }

  async completeMail(input: {
    operationId: string;
    outcome: 'accepted' | 'rejected' | 'unknown';
    purpose: MailPurpose;
    verifyUserId?: string;
    now?: Date;
  }): Promise<void> {
    const now = input.now ?? new Date();
    await this.transaction(async (tx) => {
      const initial = await tx.authAbuseOperation.findUnique({
        where: { id: input.operationId },
      });
      if (!initial || initial.status !== 'reserved') return;

      const verifyUserId = input.verifyUserId;
      const verifying =
        input.outcome === 'accepted' &&
        verifyUserId !== undefined &&
        initial.secretId !== null &&
        initial.ownerUserId === verifyUserId;
      if (verifying) await lockAbuseUser(tx, verifyUserId);

      const current = verifying
        ? await tx.authAbuseOperation.findUnique({ where: { id: input.operationId } })
        : initial;
      if (
        !current ||
        current.status !== 'reserved' ||
        current.ownerUserId !== initial.ownerUserId ||
        current.email !== initial.email ||
        current.secretId !== initial.secretId
      ) {
        return;
      }

      await tx.authAbuseOperation.update({
        where: { id: current.id },
        data: { status: input.outcome, completedAt: now },
      });

      if (input.outcome === 'rejected' && current.secretId) {
        await this.invalidateSecret(tx, input.purpose, current.secretId, now);
      }
      if (!verifying || verifyUserId === undefined || !current.secretId) return;

      const user = await tx.user.findUnique({
        where: { id: verifyUserId },
        select: { id: true, email: true, emailVerifiedAt: true },
      });
      if (!user || user.emailVerifiedAt || user.email !== current.email) return;
      const consumed = await tx.emailVerificationCode.updateMany({
        where: {
          id: current.secretId,
          userId: user.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });
      if (consumed.count === 1) {
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: now },
        });
      }
    });
  }

  async evaluateLogin(input: {
    email: string;
    ip: string;
    passwordAccepted: boolean;
    turnstile: LoginTurnstile;
    now: Date;
  }): Promise<LoginDecision> {
    return this.transaction(async (tx) => {
      const emailHash = subjectHash('login_email', input.email);
      const pairHash = subjectHash('login_pair', `${input.email}\n${input.ip}`);
      await lockAll(tx, [
        `counter:login_email:${emailHash}`,
        `counter:login_pair:${pairHash}`,
      ]);
      const emailRow = await this.ensureCounter(tx, 'login_email', emailHash, input.now);
      const pairRow = await this.ensureCounter(tx, 'login_pair', pairHash, input.now);
      const recent = recentLoginFailures(emailRow.failureTimestamps, input.now);
      const pairState = refreshPair(pairRow, input.now);
      const persistEmail = (timestamps: Date[]) =>
        this.persistEmailFailures(tx, emailRow.id, timestamps, input.now);

      if (pairState.pausedUntil && pairState.pausedUntil > input.now) {
        await persistEmail(recent);
        await this.persistCounter(tx, pairRow.id, pairState);
        return { outcome: 'paused', pausedUntil: pairState.pausedUntil };
      }

      if (recent.length >= LOGIN_TURNSTILE_AFTER) {
        if (input.turnstile === 'unchecked') {
          await persistEmail(recent);
          await this.persistCounter(tx, pairRow.id, pairState);
          return { outcome: 'challenge' };
        }
        if (input.turnstile === 'unavailable') {
          await persistEmail(recent);
          await this.persistCounter(tx, pairRow.id, pairState);
          return { outcome: 'turnstile_unavailable' };
        }
        if (input.turnstile === 'rejected') {
          await persistEmail(recent);
          await this.persistCounter(tx, pairRow.id, pairState);
          return { outcome: 'turnstile_rejected' };
        }
      }

      if (!input.passwordAccepted) {
        const recorded = recentLoginFailures([...recent, input.now], input.now);
        pairState.failures += 1;
        if (pairState.failures >= LOGIN_PAIR_PAUSE_AFTER) {
          pairState.pausedUntil = new Date(input.now.getTime() + LOGIN_PAUSE_MS);
          await persistEmail(recorded);
          await this.persistCounter(tx, pairRow.id, pairState);
          return { outcome: 'paused', pausedUntil: pairState.pausedUntil };
        }
        await persistEmail(recorded);
        await this.persistCounter(tx, pairRow.id, pairState);
        return { outcome: 'invalid' };
      }

      pairState.failures = 0;
      pairState.pausedUntil = null;
      pairState.windowStart = input.now;
      await persistEmail(recent);
      await this.persistCounter(tx, pairRow.id, pairState);
      return { outcome: 'accepted' };
    });
  }

  async verifyEmailCode(input: {
    userId: string;
    code: string;
    idempotencyKey: string;
  }): Promise<VerifyDecision> {
    return this.transaction(async (tx) => {
      await lockAll(tx, [
        `abuse:user:${input.userId}`,
        `op:email_verification_verify:${input.idempotencyKey}`,
        `counter:otp_verify:${input.userId}`,
      ]);
      await tx.$queryRaw`
        SELECT id FROM users WHERE id = CAST(${input.userId} AS uuid) FOR UPDATE
      `;
      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true, emailVerifiedAt: true },
      });
      if (!user) return { outcome: 'missing' };

      const boundHash = verifyContentHash(user.id, user.email, input.code);
      const existing = await tx.authAbuseOperation.findUnique({
        where: {
          purpose_idempotencyKey: {
            purpose: 'email_verification_verify',
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) {
        if (existing.contentHash !== boundHash || existing.ownerUserId !== user.id) {
          return { outcome: 'conflict' };
        }
        return replayVerify(existing);
      }

      const admittedAt = this.clock.now();
      if (user.emailVerifiedAt) {
        await this.writeVerifyOperation(
          tx,
          user.id,
          user.email,
          boundHash,
          input.idempotencyKey,
          admittedAt,
          'verified',
        );
        return { outcome: 'already_verified' };
      }

      const counterHash = subjectHash('otp_verify', user.id);
      const counter = await this.ensureCounter(tx, 'otp_verify', counterHash, admittedAt);
      const pause = refreshOtpPause(counter, admittedAt);
      const activePause = pause.pausedUntil;
      if (activePause && activePause > admittedAt) {
        await this.persistCounter(tx, counter.id, pause);
        await this.writeVerifyOperation(
          tx,
          user.id,
          user.email,
          boundHash,
          input.idempotencyKey,
          admittedAt,
          'paused',
          activePause,
        );
        return { outcome: 'paused', pausedUntil: activePause };
      }

      const record = await tx.emailVerificationCode.findFirst({
        where: { userId: user.id, usedAt: null, expiresAt: { gt: admittedAt } },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) {
        await this.persistCounter(tx, counter.id, pause);
        await this.writeVerifyOperation(
          tx,
          user.id,
          user.email,
          boundHash,
          input.idempotencyKey,
          admittedAt,
          'expired',
        );
        return { outcome: 'expired' };
      }

      if (record.codeHash !== codeHash(input.code)) {
        pause.failures += 1;
        if (pause.failures >= OTP_PAUSE_AFTER) {
          pause.pausedUntil = new Date(admittedAt.getTime() + OTP_PAUSE_MS);
        }
        const pausedUntil = pause.pausedUntil;
        const status = pausedUntil && pausedUntil > admittedAt ? 'paused' : 'invalid';
        await this.persistCounter(tx, counter.id, pause);
        await this.writeVerifyOperation(
          tx,
          user.id,
          user.email,
          boundHash,
          input.idempotencyKey,
          admittedAt,
          status,
          status === 'paused' ? pausedUntil : null,
        );
        if (status === 'paused' && pausedUntil) {
          return { outcome: 'paused', pausedUntil };
        }
        return { outcome: 'invalid' };
      }

      const consumedAt = this.clock.now();
      if (record.expiresAt <= consumedAt) {
        await this.writeVerifyOperation(
          tx,
          user.id,
          user.email,
          boundHash,
          input.idempotencyKey,
          consumedAt,
          'expired',
        );
        return { outcome: 'expired' };
      }

      const consumed = await tx.emailVerificationCode.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: consumedAt } },
        data: { usedAt: consumedAt },
      });
      if (consumed.count !== 1) {
        await this.writeVerifyOperation(
          tx,
          user.id,
          user.email,
          boundHash,
          input.idempotencyKey,
          consumedAt,
          'expired',
        );
        return { outcome: 'expired' };
      }

      await tx.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: consumedAt },
      });
      await this.persistCounter(tx, counter.id, pause);
      await this.writeVerifyOperation(
        tx,
        user.id,
        user.email,
        boundHash,
        input.idempotencyKey,
        consumedAt,
        'verified',
      );
      return { outcome: 'verified' };
    });
  }

  async correctEmail(input: {
    userId: string;
    email: string;
    now: Date;
  }): Promise<CorrectEmailDecision> {
    try {
      return await this.transaction(async (tx) => {
        await lockAbuseUser(tx, input.userId);
        const user = await tx.user.findUnique({
          where: { id: input.userId },
          select: { id: true, email: true, emailVerifiedAt: true, slug: true },
        });
        if (!user) return { outcome: 'missing' };
        if (user.emailVerifiedAt) return { outcome: 'verified' };
        if (user.email === input.email) {
          return { outcome: 'unchanged', email: user.email, slug: user.slug };
        }

        const taken = await tx.user.findUnique({
          where: { email: input.email },
          select: { id: true },
        });
        if (taken && taken.id !== user.id) return { outcome: 'taken' };

        await tx.user.update({
          where: { id: user.id },
          data: { email: input.email },
        });
        await tx.emailVerificationCode.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: input.now },
        });
        await tx.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: input.now },
        });
        return { outcome: 'updated', email: input.email, slug: user.slug };
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        return { outcome: 'taken' };
      }
      throw error;
    }
  }

  async readVerificationState(userId: string, now: Date): Promise<{
    email: string;
    verified: boolean;
    sendStatus: 'none' | 'accepted' | 'unknown' | 'rejected';
    codeExpiresAt: Date | null;
    resendAvailableAt: Date | null;
    pausedUntil: Date | null;
    quotaResetsAt: Date | null;
  } | null> {
    return this.transaction(async (tx) => {
      await lockAll(tx, [`abuse:user:${userId}`]);
      await tx.$queryRaw`
        SELECT id FROM users WHERE id = CAST(${userId} AS uuid) FOR UPDATE
      `;
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true, emailVerifiedAt: true },
      });
      if (!user) return null;

      const latest = await tx.authAbuseOperation.findFirst({
        where: {
          ownerUserId: userId,
          email: user.email,
          purpose: 'email_verification_send',
        },
        orderBy: { createdAt: 'desc' },
      });
      const sendStatus = publicSendStatus(latest?.status);
      const code =
        latest?.secretId && (sendStatus === 'accepted' || sendStatus === 'unknown')
          ? await tx.emailVerificationCode.findFirst({
              where: {
                id: latest.secretId,
                userId,
                usedAt: null,
                expiresAt: { gt: now },
              },
              select: { expiresAt: true },
            })
          : null;
      const counter = await tx.authAbuseCounter.findUnique({
        where: {
          scope_subjectHash: {
            scope: 'otp_verify',
            subjectHash: subjectHash('otp_verify', userId),
          },
        },
      });
      const pausedUntil =
        counter?.pausedUntil && counter.pausedUntil > now ? counter.pausedUntil : null;

      return {
        email: user.email,
        verified: user.emailVerifiedAt !== null,
        sendStatus,
        codeExpiresAt: code?.expiresAt ?? null,
        resendAvailableAt: await this.resendAvailableAt(tx, userId, now),
        pausedUntil,
        quotaResetsAt: (await this.personalQuota(tx, userId, user.email, now)).resetsAt,
      };
    });
  }

  private async reserveInTransaction(
    tx: Tx,
    input: {
      purpose: MailPurpose;
      idempotencyKey: string;
      ownerUserId: string;
      contentHash: string;
      now: Date;
      dailyBudget: number;
      monthlyBudget: number;
    },
  ): Promise<ReserveMailResult> {
    await lockAll(tx, [
      'abuse:mail:global',
      `abuse:user:${input.ownerUserId}`,
      `op:${input.purpose}:${input.idempotencyKey}`,
    ]);
    await tx.$queryRaw`
      SELECT id FROM users WHERE id = CAST(${input.ownerUserId} AS uuid) FOR UPDATE
    `;
    const user = await tx.user.findUnique({
      where: { id: input.ownerUserId },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user) return { kind: 'conflict' };

    const hash =
      input.purpose === 'password_reset_send'
        ? resetContentHash(user.email)
        : mailContentHash(input.purpose, user.id, user.email);
    if (hash !== input.contentHash) return { kind: 'conflict' };

    const existing = await tx.authAbuseOperation.findUnique({
      where: {
        purpose_idempotencyKey: {
          purpose: input.purpose,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (existing) {
      if (existing.contentHash !== hash || existing.ownerUserId !== user.id) {
        return { kind: 'conflict' };
      }
      return { kind: 'replay', status: existing.status };
    }

    if (input.purpose === 'email_verification_send' && user.emailVerifiedAt) {
      await tx.authAbuseOperation.create({
        data: verifiedNoSendRow({
          ownerUserId: user.id,
          email: user.email,
          idempotencyKey: input.idempotencyKey,
          contentHash: hash,
          now: input.now,
        }),
      });
      return { kind: 'replay', status: 'suppressed' };
    }

    const dayStart = new Date(input.now.getTime() - PERSONAL_MAIL_WINDOW_MS);
    const monthStart = new Date(input.now.getTime() - MAIL_MONTH_WINDOW_MS);
    const [quota, dailyCount, monthlyCount, priorSends, latest] = await Promise.all([
      this.personalQuota(tx, user.id, user.email, input.now),
      tx.authAbuseOperation.count({
        where: {
          purpose: { in: [...MAIL_PURPOSES] },
          status: spendFilter,
          createdAt: { gt: dayStart },
        },
      }),
      tx.authAbuseOperation.count({
        where: {
          purpose: { in: [...MAIL_PURPOSES] },
          status: spendFilter,
          createdAt: { gt: monthStart },
        },
      }),
      tx.authAbuseOperation.count({
        where: {
          ownerUserId: user.id,
          purpose: input.purpose,
          status: spendFilter,
        },
      }),
      tx.authAbuseOperation.findFirst({
        where: {
          ownerUserId: user.id,
          purpose: input.purpose,
          status: spendFilter,
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    if (quota.resetsAt) {
      await this.suppressAdmittedReset(tx, input, user.email, hash);
      return { kind: 'quota', resetsAt: quota.resetsAt };
    }
    if (dailyCount >= input.dailyBudget || monthlyCount >= input.monthlyBudget) {
      await this.suppressAdmittedReset(tx, input, user.email, hash);
      return { kind: 'budget' };
    }

    const wait = cooldownAfterSends(priorSends);
    if (latest && wait > 0 && input.now.getTime() < latest.createdAt.getTime() + wait) {
      await this.suppressAdmittedReset(tx, input, user.email, hash);
      return { kind: 'cooldown', retryAt: new Date(latest.createdAt.getTime() + wait) };
    }

    const rawSecret =
      input.purpose === 'email_verification_send'
        ? String(randomInt(0, 1_000_000)).padStart(6, '0')
        : randomBytes(32).toString('base64url');
    const secretExpiresAt = new Date(
      input.now.getTime() +
        (input.purpose === 'email_verification_send' ? OTP_TTL_MS : RESET_TOKEN_TTL_MS),
    );
    const secretId = randomUUID();

    if (input.purpose === 'email_verification_send') {
      await tx.emailVerificationCode.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: input.now },
      });
      await tx.emailVerificationCode.create({
        data: {
          id: secretId,
          userId: user.id,
          codeHash: codeHash(rawSecret),
          expiresAt: secretExpiresAt,
        },
      });
    } else {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: input.now },
      });
      await tx.passwordResetToken.create({
        data: {
          id: secretId,
          userId: user.id,
          tokenHash: codeHash(rawSecret),
          expiresAt: secretExpiresAt,
        },
      });
    }

    const operation = await tx.authAbuseOperation.create({
      data: {
        ownerUserId: user.id,
        email: user.email,
        purpose: input.purpose,
        idempotencyKey: input.idempotencyKey,
        contentHash: hash,
        status: 'reserved',
        secretId,
        createdAt: input.now,
      },
    });

    return {
      kind: 'reserved',
      operationId: operation.id,
      secretId,
      rawSecret,
    };
  }

  private async suppressAdmittedReset(
    tx: Tx,
    input: { purpose: MailPurpose; idempotencyKey: string; ownerUserId: string; now: Date },
    email: string,
    contentHash: string,
  ): Promise<void> {
    if (input.purpose !== 'password_reset_send') return;
    await tx.authAbuseOperation.create({
      data: {
        ownerUserId: input.ownerUserId,
        email,
        purpose: input.purpose,
        idempotencyKey: input.idempotencyKey,
        contentHash,
        status: 'suppressed',
        createdAt: input.now,
      },
    });
  }

  private async personalQuota(
    db: Tx | PrismaService,
    userId: string,
    email: string,
    now: Date,
  ): Promise<{ resetsAt: Date | null }> {
    const since = new Date(now.getTime() - PERSONAL_MAIL_WINDOW_MS);
    const spends = await db.authAbuseOperation.findMany({
      where: {
        purpose: { in: [...MAIL_PURPOSES] },
        status: spendFilter,
        createdAt: { gt: since },
        OR: [{ ownerUserId: userId }, { email }],
      },
      select: { ownerUserId: true, email: true, createdAt: true },
    });
    return {
      resetsAt: latestExhaustedQuotaReset([
        spends.filter((spend) => spend.ownerUserId === userId).map((spend) => spend.createdAt),
        spends.filter((spend) => spend.email === email).map((spend) => spend.createdAt),
      ]),
    };
  }

  private async resendAvailableAt(
    db: Tx | PrismaService,
    userId: string,
    now: Date,
  ): Promise<Date | null> {
    const prior = await db.authAbuseOperation.count({
      where: {
        ownerUserId: userId,
        purpose: 'email_verification_send',
        status: spendFilter,
      },
    });
    const latest = await db.authAbuseOperation.findFirst({
      where: {
        ownerUserId: userId,
        purpose: 'email_verification_send',
        status: spendFilter,
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (!latest) return null;
    const retryAt = new Date(latest.createdAt.getTime() + cooldownAfterSends(prior));
    return retryAt > now ? retryAt : null;
  }

  private async invalidateSecret(
    tx: Tx,
    purpose: MailPurpose,
    secretId: string,
    now: Date,
  ): Promise<void> {
    if (purpose === 'email_verification_send') {
      await tx.emailVerificationCode.updateMany({
        where: { id: secretId, usedAt: null },
        data: { usedAt: now },
      });
      return;
    }
    await tx.passwordResetToken.updateMany({
      where: { id: secretId, usedAt: null },
      data: { usedAt: now },
    });
  }

  private async ensureCounter(tx: Tx, scope: string, hash: string, now: Date) {
    const current = await tx.authAbuseCounter.findUnique({
      where: { scope_subjectHash: { scope, subjectHash: hash } },
    });
    if (current) return current;
    return tx.authAbuseCounter.create({
      data: { scope, subjectHash: hash, failures: 0, windowStart: now, failureTimestamps: [] },
    });
  }

  private async persistEmailFailures(
    tx: Tx,
    id: string,
    timestamps: Date[],
    now: Date,
  ): Promise<void> {
    await tx.authAbuseCounter.update({
      where: { id },
      data: {
        failures: timestamps.length,
        windowStart: timestamps[0] ?? now,
        pausedUntil: null,
        failureTimestamps: timestamps,
      },
    });
  }

  private async persistCounter(tx: Tx, id: string, state: CounterState): Promise<void> {
    await tx.authAbuseCounter.update({
      where: { id },
      data: {
        failures: state.failures,
        windowStart: state.windowStart,
        pausedUntil: state.pausedUntil,
      },
    });
  }

  private async writeVerifyOperation(
    tx: Tx,
    userId: string,
    email: string,
    hash: string,
    idempotencyKey: string,
    at: Date,
    status: 'verified' | 'invalid' | 'expired' | 'paused',
    resultDeadline: Date | null = null,
  ): Promise<void> {
    await tx.authAbuseOperation.create({
      data: {
        ownerUserId: userId,
        email,
        purpose: 'email_verification_verify',
        idempotencyKey,
        contentHash: hash,
        status,
        resultDeadline,
        createdAt: at,
        completedAt: at,
      },
    });
  }

  private transaction<T>(callback: (tx: Tx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback, { timeout: 10_000 });
  }
}

function refreshPair(
  row: { failures: number; windowStart: Date; pausedUntil: Date | null },
  now: Date,
): CounterState & { pausedUntil: Date | null } {
  if (row.pausedUntil && row.pausedUntil > now) {
    return {
      failures: row.failures,
      windowStart: row.windowStart,
      pausedUntil: row.pausedUntil,
    };
  }
  if (row.pausedUntil && row.pausedUntil <= now) {
    return { failures: 0, windowStart: now, pausedUntil: null };
  }
  return { failures: row.failures, windowStart: row.windowStart, pausedUntil: null };
}

function refreshOtpPause(
  row: { failures: number; windowStart: Date; pausedUntil: Date | null },
  now: Date,
): CounterState {
  if (row.pausedUntil && row.pausedUntil <= now) {
    return { failures: 0, windowStart: now, pausedUntil: null };
  }
  return {
    failures: row.failures,
    windowStart: row.windowStart,
    pausedUntil: row.pausedUntil,
  };
}

function replayVerify(existing: {
  status: string;
  resultDeadline: Date | null;
}): VerifyDecision {
  if (existing.status === 'verified') return { outcome: 'verified' };
  if (existing.status === 'expired') return { outcome: 'expired' };
  if (existing.status === 'paused' && existing.resultDeadline) {
    return { outcome: 'paused', pausedUntil: existing.resultDeadline };
  }
  return { outcome: 'invalid' };
}

function publicSendStatus(
  status: string | undefined,
): 'none' | 'accepted' | 'unknown' | 'rejected' {
  if (!status) return 'none';
  if (status === 'accepted') return 'accepted';
  if (status === 'rejected') return 'rejected';
  if (status === 'suppressed') return 'none';
  return 'unknown';
}

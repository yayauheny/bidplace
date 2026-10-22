import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { PrismaClient } from '@bidplace/database';
import { ApiErrorCode } from '@bidplace/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PasswordHasherService } from '../../src/auth/password-hasher.service';
import { AuthAbuseService } from '../../src/auth-abuse/auth-abuse.service';
import {
  cooldownAfterSends,
  LOGIN_WINDOW_MS,
  MAIL_BUDGET_PURPOSES,
  OTP_PAUSE_MS,
  OTP_TTL_MS,
  PERSONAL_MAIL_WINDOW_MS,
} from '../../src/auth-abuse/auth-abuse.policy';
import {
  AuthAbuseStore,
  lockAbuseUser,
  mailContentHash,
  resetContentHash,
  verifyContentHash,
  otpCodeHash,
} from '../../src/auth-abuse/auth-abuse.store';
import { DisposableEmailList } from '../../src/auth-abuse/disposable-email';
import {
  ScriptedTurnstileVerifier,
  TurnstileVerifier,
  type TurnstileCheck,
  type TurnstileDecision,
} from '../../src/auth-abuse/turnstile-verifier';
import {
  syntheticServerEnv,
  type ServerEnv,
} from '../../src/core/config/synthetic-server-env';
import { Clock, SystemClock } from '../../src/core/time';
import { PasswordResetService } from '../../src/password-reset/password-reset.service';
import { idempotencyKey, turnstileToken } from './abuse-request';

const databaseUrl = process.env.AUTH_ABUSE_TEST_DATABASE_URL;
if (process.env.CI && !databaseUrl)
  throw new Error('AUTH_ABUSE_TEST_DATABASE_URL is required in CI');
const repoRoot = resolve(__dirname, '../../../..');

function assertIsolatedDatabase(url: string): void {
  const parsed = new URL(url);
  const name = parsed.pathname.replace(/^\//, '');
  const port = parsed.port;
  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new Error('Auth abuse test database must use PostgreSQL');
  }
  if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
    throw new Error('Auth abuse test database must be on localhost');
  }
  if (!port || port === '5432') {
    throw new Error('Auth abuse test database must use a non-default port');
  }
  if (name !== 'bidplace_auth_abuse_test') {
    throw new Error(`Refusing database "${name}"`);
  }
}

function migrateIsolatedDatabase(url: string): void {
  const stage = mkdtempSync(join(tmpdir(), 'bidplace-auth-abuse-'));
  try {
    cpSync(
      resolve(repoRoot, 'packages/database/prisma'),
      join(stage, 'prisma'),
      {
        recursive: true,
      },
    );
    deployMigrations(stage, url);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

function recordedMail() {
  let captured = '';
  return {
    mail: {
      send: async (message: { text: string }) => {
        const match = /verification code is (\d{6})/.exec(message.text);
        if (match?.[1]) captured = match[1];
      },
    },
    code(): string {
      if (!/^\d{6}$/.test(captured))
        throw new Error('Verification code was not captured');
      return captured;
    },
    wrongCode(): string {
      if (!/^\d{6}$/.test(captured))
        throw new Error('Verification code was not captured');
      return String((Number(captured) + 1) % 1_000_000).padStart(6, '0');
    },
  };
}

class FixtureClock extends Clock {
  constructor(private current: Date) {
    super();
  }

  now(): Date {
    return this.current;
  }

  set(next: Date): void {
    this.current = next;
  }
}

class SteppedFixtureClock extends Clock {
  private index = 0;

  constructor(private readonly times: readonly Date[]) {
    super();
  }

  now(): Date {
    const time = this.times[this.index];
    if (!time)
      throw new Error(
        'Verification clock was read more times than the fixture supplied',
      );
    this.index += 1;
    return time;
  }
}

function createHarness(
  prisma: PrismaClient,
  env: ServerEnv,
  mail: { send: (message: { text: string }) => Promise<void> },
  turnstile: TurnstileVerifier = new ScriptedTurnstileVerifier('localhost'),
  clock: Clock = new SystemClock(),
) {
  const isolatedEnv =
    env.AUTH_MAIL_DAILY_BUDGET === 200 && env.AUTH_MAIL_MONTHLY_BUDGET === 3000
      ? {
          ...env,
          AUTH_MAIL_DAILY_BUDGET: 1_000_000,
          AUTH_MAIL_MONTHLY_BUDGET: 1_000_000,
        }
      : env;
  const store = new AuthAbuseStore(prisma as never, clock, env);
  const service = new AuthAbuseService(
    store,
    prisma as never,
    mail as never,
    turnstile,
    new DisposableEmailList(),
    isolatedEnv,
  );
  return { store, service };
}

type UserGateLock = {
  classid: string;
  objid: string;
  objsubid: number;
};

function abuseUserLockKey(userId: string): string {
  return `abuse:user:${userId}`;
}

async function readHeldUserGate(
  tx: Pick<PrismaClient, '$queryRaw'>,
  userId: string,
): Promise<UserGateLock> {
  const key = abuseUserLockKey(userId);
  const rows = await tx.$queryRaw<UserGateLock[]>`
    WITH identity AS (
      SELECT int8send(hashtextextended(${key}, 0)) AS raw
    ),
    expected AS (
      SELECT
        (
          (get_byte(raw, 0)::bigint << 24)
          + (get_byte(raw, 1)::bigint << 16)
          + (get_byte(raw, 2)::bigint << 8)
          + get_byte(raw, 3)::bigint
        )::oid AS classid,
        (
          (get_byte(raw, 4)::bigint << 24)
          + (get_byte(raw, 5)::bigint << 16)
          + (get_byte(raw, 6)::bigint << 8)
          + get_byte(raw, 7)::bigint
        )::oid AS objid
      FROM identity
    )
    SELECT lock.classid::text AS classid,
           lock.objid::text AS objid,
           lock.objsubid::int AS objsubid
    FROM pg_locks AS lock
    JOIN expected
      ON lock.classid = expected.classid
     AND lock.objid = expected.objid
    WHERE lock.locktype = 'advisory'
      AND lock.granted
      AND lock.objsubid = 1
      AND lock.pid = pg_backend_pid()
      AND lock.database = (SELECT oid FROM pg_database WHERE datname = current_database())
  `;
  const held = rows[0];
  if (!held || rows.length !== 1) {
    throw new Error('User advisory lock was not held by the gate');
  }
  return held;
}

async function advisoryWaiters(
  prisma: PrismaClient,
  gate: UserGateLock,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ waiting: number }>>`
    SELECT COUNT(*)::int AS waiting
    FROM pg_locks AS lock
    JOIN pg_stat_activity AS activity ON activity.pid = lock.pid
    WHERE lock.locktype = 'advisory'
      AND NOT lock.granted
      AND activity.datname = current_database()
      AND lock.database = (SELECT oid FROM pg_database WHERE datname = current_database())
      AND lock.classid = CAST(${gate.classid} AS oid)
      AND lock.objid = CAST(${gate.objid} AS oid)
      AND lock.objsubid = ${gate.objsubid}
  `;
  const waiting = rows[0]?.waiting;
  if (typeof waiting === 'number') return waiting;
  if (typeof waiting === 'bigint') return Number(waiting);
  throw new Error('User advisory lock waiter query returned no count');
}

async function waitForAdvisoryWaiters(
  prisma: PrismaClient,
  gate: UserGateLock,
  expected: number,
): Promise<void> {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    if ((await advisoryWaiters(prisma, gate)) >= expected) return;
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  throw new Error(`Expected ${expected} sessions waiting on the user lock`);
}

function holdUserLock(prisma: PrismaClient, userId: string) {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markHeld: (gate: UserGateLock) => void = () => {};
  const held = new Promise<UserGateLock>((resolve) => {
    markHeld = resolve;
  });
  const done = prisma.$transaction(
    async (tx) => {
      await lockAbuseUser(tx, userId);
      markHeld(await readHeldUserGate(tx, userId));
      await released;
    },
    { timeout: 20_000 },
  );
  return { held, release: () => release(), done };
}

async function createResetUser(prisma: PrismaClient, label: string) {
  const slug = `${label.slice(0, 6)}-${randomUUID().slice(0, 6)}`;
  const user = await createUser(
    prisma,
    `${label}-${randomUUID()}@example.com`,
    slug,
  );
  await prisma.termsAcceptance.create({
    data: {
      userId: user.id,
      rulesVersion: '2026-10',
      acceptedAt: new Date('2026-10-01T00:00:00.000Z'),
    },
  });
  const raw = `reset-${randomUUID()}`;
  const token = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: createHash('sha256').update(raw).digest('hex'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return { user, raw, tokenId: token.id, slug };
}

async function runResetCorrectionRace(
  prisma: PrismaClient,
  reset: PasswordResetService,
  service: AuthAbuseService,
  input: {
    userId: string;
    raw: string;
    tokenId: string;
    nextEmail: string;
    slug: string;
    first: 'reset' | 'correction';
  },
) {
  const gate = holdUserLock(prisma, input.userId);
  const work: Array<Promise<unknown>> = [];
  const heldGate = await gate.held;
  try {
    const baseline = await advisoryWaiters(prisma, heldGate);
    const resetCall = () =>
      reset.resetPassword(input.raw, 'new-password-9', { ip: '203.0.113.40' });
    const correctCall = () =>
      service.correctEmail({ userId: input.userId, email: input.nextEmail });
    let resetPromise: Promise<void>;
    let correctPromise: Promise<void>;
    if (input.first === 'reset') {
      resetPromise = resetCall();
      work.push(resetPromise);
      await waitForAdvisoryWaiters(prisma, heldGate, baseline + 1);
      correctPromise = correctCall();
      work.push(correctPromise);
    } else {
      correctPromise = correctCall();
      work.push(correctPromise);
      await waitForAdvisoryWaiters(prisma, heldGate, baseline + 1);
      resetPromise = resetCall();
      work.push(resetPromise);
    }
    await waitForAdvisoryWaiters(prisma, heldGate, baseline + 2);
    gate.release();
    const [resetResult, correctResult] = await Promise.allSettled([
      resetPromise,
      correctPromise,
    ]);
    expect(correctResult?.status).toBe('fulfilled');
    if (resetResult?.status === 'rejected') {
      expect(resetResult.reason).toMatchObject({
        apiCode: ApiErrorCode.PASSWORD_RESET_INVALID,
      });
    } else {
      expect(resetResult?.status).toBe('fulfilled');
    }
    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: input.userId },
    });
    expect(stored.email).toBe(input.nextEmail);
    expect(stored.slug).toBe(input.slug);
    expect(stored.sessionVersion).toBe(
      resetResult?.status === 'fulfilled' ? 1 : 0,
    );
    expect(stored.passwordHash === 'hash').toBe(
      resetResult?.status !== 'fulfilled',
    );
    expect(
      await prisma.termsAcceptance.count({ where: { userId: input.userId } }),
    ).toBe(1);
    expect(
      (
        await prisma.passwordResetToken.findUniqueOrThrow({
          where: { id: input.tokenId },
        })
      ).usedAt,
    ).toEqual(expect.any(Date));
    if (input.first === 'reset') expect(resetResult?.status).toBe('fulfilled');
    if (input.first === 'correction') {
      expect(resetResult?.status).toBe('rejected');
      expect(resetResult?.reason).toMatchObject({
        apiCode: ApiErrorCode.PASSWORD_RESET_INVALID,
      });
    }
    await expect(
      reset.resetPassword(input.raw, 'other-password-9', {
        ip: '203.0.113.40',
      }),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.PASSWORD_RESET_INVALID,
    });
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: input.userId } }))
        .sessionVersion,
    ).toBe(stored.sessionVersion);
  } finally {
    gate.release();
    await gate.done;
    await Promise.allSettled(work);
  }
}

async function issueVerificationCode(
  prisma: PrismaClient,
  userId: string,
  code: string,
  expiresAt: Date,
) {
  const owner = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return prisma.emailVerificationCode.create({
    data: {
      userId,
      version: owner.sessionVersion,
      codeHash: otpCodeHash(
        syntheticServerEnv().OTP_HASH_SECRET,
        userId,
        owner.email,
        code,
      ),
      expiresAt,
    },
  });
}

function otpVerifyCounter(prisma: PrismaClient, userId: string) {
  return prisma.authAbuseCounter.findUniqueOrThrow({
    where: {
      scope_subjectHash: {
        scope: 'otp_verify',
        subjectHash: createHash('sha256')
          .update(`otp_verify\n${userId}`)
          .digest('hex'),
      },
    },
  });
}

async function createUser(prisma: PrismaClient, email: string, slug: string) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: 'hash',
      slug,
      status: 'active',
      sessionVersion: 0,
    },
  });
}

describe.skipIf(!databaseUrl)('auth abuse postgres owner', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    assertIsolatedDatabase(databaseUrl!);
    migrateIsolatedDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();
  }, 180_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('commits a wrong OTP attempt and ignores a replay of the same key', async () => {
    const user = await createUser(
      prisma,
      `otp-${randomUUID()}@example.com`,
      `otp-${randomUUID()}`,
    );
    const recorded = recordedMail();
    const { service } = createHarness(
      prisma,
      syntheticServerEnv(),
      recorded.mail,
    );
    await service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.10',
    });
    const wrong = recorded.wrongCode();
    const key = idempotencyKey();
    await expect(
      service.verifyEmailCode({
        userId: user.id,
        code: wrong,
        idempotencyKey: key,
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.OTP_INVALID });

    const next = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    const restarted = createHarness(next, syntheticServerEnv(), recorded.mail);
    await expect(
      restarted.service.verifyEmailCode({
        userId: user.id,
        code: wrong,
        idempotencyKey: key,
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.OTP_INVALID });
    expect(
      await prisma.authAbuseOperation.count({
        where: {
          ownerUserId: user.id,
          purpose: 'email_verification_verify',
          status: 'invalid',
        },
      }),
    ).toBe(1);
    await next.$disconnect();
  });

  it('serializes parallel wrong OTP attempts onto one pause', async () => {
    const user = await createUser(
      prisma,
      `pause-${randomUUID()}@example.com`,
      `pause-${randomUUID()}`,
    );
    const recorded = recordedMail();
    const { service } = createHarness(
      prisma,
      syntheticServerEnv(),
      recorded.mail,
    );
    await service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.11',
    });
    const wrong = recorded.wrongCode();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(
        service.verifyEmailCode({
          userId: user.id,
          code: wrong,
          idempotencyKey: idempotencyKey(),
        }),
      ).rejects.toMatchObject({ apiCode: ApiErrorCode.OTP_INVALID });
    }

    const results = await Promise.allSettled([
      service.verifyEmailCode({
        userId: user.id,
        code: wrong,
        idempotencyKey: idempotencyKey(),
      }),
      service.verifyEmailCode({
        userId: user.id,
        code: wrong,
        idempotencyKey: idempotencyKey(),
      }),
    ]);
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    const paused = await prisma.authAbuseCounter.findMany({
      where: { scope: 'otp_verify', pausedUntil: { not: null } },
    });
    expect(paused.some((row) => row.failures === 5)).toBe(true);
    expect(paused.some((row) => row.failures > 5)).toBe(false);
  });

  it('lets one reservation win when the daily budget is one', async () => {
    await prisma.authAbuseOperation.create({ data: {
      email: 'registration-budget@example.test', purpose: 'email_proof_send', status: 'accepted',
      idempotencyKey: idempotencyKey(), contentHash: 'a'.repeat(64),
    } });
    const first = await createUser(
      prisma,
      `budget-a-${randomUUID()}@example.com`,
      `budget-a-${randomUUID()}`,
    );
    const second = await createUser(
      prisma,
      `budget-b-${randomUUID()}@example.com`,
      `budget-b-${randomUUID()}`,
    );
    const now = new Date();
    const spent = await prisma.authAbuseOperation.count({
      where: {
        purpose: { in: [...MAIL_BUDGET_PURPOSES] },
        status: { in: ['reserved', 'accepted', 'unknown'] },
        createdAt: { gt: new Date(now.getTime() - PERSONAL_MAIL_WINDOW_MS) },
      },
    });
    const env = syntheticServerEnv({
      AUTH_MAIL_DAILY_BUDGET: String(spent + 1),
      AUTH_MAIL_MONTHLY_BUDGET: '1000000',
    });
    const { service } = createHarness(prisma, env, {
      send: async () => undefined,
    }, undefined, new FixtureClock(now));
    const results = await Promise.allSettled([
      service.sendEmailVerification({
        userId: first.id,
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.12',
      }),
      service.sendEmailVerification({
        userId: second.id,
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.13',
      }),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.apiCode).toBe(
      ApiErrorCode.MAIL_BUDGET,
    );
  });

  it('serializes a login pair pause at ten failures', async () => {
    const email = `login-${randomUUID()}@example.com`;
    await createUser(prisma, email, `login-${randomUUID()}`);
    const { service } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    for (let attempt = 0; attempt < 9; attempt += 1) {
      const decision = await service.assessLogin({
        email,
        ip: '203.0.113.20',
        passwordAccepted: false,
        turnstileToken: attempt >= 5 ? turnstileToken('login') : undefined,
      });
      expect(decision.outcome).toBe('invalid');
    }

    const parallel = await Promise.all([
      service.assessLogin({
        email,
        ip: '203.0.113.20',
        passwordAccepted: false,
        turnstileToken: turnstileToken('login'),
      }),
      service.assessLogin({
        email,
        ip: '203.0.113.20',
        passwordAccepted: false,
        turnstileToken: turnstileToken('login'),
      }),
    ]);
    expect(parallel.map((decision) => decision.outcome).sort()).toEqual([
      'paused',
      'paused',
    ]);
    const pair = await prisma.authAbuseCounter.findMany({
      where: { scope: 'login_pair' },
    });
    expect(pair.some((row) => row.failures === 10 && row.pausedUntil)).toBe(
      true,
    );
    expect(pair.some((row) => row.failures > 10)).toBe(false);
  });

  it('changes an unverified address without clearing quota, pause, or slug', async () => {
    const slug = `correct-${randomUUID()}`;
    const user = await createUser(
      prisma,
      `correct-${randomUUID()}@example.com`,
      slug,
    );
    const recorded = recordedMail();
    const { service } = createHarness(
      prisma,
      syntheticServerEnv(),
      recorded.mail,
    );
    await service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.30',
    });
    const wrong = recorded.wrongCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await service
        .verifyEmailCode({
          userId: user.id,
          code: wrong,
          idempotencyKey: idempotencyKey(),
        })
        .catch((error: unknown) => {
          const code = (error as { apiCode?: string }).apiCode;
          if (
            code !== ApiErrorCode.OTP_INVALID &&
            code !== ApiErrorCode.OTP_PAUSED
          )
            throw error;
        });
    }
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash('sha256')
          .update(`correct-${user.id}`)
          .digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await prisma.termsAcceptance.create({
      data: {
        userId: user.id,
        rulesVersion: '2026-10',
        acceptedAt: new Date('2026-10-01T00:00:00.000Z'),
      },
    });
    const before = await prisma.authAbuseOperation.count({
      where: { ownerUserId: user.id, purpose: 'email_verification_send' },
    });
    const pauseBefore = await prisma.authAbuseCounter.findFirst({
      where: { scope: 'otp_verify', pausedUntil: { not: null } },
      orderBy: { updatedAt: 'desc' },
    });
    const beforeState = await service.readVerificationState(user.id);
    expect(beforeState.sendStatus).toBe('accepted');
    expect(beforeState.codeExpiresAt).not.toBeNull();

    const nextEmail = `next-${randomUUID()}@example.com`;
    await service.correctEmail({ userId: user.id, email: nextEmail });

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(stored.email).toBe(nextEmail);
    expect(stored.slug).toBe(slug);
    expect(stored.sessionVersion).toBe(0);
    expect(stored.passwordHash).toBe('hash');
    expect(
      (
        await prisma.passwordResetToken.findUniqueOrThrow({
          where: { id: resetToken.id },
        })
      ).usedAt,
    ).toEqual(expect.any(Date));
    expect(
      await prisma.termsAcceptance.count({
        where: { userId: user.id, rulesVersion: '2026-10' },
      }),
    ).toBe(1);
    expect(
      await prisma.authAbuseOperation.count({
        where: { ownerUserId: user.id, purpose: 'email_verification_send' },
      }),
    ).toBe(before);
    const pauseAfter = await prisma.authAbuseCounter.findUniqueOrThrow({
      where: { id: pauseBefore!.id },
    });
    expect(pauseAfter.pausedUntil).toEqual(pauseBefore!.pausedUntil);
    expect(pauseAfter.failures).toBe(pauseBefore!.failures);
    expect(
      await prisma.emailVerificationCode.count({
        where: { userId: user.id, usedAt: null },
      }),
    ).toBe(0);
    const afterState = await service.readVerificationState(user.id);
    expect(afterState.email).toBe(nextEmail);
    expect(afterState.sendStatus).toBe('none');
    expect(afterState.codeExpiresAt).toBeNull();
    expect(afterState.pausedUntil).toBe(beforeState.pausedUntil);
    expect(afterState.resendAvailableAt).toBe(beforeState.resendAvailableAt);
    expect(afterState.quotaResetsAt).toBe(beforeState.quotaResetsAt);
  });

  it('serializes reset completion with email correction and keeps the reset single-use', async () => {
    const slug = `reset-lock-${randomUUID().slice(0, 8)}`;
    const user = await createUser(
      prisma,
      `reset-lock-${randomUUID()}@example.com`,
      slug,
    );
    await prisma.termsAcceptance.create({
      data: {
        userId: user.id,
        rulesVersion: '2026-10',
        acceptedAt: new Date('2026-10-01T00:00:00.000Z'),
      },
    });
    const raw = `reset-${randomUUID()}`;
    const token = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const { service } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    const reset = new PasswordResetService(
      prisma as never,
      new PasswordHasherService(),
      { consume: () => true } as never,
      syntheticServerEnv(),
      { sendPasswordReset: async () => undefined } as never,
    );
    const nextEmail = `reset-next-${randomUUID()}@example.com`;
    await runResetCorrectionRace(prisma, reset, service, {
      userId: user.id,
      raw,
      tokenId: token.id,
      nextEmail,
      slug,
      first: 'reset',
    });
    const correctionFirst = await createResetUser(
      prisma,
      'reset-correct-first',
    );
    await runResetCorrectionRace(prisma, reset, service, {
      userId: correctionFirst.user.id,
      raw: correctionFirst.raw,
      tokenId: correctionFirst.tokenId,
      nextEmail: `reset-correct-next-${randomUUID()}@example.com`,
      slug: correctionFirst.slug,
      first: 'correction',
    });

    const sequentialSlug = `rs-${randomUUID().slice(0, 8)}`;
    const second = await createUser(
      prisma,
      `reset-seq-${randomUUID()}@example.com`,
      sequentialSlug,
    );
    const secondRaw = `reset-${randomUUID()}`;
    await prisma.passwordResetToken.create({
      data: {
        userId: second.id,
        tokenHash: createHash('sha256').update(secondRaw).digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await reset.resetPassword(secondRaw, 'sequential-password', {
      ip: '203.0.113.41',
    });
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: second.id } }))
        .sessionVersion,
    ).toBe(1);
    await expect(
      reset.resetPassword(secondRaw, 'sequential-password-2', {
        ip: '203.0.113.41',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.PASSWORD_RESET_INVALID });
    const changed = `reset-seq-next-${randomUUID()}@example.com`;
    await service.correctEmail({ userId: second.id, email: changed });
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: second.id },
    });
    expect(after.email).toBe(changed);
    expect(after.sessionVersion).toBe(1);
    expect(after.slug).toBe(sequentialSlug);
  });

  it('does not report SMTP accepted when the address is already verified', async () => {
    const user = await createUser(
      prisma,
      `verified-${randomUUID()}@example.com`,
      `vf-${randomUUID().slice(0, 8)}`,
    );
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
    let sends = 0;
    const { service } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => {
        sends += 1;
      },
    });
    const key = idempotencyKey();
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: key,
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.42',
      }),
    ).resolves.toEqual({ delivery: 'already_verified' });
    expect(sends).toBe(0);
    expect(
      (
        await prisma.authAbuseOperation.findUniqueOrThrow({
          where: {
            purpose_idempotencyKey: {
              purpose: 'email_verification_send',
              idempotencyKey: key,
            },
          },
        })
      ).status,
    ).toBe('suppressed');
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: key,
        ip: '203.0.113.42',
      }),
    ).resolves.toEqual({ delivery: 'already_verified' });
    expect(sends).toBe(0);
    await prisma.user.update({
      where: { id: user.id },
      data: { email: `verified-next-${randomUUID()}@example.com` },
    });
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: key,
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.42',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT });
    expect(sends).toBe(0);
  });

  it('keeps a code after an ambiguous CONN failure and does not send again', async () => {
    const user = await createUser(
      prisma,
      `conn-${randomUUID()}@example.com`,
      `conn-${randomUUID()}`,
    );
    let sends = 0;
    let code = '';
    const mail = {
      send: async (message: { text: string }) => {
        sends += 1;
        code = message.text.match(/(\d{6})/)?.[1] ?? '';
        throw { command: 'CONN' };
      },
    };
    const env = syntheticServerEnv();
    const { service } = createHarness(prisma, env, mail);
    const key = idempotencyKey();
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: key,
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.40',
      }),
    ).resolves.toEqual({ delivery: 'unknown' });

    const next = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    const restarted = createHarness(next, env, mail);
    await expect(
      restarted.service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: key,
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.40',
      }),
    ).resolves.toEqual({ delivery: 'unknown' });
    expect(sends).toBe(1);
    await expect(
      restarted.service.verifyEmailCode({
        userId: user.id,
        code,
        idempotencyKey: idempotencyKey(),
      }),
    ).resolves.toBeUndefined();
    await next.$disconnect();
  });

  it('invalidates a code when SMTP rejects it, including CONN plus a 550', async () => {
    const user = await createUser(
      prisma,
      `reject-${randomUUID()}@example.com`,
      `reject-${randomUUID()}`,
    );
    let code = '';
    const mail = {
      send: async (message: { text: string }) => {
        code = message.text.match(/(\d{6})/)?.[1] ?? '';
        throw { command: 'CONN', responseCode: 550 };
      },
    };
    const { service } = createHarness(prisma, syntheticServerEnv(), mail);
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.41',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.MAIL_REJECTED });

    const secret = await prisma.emailVerificationCode.findFirst({
      where: { userId: user.id },
    });
    expect(secret?.usedAt).toBeTruthy();
    await expect(
      service.verifyEmailCode({
        userId: user.id,
        code,
        idempotencyKey: idempotencyKey(),
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.OTP_EXPIRED });
    expect(
      await prisma.authAbuseOperation.count({
        where: {
          ownerUserId: user.id,
          status: { in: ['reserved', 'accepted', 'unknown'] },
        },
      }),
    ).toBe(0);
  });

  it('keeps the cooldown visible to a new service instance', async () => {
    const user = await createUser(
      prisma,
      `cool-${randomUUID()}@example.com`,
      `cool-${randomUUID()}`,
    );
    const env = syntheticServerEnv();
    const mail = { send: async () => undefined };
    const first = createHarness(prisma, env, mail);
    await first.service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.50',
    });
    const nextPrisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    const second = createHarness(nextPrisma, env, mail);
    await expect(
      second.service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.50',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.MAIL_COOLDOWN });
    await nextPrisma.$disconnect();
  });

  it('counts address failures from the last 15 minutes and leaves the pair cycle alone', async () => {
    const email = `window-${randomUUID()}@example.com`;
    const user = await createUser(
      prisma,
      email,
      `window-${randomUUID().slice(0, 8)}`,
    );
    const { store } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    const ip = '203.0.113.60';
    const start = new Date('2026-10-10T00:00:00.000Z');
    const fourteenFiftyNine = new Date(start.getTime() + 14 * 60_000 + 59_000);
    const fifteen = new Date(start.getTime() + LOGIN_WINDOW_MS);
    const fail = (now: Date) =>
      store.evaluateLogin({
        email,
        ip,
        passwordAccepted: false,
        turnstile: 'unchecked',
        now,
      });

    expect((await fail(start)).outcome).toBe('invalid');
    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect((await fail(fourteenFiftyNine)).outcome).toBe('invalid');
    }
    expect((await fail(fifteen)).outcome).toBe('invalid');
    expect((await fail(fifteen)).outcome).toBe('challenge');

    const across = `across-${randomUUID()}@example.com`;
    await createUser(prisma, across, `across-${randomUUID().slice(0, 8)}`);
    const marks = [0, 6, 10, 14, 16, 19].map(
      (minute) => new Date(start.getTime() + minute * 60_000),
    );
    for (const mark of marks) {
      expect(
        (
          await store.evaluateLogin({
            email: across,
            ip,
            passwordAccepted: false,
            turnstile: 'unchecked',
            now: mark,
          })
        ).outcome,
      ).toBe('invalid');
    }
    expect(
      (
        await store.evaluateLogin({
          email: across,
          ip,
          passwordAccepted: false,
          turnstile: 'unchecked',
          now: new Date(start.getTime() + 20 * 60_000),
        })
      ).outcome,
    ).toBe('challenge');

    const capped = `cap-${randomUUID()}@example.com`;
    const cappedUser = await createUser(
      prisma,
      capped,
      `cap-${randomUUID().slice(0, 8)}`,
    );
    const beforeIds = new Set(
      (
        await prisma.authAbuseCounter.findMany({
          where: { scope: 'login_email' },
          select: { id: true },
        })
      ).map((row) => row.id),
    );
    const samples = [0, 1, 2, 3, 4].map(
      (minute) => new Date(start.getTime() + minute * 60_000),
    );
    for (const sample of samples) {
      expect(
        (
          await store.evaluateLogin({
            email: capped,
            ip: '203.0.113.61',
            passwordAccepted: false,
            turnstile: 'unchecked',
            now: sample,
          })
        ).outcome,
      ).toBe('invalid');
    }
    const sixth = new Date(samples[4].getTime() + 1000);
    expect(
      (
        await store.evaluateLogin({
          email: capped,
          ip: '203.0.113.61',
          passwordAccepted: false,
          turnstile: 'accepted',
          now: sixth,
        })
      ).outcome,
    ).toBe('invalid');
    const fifthMostRecent = samples[1];
    expect(
      (
        await store.evaluateLogin({
          email: capped,
          ip: '203.0.113.61',
          passwordAccepted: true,
          turnstile: 'unchecked',
          now: new Date(fifthMostRecent.getTime() + LOGIN_WINDOW_MS),
        })
      ).outcome,
    ).toBe('accepted');
    const emailCounter = (
      await prisma.authAbuseCounter.findMany({
        where: { scope: 'login_email' },
      })
    ).find((row) => !beforeIds.has(row.id));
    expect(
      emailCounter?.failureTimestamps.map((timestamp) =>
        timestamp.toISOString(),
      ),
    ).toEqual(
      [samples[2], samples[3], samples[4], sixth].map((timestamp) =>
        timestamp.toISOString(),
      ),
    );
    const pair = await prisma.authAbuseCounter.findMany({
      where: { scope: 'login_pair' },
    });
    expect(pair.some((row) => row.failures > 10)).toBe(false);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .sessionVersion,
    ).toBe(0);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: cappedUser.id } }))
        .sessionVersion,
    ).toBe(0);
  });

  it('pauses a login pair on its own cycle after address failures have aged out', async () => {
    const email = `pair-cycle-${randomUUID()}@example.com`;
    const user = await createUser(
      prisma,
      email,
      `pair-${randomUUID().slice(0, 8)}`,
    );
    const { store } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    const start = new Date('2026-10-10T01:00:00.000Z');
    for (let attempt = 0; attempt < 9; attempt += 1) {
      expect(
        (
          await store.evaluateLogin({
            email,
            ip: '203.0.113.70',
            passwordAccepted: false,
            turnstile: attempt >= 5 ? 'accepted' : 'unchecked',
            now: start,
          })
        ).outcome,
      ).toBe('invalid');
    }
    const paused = await store.evaluateLogin({
      email,
      ip: '203.0.113.70',
      passwordAccepted: false,
      turnstile: 'unchecked',
      now: new Date(start.getTime() + LOGIN_WINDOW_MS),
    });
    expect(paused.outcome).toBe('paused');
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .sessionVersion,
    ).toBe(0);
  });

  it('replays the original OTP pause deadline after a restart and after it expires', async () => {
    const user = await createUser(
      prisma,
      `replay-${randomUUID()}@example.com`,
      `replay-${randomUUID().slice(0, 8)}`,
    );
    const recorded = recordedMail();
    const start = new Date();
    const clock = new FixtureClock(start);
    const { store, service } = createHarness(
      prisma,
      syntheticServerEnv(),
      recorded.mail,
      undefined,
      clock,
    );
    await service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.80',
    });
    const wrong = recorded.wrongCode();
    let pausedUntil: Date | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const decision = await store.verifyEmailCode({
        userId: user.id,
        code: wrong,
        idempotencyKey: idempotencyKey(),
      });
      if (decision.outcome === 'paused') pausedUntil = decision.pausedUntil;
      else expect(decision.outcome).toBe('invalid');
    }
    const deadline = new Date(start.getTime() + OTP_PAUSE_MS);
    expect(pausedUntil).toEqual(deadline);
    const during = new Date(start.getTime() + 4 * 60_000);
    clock.set(during);
    const key = idempotencyKey();
    await expect(
      store.verifyEmailCode({
        userId: user.id,
        code: wrong,
        idempotencyKey: key,
      }),
    ).resolves.toEqual({ outcome: 'paused', pausedUntil: deadline });
    const operation = await prisma.authAbuseOperation.findUniqueOrThrow({
      where: {
        purpose_idempotencyKey: {
          purpose: 'email_verification_verify',
          idempotencyKey: key,
        },
      },
    });
    expect(operation.resultDeadline).toEqual(deadline);

    const next = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    const restarted = new AuthAbuseStore(
      next as never,
      clock,
      syntheticServerEnv(),
    );
    await expect(
      restarted.verifyEmailCode({
        userId: user.id,
        code: wrong,
        idempotencyKey: key,
      }),
    ).resolves.toEqual({ outcome: 'paused', pausedUntil: deadline });
    clock.set(new Date(deadline.getTime() + 60_000));
    await expect(
      restarted.verifyEmailCode({
        userId: user.id,
        code: wrong,
        idempotencyKey: key,
      }),
    ).resolves.toEqual({ outcome: 'paused', pausedUntil: deadline });
    await next.$disconnect();
  });

  it('does not consume a correct OTP that expires while waiting for the user lock', async () => {
    const user = await createUser(
      prisma,
      `queued-otp-${randomUUID()}@example.com`,
      `qo-${randomUUID().slice(0, 8)}`,
    );
    const issuedAt = new Date('2026-10-10T12:00:00.000Z');
    const expiresAt = new Date(issuedAt.getTime() + OTP_TTL_MS);
    const code = '246810';
    const secret = await issueVerificationCode(
      prisma,
      user.id,
      code,
      expiresAt,
    );
    const clock = new FixtureClock(new Date(expiresAt.getTime() - 1_000));
    const { service } = createHarness(
      prisma,
      syntheticServerEnv(),
      { send: async () => undefined },
      undefined,
      clock,
    );
    const gate = holdUserLock(prisma, user.id);
    const key = idempotencyKey();
    let queued:
      | Promise<
          { status: 'fulfilled' } | { status: 'rejected'; error: unknown }
        >
      | undefined;
    try {
      const heldGate = await gate.held;
      const baseline = await advisoryWaiters(prisma, heldGate);
      queued = service
        .verifyEmailCode({ userId: user.id, code, idempotencyKey: key })
        .then(
          () => ({ status: 'fulfilled' as const }),
          (error: unknown) => ({ status: 'rejected' as const, error }),
        );
      await waitForAdvisoryWaiters(prisma, heldGate, baseline + 1);
      clock.set(new Date(expiresAt.getTime() + 1_000));
    } finally {
      gate.release();
    }
    await gate.done;
    if (!queued) throw new Error('Queued OTP verification did not start');
    const result = await queued;
    if (result.status !== 'rejected')
      throw new Error('Queued OTP verification did not fail');
    expect(result.error).toMatchObject({ apiCode: ApiErrorCode.OTP_EXPIRED });

    const stored = await prisma.emailVerificationCode.findUniqueOrThrow({
      where: { id: secret.id },
    });
    expect(stored.usedAt).toBeNull();
    expect(stored.attempts).toBe(0);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .emailVerifiedAt,
    ).toBeNull();
    await expect(otpVerifyCounter(prisma, user.id)).resolves.toMatchObject({
      failures: 0,
      pausedUntil: null,
    });
    const bound = await prisma.authAbuseOperation.findUniqueOrThrow({
      where: {
        purpose_idempotencyKey: {
          purpose: 'email_verification_verify',
          idempotencyKey: key,
        },
      },
    });
    expect(bound.status).toBe('expired');
    expect(bound.ownerUserId).toBe(user.id);
    expect(bound.contentHash).toBe(
      verifyContentHash(
        syntheticServerEnv().OTP_HASH_SECRET,
        user.id,
        user.email,
        code,
      ),
    );

    await expect(
      service.verifyEmailCode({ userId: user.id, code, idempotencyKey: key }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.OTP_EXPIRED });
    expect(
      (
        await prisma.emailVerificationCode.findUniqueOrThrow({
          where: { id: secret.id },
        })
      ).usedAt,
    ).toBeNull();
    expect(
      await prisma.authAbuseOperation.count({
        where: {
          ownerUserId: user.id,
          purpose: 'email_verification_verify',
          status: 'expired',
        },
      }),
    ).toBe(1);
    await expect(otpVerifyCounter(prisma, user.id)).resolves.toMatchObject({
      failures: 0,
      pausedUntil: null,
    });
  });

  it('does not consume a correct OTP that expires after it was read', async () => {
    const user = await createUser(
      prisma,
      `boundary-otp-${randomUUID()}@example.com`,
      `bo-${randomUUID().slice(0, 8)}`,
    );
    const expiresAt = new Date('2026-10-10T12:05:00.000Z');
    const code = '135790';
    const secret = await issueVerificationCode(
      prisma,
      user.id,
      code,
      expiresAt,
    );
    const clock = new SteppedFixtureClock([
      new Date(expiresAt.getTime() - 1),
      expiresAt,
    ]);
    const { store } = createHarness(
      prisma,
      syntheticServerEnv(),
      { send: async () => undefined },
      undefined,
      clock,
    );
    const key = idempotencyKey();
    await expect(
      store.verifyEmailCode({ userId: user.id, code, idempotencyKey: key }),
    ).resolves.toEqual({ outcome: 'expired' });
    const stored = await prisma.emailVerificationCode.findUniqueOrThrow({
      where: { id: secret.id },
    });
    expect(stored.usedAt).toBeNull();
    expect(stored.attempts).toBe(0);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .emailVerifiedAt,
    ).toBeNull();
    await expect(otpVerifyCounter(prisma, user.id)).resolves.toMatchObject({
      failures: 0,
      pausedUntil: null,
    });
    await expect(
      store.verifyEmailCode({ userId: user.id, code, idempotencyKey: key }),
    ).resolves.toEqual({ outcome: 'expired' });
    expect(
      (
        await prisma.emailVerificationCode.findUniqueOrThrow({
          where: { id: secret.id },
        })
      ).usedAt,
    ).toBeNull();
    expect(
      await prisma.authAbuseOperation.count({
        where: { ownerUserId: user.id, purpose: 'email_verification_verify' },
      }),
    ).toBe(1);
  });

  it('replays a committed OTP verification after the code TTL without consuming it again', async () => {
    const user = await createUser(
      prisma,
      `verified-replay-${randomUUID()}@example.com`,
      `vr-${randomUUID().slice(0, 8)}`,
    );
    const admittedAt = new Date('2026-10-10T12:00:00.000Z');
    const expiresAt = new Date(admittedAt.getTime() + OTP_TTL_MS);
    const code = '112233';
    const secret = await issueVerificationCode(
      prisma,
      user.id,
      code,
      expiresAt,
    );
    const clock = new FixtureClock(admittedAt);
    const { store } = createHarness(
      prisma,
      syntheticServerEnv(),
      { send: async () => undefined },
      undefined,
      clock,
    );
    const key = idempotencyKey();
    await expect(
      store.verifyEmailCode({ userId: user.id, code, idempotencyKey: key }),
    ).resolves.toEqual({ outcome: 'verified' });
    const consumed = await prisma.emailVerificationCode.findUniqueOrThrow({
      where: { id: secret.id },
    });
    expect(consumed.usedAt).toEqual(admittedAt);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .emailVerifiedAt,
    ).toEqual(admittedAt);
    await expect(otpVerifyCounter(prisma, user.id)).resolves.toMatchObject({
      failures: 0,
      pausedUntil: null,
    });

    clock.set(new Date(expiresAt.getTime() + 60_000));
    await expect(
      store.verifyEmailCode({ userId: user.id, code, idempotencyKey: key }),
    ).resolves.toEqual({ outcome: 'verified' });
    expect(
      (
        await prisma.emailVerificationCode.findUniqueOrThrow({
          where: { id: secret.id },
        })
      ).usedAt,
    ).toEqual(admittedAt);
    await expect(
      store.verifyEmailCode({
        userId: user.id,
        code,
        idempotencyKey: idempotencyKey(),
      }),
    ).resolves.toEqual({ outcome: 'already_verified' });
    expect(
      (
        await prisma.emailVerificationCode.findUniqueOrThrow({
          where: { id: secret.id },
        })
      ).usedAt,
    ).toEqual(admittedAt);
    await expect(otpVerifyCounter(prisma, user.id)).resolves.toMatchObject({
      failures: 0,
      pausedUntil: null,
    });
  });

  it('refuses quota at the latest exhausted scope and reports that same deadline', async () => {
    const earlier = new Date('2026-10-10T00:00:00.000Z');
    const later = new Date('2026-10-10T06:00:00.000Z');
    const now = new Date('2026-10-10T12:00:00.000Z');
    const current = `quota-reused-${randomUUID()}@example.com`;
    const formerOwner = await createUser(
      prisma,
      current,
      `qo-${randomUUID().slice(0, 8)}`,
    );
    await spendAccepted(prisma, formerOwner.id, current, earlier, 3);
    await prisma.user.update({
      where: { id: formerOwner.id },
      data: { email: `quota-left-${randomUUID()}@example.com` },
    });
    const formerAddress = `quota-former-${randomUUID()}@example.com`;
    const accountOnly = await createUser(
      prisma,
      formerAddress,
      `qa-${randomUUID().slice(0, 8)}`,
    );
    await spendAccepted(prisma, accountOnly.id, formerAddress, later, 10);
    await prisma.user.update({
      where: { id: accountOnly.id },
      data: { email: current },
    });
    const { store } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    const accountDeadline = new Date(later.getTime() + PERSONAL_MAIL_WINDOW_MS);
    await expect(
      reserveAt(store, accountOnly.id, current, now),
    ).resolves.toEqual({
      kind: 'quota',
      resetsAt: accountDeadline,
    });
    expect(
      (await store.readVerificationState(accountOnly.id, now))?.quotaResetsAt,
    ).toEqual(accountDeadline);

    const both = await createUser(
      prisma,
      `quota-b-${randomUUID()}@example.com`,
      `qb-${randomUUID().slice(0, 8)}`,
    );
    const bothFormer = `quota-both-old-${randomUUID()}@example.com`;
    await spendAccepted(prisma, both.id, bothFormer, earlier, 10);
    const bothCurrent = `quota-both-new-${randomUUID()}@example.com`;
    await prisma.user.update({
      where: { id: both.id },
      data: { email: bothCurrent },
    });
    await spendAccepted(prisma, both.id, bothCurrent, later, 10);
    const bothDeadline = new Date(later.getTime() + PERSONAL_MAIL_WINDOW_MS);
    await expect(reserveAt(store, both.id, bothCurrent, now)).resolves.toEqual({
      kind: 'quota',
      resetsAt: bothDeadline,
    });
    expect(
      (await store.readVerificationState(both.id, now))?.quotaResetsAt,
    ).toEqual(bothDeadline);
  });

  it('resets overflow quota when the boundary spend expires and after a release', async () => {
    const base = new Date('2026-10-10T00:00:00.000Z');
    const now = new Date('2026-10-10T12:00:00.000Z');
    const email = `quota-overflow-${randomUUID()}@example.com`;
    const user = await createUser(
      prisma,
      email,
      `qo-${randomUUID().slice(0, 8)}`,
    );
    const stamps = Array.from(
      { length: 12 },
      (_, index) => new Date(base.getTime() + index * 60_000),
    );
    for (const createdAt of stamps) {
      await spendAccepted(prisma, user.id, email, createdAt, 1);
    }
    const { store } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    const boundary = new Date(
      (stamps[2] ?? base).getTime() + PERSONAL_MAIL_WINDOW_MS,
    );
    const oldest = new Date(
      (stamps[0] ?? base).getTime() + PERSONAL_MAIL_WINDOW_MS,
    );
    expect(boundary.getTime()).toBeGreaterThan(oldest.getTime());
    await expect(reserveAt(store, user.id, email, now)).resolves.toEqual({
      kind: 'quota',
      resetsAt: boundary,
    });
    expect(
      (await store.readVerificationState(user.id, now))?.quotaResetsAt,
    ).toEqual(boundary);

    await prisma.authAbuseOperation.updateMany({
      where: { ownerUserId: user.id, createdAt: stamps[2], status: 'accepted' },
      data: { status: 'rejected' },
    });
    const afterRelease = new Date(
      (stamps[1] ?? base).getTime() + PERSONAL_MAIL_WINDOW_MS,
    );
    await expect(reserveAt(store, user.id, email, now)).resolves.toEqual({
      kind: 'quota',
      resetsAt: afterRelease,
    });
    expect(
      (await store.readVerificationState(user.id, now))?.quotaResetsAt,
    ).toEqual(afterRelease);

    await prisma.authAbuseOperation.updateMany({
      where: { ownerUserId: user.id, status: 'accepted' },
      data: { status: 'rejected' },
    });
    await expect(reserveAt(store, user.id, email, now)).resolves.toMatchObject({
      kind: 'reserved',
    });
    expect(
      (await store.readVerificationState(user.id, now))?.quotaResetsAt,
    ).toBeNull();
  });

  it('keeps a corrected address from inheriting the previous send while a send is in flight', async () => {
    const user = await createUser(
      prisma,
      `race-${randomUUID()}@example.com`,
      `race-${randomUUID().slice(0, 8)}`,
    );
    const { service } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    const nextEmail = `race-next-${randomUUID()}@example.com`;
    const [sendResult, correctResult] = await Promise.allSettled([
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.90',
      }),
      service.correctEmail({ userId: user.id, email: nextEmail }),
    ]);
    expect(correctResult.status).toBe('fulfilled');
    if (sendResult.status === 'fulfilled') {
      expect(sendResult.value).toEqual({ delivery: 'accepted' });
    } else {
      expect(sendResult.reason).toMatchObject({
        apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT,
      });
    }
    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(stored.email).toBe(nextEmail);
    const state = await service.readVerificationState(user.id);
    expect(state.email).toBe(stored.email);
    const currentSend = await prisma.authAbuseOperation.findFirst({
      where: {
        ownerUserId: user.id,
        email: stored.email,
        purpose: 'email_verification_send',
        status: { in: ['reserved', 'accepted', 'unknown'] },
      },
    });
    if (state.sendStatus === 'none') {
      expect(currentSend).toBeNull();
    } else {
      expect(currentSend?.email).toBe(stored.email);
    }
    const usable = await prisma.emailVerificationCode.findMany({
      where: { userId: user.id, usedAt: null },
    });
    for (const code of usable) {
      const owner = await prisma.authAbuseOperation.findFirst({
        where: { secretId: code.id, email: stored.email },
      });
      expect(owner).toBeTruthy();
    }
  });

  it('does not verify a corrected address from an in-flight send', async () => {
    const user = await createUser(
      prisma,
      `bypass-${randomUUID()}@example.com`,
      `by-${randomUUID().slice(0, 8)}`,
    );
    const env = syntheticServerEnv({ TEST_EMAIL_BYPASS: 'true' });
    const { store, service } = createHarness(prisma, env, {
      send: async () => undefined,
    });
    const reserved = await store.reserveMail({
      purpose: 'email_verification_send',
      idempotencyKey: idempotencyKey(),
      ownerUserId: user.id,
      contentHash: mailContentHash(
        'email_verification_send',
        user.id,
        user.email,
      ),
      now: new Date(),
      dailyBudget: 1_000_000,
      monthlyBudget: 1_000_000,
    });
    expect(reserved.kind).toBe('reserved');
    if (reserved.kind !== 'reserved') return;
    const nextEmail = `bypass-next-${randomUUID()}@example.com`;
    await service.correctEmail({ userId: user.id, email: nextEmail });
    await store.completeMail({
      operationId: reserved.operationId,
      outcome: 'accepted',
      purpose: 'email_verification_send',
      verifyUserId: user.id,
    });
    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(stored.email).toBe(nextEmail);
    expect(stored.emailVerifiedAt).toBeNull();

    const expiredUser = await createUser(
      prisma,
      `bypass-expired-${randomUUID()}@example.com`,
      `be-${randomUUID().slice(0, 8)}`,
    );
    const expired = await store.reserveMail({
      purpose: 'email_verification_send',
      idempotencyKey: idempotencyKey(),
      ownerUserId: expiredUser.id,
      contentHash: mailContentHash(
        'email_verification_send',
        expiredUser.id,
        expiredUser.email,
      ),
      now: new Date(),
      dailyBudget: 1_000_000,
      monthlyBudget: 1_000_000,
    });
    expect(expired.kind).toBe('reserved');
    if (expired.kind !== 'reserved') return;
    await prisma.emailVerificationCode.update({
      where: { id: expired.secretId },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await store.completeMail({
      operationId: expired.operationId,
      outcome: 'accepted',
      purpose: 'email_verification_send',
      verifyUserId: expiredUser.id,
    });
    const expiredStored = await prisma.user.findUniqueOrThrow({
      where: { id: expiredUser.id },
    });
    expect(expiredStored.emailVerifiedAt).toBeNull();
    expect(
      (
        await prisma.emailVerificationCode.findUniqueOrThrow({
          where: { id: expired.secretId },
        })
      ).usedAt,
    ).toBeNull();
  });

  it('keeps a refused recovery neutral for the same address after the limit clears', async () => {
    const user = await createUser(
      prisma,
      `reset-${randomUUID()}@example.com`,
      `rs-${randomUUID().slice(0, 8)}`,
    );
    let sends = 0;
    const mail = {
      send: async () => {
        sends += 1;
      },
    };
    const env = syntheticServerEnv({
      AUTH_MAIL_DAILY_BUDGET: '1000000',
      AUTH_MAIL_MONTHLY_BUDGET: '1000000',
    });
    const { service } = createHarness(prisma, env, mail);
    await service.sendPasswordReset({
      email: user.email,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('password_reset'),
      ip: '203.0.113.100',
    });
    const refusedKey = idempotencyKey();
    await service.sendPasswordReset({
      email: user.email,
      idempotencyKey: refusedKey,
      turnstileToken: turnstileToken('password_reset'),
      ip: '203.0.113.100',
    });
    expect(sends).toBe(1);
    const suppressed = await prisma.authAbuseOperation.findUniqueOrThrow({
      where: {
        purpose_idempotencyKey: {
          purpose: 'password_reset_send',
          idempotencyKey: refusedKey,
        },
      },
    });
    expect(suppressed.status).toBe('suppressed');
    expect(suppressed.contentHash).toBe(resetContentHash(user.email));
    await prisma.authAbuseOperation.updateMany({
      where: {
        ownerUserId: user.id,
        purpose: 'password_reset_send',
        status: 'accepted',
      },
      data: { createdAt: new Date(Date.now() - 120_000) },
    });
    const reopened = createHarness(prisma, env, mail);
    await reopened.service.sendPasswordReset({
      email: user.email,
      idempotencyKey: refusedKey,
      ip: '203.0.113.100',
    });
    expect(sends).toBe(1);
    await expect(
      reopened.service.sendPasswordReset({
        email: `other-${randomUUID()}@example.com`,
        idempotencyKey: refusedKey,
        turnstileToken: turnstileToken('password_reset'),
        ip: '203.0.113.100',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT });
    expect(sends).toBe(1);

    const unknownKey = idempotencyKey();
    const unknown = `nobody-${randomUUID()}@example.com`;
    await service.sendPasswordReset({
      email: unknown,
      idempotencyKey: unknownKey,
      turnstileToken: turnstileToken('password_reset'),
      ip: '203.0.113.101',
    });
    await service.sendPasswordReset({
      email: unknown,
      idempotencyKey: unknownKey,
      ip: '203.0.113.101',
    });
    await expect(
      service.sendPasswordReset({
        email: `other-${randomUUID()}@example.com`,
        idempotencyKey: unknownKey,
        turnstileToken: turnstileToken('password_reset'),
        ip: '203.0.113.101',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT });
    expect(sends).toBe(1);
  });

  it('counts a monthly spend that is already outside the daily window', async () => {
    const now = new Date('2026-10-10T12:00:00.000Z');
    const dayStart = new Date(now.getTime() - PERSONAL_MAIL_WINDOW_MS);
    const monthStart = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    const spendWhere = {
      purpose: {
        in: ['email_verification_send', 'password_reset_send'] as const,
      },
      status: { in: ['reserved', 'accepted', 'unknown'] as const },
    };
    const countSince = (since: Date) =>
      prisma.authAbuseOperation.count({
        where: { ...spendWhere, createdAt: { gt: since } },
      });
    const dailyBefore = await countSince(dayStart);
    const monthlyBefore = await countSince(monthStart);
    const email = `month-${randomUUID()}@example.com`;
    const user = await createUser(
      prisma,
      email,
      `mo-${randomUUID().slice(0, 8)}`,
    );
    await spendAccepted(
      prisma,
      user.id,
      email,
      new Date('2026-09-15T12:00:00.000Z'),
      1,
    );
    expect(await countSince(dayStart)).toBe(dailyBefore);
    expect(await countSince(monthStart)).toBe(monthlyBefore + 1);
    const { store } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    await expect(
      store.reserveMail({
        purpose: 'email_verification_send',
        idempotencyKey: idempotencyKey(),
        ownerUserId: user.id,
        contentHash: mailContentHash('email_verification_send', user.id, email),
        now,
        dailyBudget: dailyBefore + 1,
        monthlyBudget: monthlyBefore + 1,
      }),
    ).resolves.toEqual({ kind: 'budget' });

    const recentEmail = `day-${randomUUID()}@example.com`;
    const recent = await createUser(
      prisma,
      recentEmail,
      `dy-${randomUUID().slice(0, 8)}`,
    );
    const dailyBeforeRecent = await countSince(dayStart);
    const monthlyBeforeRecent = await countSince(monthStart);
    await spendAccepted(
      prisma,
      recent.id,
      recentEmail,
      new Date('2026-10-10T11:00:00.000Z'),
      1,
    );
    expect(await countSince(dayStart)).toBe(dailyBeforeRecent + 1);
    expect(await countSince(monthStart)).toBe(monthlyBeforeRecent + 1);
    await expect(
      store.reserveMail({
        purpose: 'email_verification_send',
        idempotencyKey: idempotencyKey(),
        ownerUserId: recent.id,
        contentHash: mailContentHash(
          'email_verification_send',
          recent.id,
          recentEmail,
        ),
        now,
        dailyBudget: dailyBeforeRecent + 1,
        monthlyBudget: monthlyBeforeRecent + 2,
      }),
    ).resolves.toEqual({ kind: 'budget' });
  });

  it('treats verification and recovery as one ten-send quota', async () => {
    const now = new Date('2026-10-10T12:00:00.000Z');
    const at = new Date('2026-10-10T06:00:00.000Z');
    const email = `mixed-${randomUUID()}@example.com`;
    const user = await createUser(
      prisma,
      email,
      `mx-${randomUUID().slice(0, 8)}`,
    );
    await spendAccepted(
      prisma,
      user.id,
      email,
      at,
      5,
      'email_verification_send',
    );
    await spendAccepted(prisma, user.id, email, at, 4, 'password_reset_send');
    const { store } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => undefined,
    });
    const tenth = await store.reserveMail({
      purpose: 'password_reset_send',
      idempotencyKey: idempotencyKey(),
      ownerUserId: user.id,
      contentHash: resetContentHash(email),
      now,
      dailyBudget: 1_000_000,
      monthlyBudget: 1_000_000,
    });
    expect(tenth.kind).toBe('reserved');
    await expect(
      store.reserveMail({
        purpose: 'email_verification_send',
        idempotencyKey: idempotencyKey(),
        ownerUserId: user.id,
        contentHash: mailContentHash('email_verification_send', user.id, email),
        now,
        dailyBudget: 1_000_000,
        monthlyBudget: 1_000_000,
      }),
    ).resolves.toMatchObject({ kind: 'quota' });
  });

  it('sends one message when the same verification key is used twice', async () => {
    const user = await createUser(
      prisma,
      `once-${randomUUID()}@example.com`,
      `on-${randomUUID().slice(0, 8)}`,
    );
    let sends = 0;
    const { service } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => {
        sends += 1;
      },
    });
    const key = idempotencyKey();
    const request = {
      userId: user.id,
      idempotencyKey: key,
      ip: '203.0.113.120',
    };
    await Promise.all([
      service.sendEmailVerification({
        ...request,
        turnstileToken: turnstileToken('email_verification'),
      }),
      service.sendEmailVerification({
        ...request,
        turnstileToken: turnstileToken('email_verification'),
      }),
    ]);
    expect(sends).toBe(1);
    expect(
      await prisma.authAbuseOperation.count({
        where: {
          purpose: 'email_verification_send',
          idempotencyKey: key,
          status: { in: ['reserved', 'accepted', 'unknown'] },
        },
      }),
    ).toBe(1);
    expect(
      await prisma.emailVerificationCode.count({ where: { userId: user.id } }),
    ).toBe(1);
  });

  it('sends one message when two requests repeat the same proof and key', async () => {
    const user = await createUser(
      prisma,
      `same-proof-${randomUUID()}@example.com`,
      `sp-${randomUUID().slice(0, 8)}`,
    );
    let sends = 0;
    const { service } = createHarness(prisma, syntheticServerEnv(), {
      send: async () => {
        sends += 1;
      },
    });
    const key = idempotencyKey();
    const proof = turnstileToken('email_verification');
    const request = {
      userId: user.id,
      idempotencyKey: key,
      turnstileToken: proof,
      ip: '203.0.113.122',
    };
    await Promise.all([
      service.sendEmailVerification(request),
      service.sendEmailVerification(request),
    ]);
    expect(sends).toBe(1);
    expect(
      await prisma.emailVerificationCode.count({ where: { userId: user.id } }),
    ).toBe(1);
    expect(
      await prisma.authAbuseOperation.count({
        where: {
          ownerUserId: user.id,
          purpose: 'email_verification_send',
          status: { in: ['reserved', 'accepted', 'unknown'] },
        },
      }),
    ).toBe(1);

    await expect(
      service.sendEmailVerification({
        ...request,
        idempotencyKey: idempotencyKey(),
        turnstileToken: proof,
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.TURNSTILE_FAILED });
    expect(sends).toBe(1);
    expect(
      await prisma.emailVerificationCode.count({ where: { userId: user.id } }),
    ).toBe(1);
  });

  it('does not send again when verification finishes while Turnstile is in flight', async () => {
    const user = await createUser(
      prisma,
      `inflight-${randomUUID()}@example.com`,
      `if-${randomUUID().slice(0, 8)}`,
    );
    const recorded = recordedMail();
    let sends = 0;
    let releaseProof = () => {};
    const proof = new Promise<void>((resolve) => {
      releaseProof = resolve;
    });
    let markEntered = () => {};
    const entered = new Promise<void>((resolve) => {
      markEntered = resolve;
    });
    let arm = false;
    const inner = new ScriptedTurnstileVerifier('localhost');
    const gated = new (class extends TurnstileVerifier {
      verify(input: TurnstileCheck): Promise<TurnstileDecision> {
        if (!arm) return inner.verify(input);
        arm = false;
        markEntered();
        return proof.then(() => inner.verify(input));
      }
    })();
    const { service } = createHarness(
      prisma,
      syntheticServerEnv(),
      {
        send: async (message) => {
          sends += 1;
          await recorded.mail.send(message);
        },
      },
      gated,
    );
    await service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.123',
    });
    const code = recorded.code();
    expect(sends).toBe(1);
    arm = true;
    const secondKey = idempotencyKey();
    const second = service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: secondKey,
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.123',
    });
    await entered;
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .emailVerifiedAt,
    ).toBeNull();
    await service.verifyEmailCode({
      userId: user.id,
      code,
      idempotencyKey: idempotencyKey(),
    });
    releaseProof();
    await expect(second).resolves.toEqual({ delivery: 'already_verified' });
    expect(sends).toBe(1);
    expect(
      await prisma.emailVerificationCode.count({ where: { userId: user.id } }),
    ).toBe(1);
    expect(
      await prisma.emailVerificationCode.count({
        where: { userId: user.id, usedAt: null },
      }),
    ).toBe(0);
    expect(
      await prisma.authAbuseOperation.count({
        where: {
          ownerUserId: user.id,
          status: { in: ['reserved', 'accepted', 'unknown'] },
        },
      }),
    ).toBe(1);
    expect(
      (
        await prisma.authAbuseOperation.findUniqueOrThrow({
          where: {
            purpose_idempotencyKey: {
              purpose: 'email_verification_send',
              idempotencyKey: secondKey,
            },
          },
        })
      ).status,
    ).toBe('suppressed');
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: secondKey,
        ip: '203.0.113.123',
      }),
    ).resolves.toEqual({ delivery: 'already_verified' });
    expect(sends).toBe(1);
    await prisma.user.update({
      where: { id: user.id },
      data: { email: `inflight-next-${randomUUID()}@example.com` },
    });
    await expect(
      service.sendEmailVerification({
        userId: user.id,
        idempotencyKey: secondKey,
        turnstileToken: turnstileToken('email_verification'),
        ip: '203.0.113.123',
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT });
    expect(sends).toBe(1);
  });

  it('keeps a pause across resend and does not reuse a stale code', async () => {
    const user = await createUser(
      prisma,
      `stale-${randomUUID()}@example.com`,
      `st-${randomUUID().slice(0, 8)}`,
    );
    const recorded = recordedMail();
    const { service } = createHarness(
      prisma,
      syntheticServerEnv(),
      recorded.mail,
    );
    await service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.121',
    });
    const firstCode = recorded.code();
    const wrong = recorded.wrongCode();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(
        service.verifyEmailCode({
          userId: user.id,
          code: wrong,
          idempotencyKey: idempotencyKey(),
        }),
      ).rejects.toMatchObject({ apiCode: ApiErrorCode.OTP_INVALID });
    }
    await prisma.authAbuseOperation.updateMany({
      where: {
        ownerUserId: user.id,
        purpose: 'email_verification_send',
        status: 'accepted',
      },
      data: { createdAt: new Date(Date.now() - 120_000) },
    });
    await service.sendEmailVerification({
      userId: user.id,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
      ip: '203.0.113.121',
    });
    const replacement = recorded.code();
    expect(replacement).not.toBe(firstCode);
    const first = await prisma.emailVerificationCode.findFirstOrThrow({
      where: {
        userId: user.id,
        codeHash: otpCodeHash(
          syntheticServerEnv().OTP_HASH_SECRET,
          user.id,
          user.email,
          firstCode,
        ),
      },
    });
    expect(first.usedAt).toEqual(expect.any(Date));
    const pause = await prisma.authAbuseCounter.findUniqueOrThrow({
      where: {
        scope_subjectHash: {
          scope: 'otp_verify',
          subjectHash: createHash('sha256')
            .update(`otp_verify\n${user.id}`)
            .digest('hex'),
        },
      },
    });
    expect(pause.failures).toBe(4);
    expect(pause.pausedUntil).toBeNull();
    await expect(
      service.verifyEmailCode({
        userId: user.id,
        code: firstCode,
        idempotencyKey: idempotencyKey(),
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.OTP_PAUSED });
    const retained = await prisma.authAbuseCounter.findUniqueOrThrow({
      where: { id: pause.id },
    });
    expect(retained.failures).toBe(5);
    expect(retained.pausedUntil).toEqual(expect.any(Date));
    const current = await prisma.emailVerificationCode.findFirstOrThrow({
      where: {
        userId: user.id,
        codeHash: otpCodeHash(
          syntheticServerEnv().OTP_HASH_SECRET,
          user.id,
          user.email,
          replacement,
        ),
      },
    });
    expect(current.usedAt).toBeNull();
    await expect(
      service.verifyEmailCode({
        userId: user.id,
        code: replacement,
        idempotencyKey: idempotencyKey(),
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.OTP_PAUSED });
    expect(
      (
        await prisma.emailVerificationCode.findUniqueOrThrow({
          where: { id: current.id },
        })
      ).usedAt,
    ).toBeNull();
  });
});

describe.skipIf(!databaseUrl)('auth abuse legacy credential import', () => {
  const schemaName = `legacy_cutover_${randomUUID().replace(/-/g, '')}`;
  let schemaUrl = '';
  let legacy: PrismaClient;

  beforeAll(async () => {
    assertIsolatedDatabase(databaseUrl!);
    const schemaUrlBuilder = new URL(databaseUrl!);
    schemaUrlBuilder.searchParams.set('schema', schemaName);
    schemaUrl = schemaUrlBuilder.toString();
    const admin = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
    await admin.$disconnect();
  });

  afterAll(async () => {
    await legacy?.$disconnect();
    if (!/^legacy_cutover_[a-f0-9]+$/.test(schemaName)) return;
    const admin = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    await admin.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
    );
    await admin.$disconnect();
  });

  it('imports retained credentials once and leaves active secrets usable', async () => {
    const stage = mkdtempSync(join(tmpdir(), 'bidplace-legacy-import-'));
    try {
      cpSync(
        resolve(repoRoot, 'packages/database/prisma'),
        join(stage, 'prisma'),
        { recursive: true },
      );
      rmSync(
        join(
          stage,
          'prisma/migrations/20261010100000_auth_abuse_legacy_import',
        ),
        {
          recursive: true,
          force: true,
        },
      );
      deployMigrations(stage, schemaUrl);
      legacy = new PrismaClient({ datasources: { db: { url: schemaUrl } } });
      await legacy.$connect();

      const active = await createUser(
        legacy,
        `legacy-active-${randomUUID()}@example.com`,
        `la-${randomUUID().slice(0, 8)}`,
      );
      const activeCreated = new Date(Date.now() - 30_000);
      const activeExpires = new Date(Date.now() + 5 * 60_000);
      const activeCode = await legacy.emailVerificationCode.create({
        data: {
          userId: active.id,
          codeHash: createHash('sha256').update('135790').digest('hex'),
          expiresAt: activeExpires,
          attempts: 4,
          createdAt: activeCreated,
        },
      });
      for (let index = 0; index < 7; index += 1) {
        await legacy.emailVerificationCode.create({
          data: {
            userId: active.id,
            codeHash: createHash('sha256')
              .update(`used-code-${index}`)
              .digest('hex'),
            expiresAt: activeExpires,
            usedAt: new Date(activeCreated.getTime() - 60_000),
            attempts: 0,
            createdAt: new Date(activeCreated.getTime() - (index + 1) * 60_000),
          },
        });
      }
      const unusedReset = `legacy-reset-${randomUUID()}`;
      const unusedToken = await legacy.passwordResetToken.create({
        data: {
          userId: active.id,
          tokenHash: createHash('sha256').update(unusedReset).digest('hex'),
          expiresAt: new Date(Date.now() + 60 * 60_000),
          createdAt: new Date(Date.now() - 2 * 60 * 60_000),
        },
      });
      const usedReset = `legacy-used-${randomUUID()}`;
      const usedAt = new Date(Date.now() - 3 * 60 * 60_000);
      const usedToken = await legacy.passwordResetToken.create({
        data: {
          userId: active.id,
          tokenHash: createHash('sha256').update(usedReset).digest('hex'),
          expiresAt: new Date(Date.now() + 60 * 60_000),
          usedAt,
          createdAt: new Date(Date.now() - 4 * 60 * 60_000),
        },
      });
      const exhausted = await createUser(
        legacy,
        `legacy-paused-${randomUUID()}@example.com`,
        `lp-${randomUUID().slice(0, 8)}`,
      );
      const exhaustedCode = await legacy.emailVerificationCode.create({
        data: {
          userId: exhausted.id,
          codeHash: createHash('sha256').update('246801').digest('hex'),
          expiresAt: new Date(Date.now() + 5 * 60_000),
          attempts: 5,
          createdAt: new Date(Date.now() - 60_000),
        },
      });

      cpSync(
        resolve(
          repoRoot,
          'packages/database/prisma/migrations/20261010100000_auth_abuse_legacy_import',
        ),
        join(
          stage,
          'prisma/migrations/20261010100000_auth_abuse_legacy_import',
        ),
        { recursive: true },
      );
      const importedAt = Date.now();
      deployMigrations(stage, schemaUrl);

      const importedCode = await legacy.emailVerificationCode.findUniqueOrThrow(
        { where: { id: activeCode.id } },
      );
      expect(importedCode.attempts).toBe(4);
      expect(importedCode.usedAt).toBeNull();
      expect(importedCode.expiresAt).toEqual(activeExpires);
      const operation = await legacy.authAbuseOperation.findFirstOrThrow({
        where: { secretId: activeCode.id, purpose: 'email_verification_send' },
      });
      expect(operation.status).toBe('unknown');
      expect(operation.email).toBe(active.email);
      expect(operation.ownerUserId).toBe(active.id);
      expect(operation.createdAt).toEqual(activeCreated);
      expect(operation.idempotencyKey).toBe(`legacy-otp-${activeCode.id}`);
      expect(operation.contentHash).toBe(
        mailContentHash('email_verification_send', active.id, active.email),
      );
      const resetOperation = await legacy.authAbuseOperation.findFirstOrThrow({
        where: { secretId: unusedToken.id, purpose: 'password_reset_send' },
      });
      expect(resetOperation.status).toBe('unknown');
      expect(resetOperation.contentHash).toBe(resetContentHash(active.email));
      expect(
        await legacy.authAbuseOperation.count({
          where: { ownerUserId: active.id, status: 'unknown' },
        }),
      ).toBe(10);

      const counter = await legacy.authAbuseCounter.findUniqueOrThrow({
        where: {
          scope_subjectHash: {
            scope: 'otp_verify',
            subjectHash: createHash('sha256')
              .update(`otp_verify\n${active.id}`)
              .digest('hex'),
          },
        },
      });
      expect(counter.failures).toBe(4);
      expect(counter.pausedUntil).toBeNull();
      expect(counter.failureTimestamps).toEqual([]);

      const { store } = createHarness(legacy, syntheticServerEnv(), {
        send: async () => undefined,
      });
      const observedAt = new Date();
      const state = await store.readVerificationState(active.id, observedAt);
      expect(state?.sendStatus).toBe('unknown');
      expect(state?.codeExpiresAt).toEqual(importedCode.expiresAt);
      expect(state?.resendAvailableAt).toEqual(
        new Date(operation.createdAt.getTime() + cooldownAfterSends(8)),
      );
      await expect(
        store.reserveMail({
          purpose: 'email_verification_send',
          idempotencyKey: idempotencyKey(),
          ownerUserId: active.id,
          contentHash: mailContentHash(
            'email_verification_send',
            active.id,
            active.email,
          ),
          now: new Date(),
          dailyBudget: 1_000_000,
          monthlyBudget: 1_000_000,
        }),
      ).resolves.toMatchObject({ kind: 'quota' });

      const fifth = await store.verifyEmailCode({
        userId: active.id,
        code: '135791',
        idempotencyKey: idempotencyKey(),
      });
      expect(fifth.outcome).toBe('paused');
      expect(
        (
          await legacy.emailVerificationCode.findUniqueOrThrow({
            where: { id: activeCode.id },
          })
        ).usedAt,
      ).toBeNull();
      expect(
        (
          await legacy.emailVerificationCode.findUniqueOrThrow({
            where: { id: activeCode.id },
          })
        ).attempts,
      ).toBe(4);

      const exhaustedCounter = await legacy.authAbuseCounter.findUniqueOrThrow({
        where: {
          scope_subjectHash: {
            scope: 'otp_verify',
            subjectHash: createHash('sha256')
              .update(`otp_verify\n${exhausted.id}`)
              .digest('hex'),
          },
        },
      });
      expect(exhaustedCounter.failures).toBe(5);
      const pauseDeadline = exhaustedCounter.pausedUntil;
      expect(pauseDeadline).toEqual(expect.any(Date));
      if (!pauseDeadline)
        throw new Error(
          'Exhausted legacy code did not receive a cutover pause',
        );
      const pauseAt = pauseDeadline.getTime();
      expect(pauseAt).toBeGreaterThanOrEqual(importedAt + OTP_PAUSE_MS - 5_000);
      expect(pauseAt).toBeLessThanOrEqual(Date.now() + OTP_PAUSE_MS + 5_000);
      expect(
        (
          await legacy.emailVerificationCode.findUniqueOrThrow({
            where: { id: exhaustedCode.id },
          })
        ).attempts,
      ).toBe(5);

      const reset = new PasswordResetService(
        legacy as never,
        new PasswordHasherService(),
        { consume: () => true } as never,
        syntheticServerEnv(),
        { sendPasswordReset: async () => undefined } as never,
      );
      await expect(
        reset.resetPassword(usedReset, 'legacy-password-1', {
          ip: '203.0.113.130',
        }),
      ).rejects.toMatchObject({
        apiCode: ApiErrorCode.PASSWORD_RESET_INVALID,
      });
      expect(
        (
          await legacy.passwordResetToken.findUniqueOrThrow({
            where: { id: usedToken.id },
          })
        ).usedAt,
      ).toEqual(usedAt);
      await reset.resetPassword(unusedReset, 'legacy-password-2', {
        ip: '203.0.113.131',
      });
      expect(
        (await legacy.user.findUniqueOrThrow({ where: { id: active.id } }))
          .sessionVersion,
      ).toBe(1);
      expect(
        (
          await legacy.passwordResetToken.findUniqueOrThrow({
            where: { id: unusedToken.id },
          })
        ).usedAt,
      ).toEqual(expect.any(Date));
      await expect(
        reset.resetPassword(unusedReset, 'legacy-password-3', {
          ip: '203.0.113.131',
        }),
      ).rejects.toMatchObject({ apiCode: ApiErrorCode.PASSWORD_RESET_INVALID });

      const operationCount = await legacy.authAbuseOperation.count();
      deployMigrations(stage, schemaUrl);
      expect(await legacy.authAbuseOperation.count()).toBe(operationCount);
      expect(
        (
          await legacy.authAbuseCounter.findUniqueOrThrow({
            where: {
              scope_subjectHash: {
                scope: 'otp_verify',
                subjectHash: createHash('sha256')
                  .update(`otp_verify\n${exhausted.id}`)
                  .digest('hex'),
              },
            },
          })
        ).pausedUntil,
      ).toEqual(pauseDeadline);
      expect(
        (
          await legacy.emailVerificationCode.findUniqueOrThrow({
            where: { id: activeCode.id },
          })
        ).attempts,
      ).toBe(4);
    } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  }, 180_000);
});

function deployMigrations(stage: string, databaseUrl: string) {
  const requireFromDatabase = createRequire(
    resolve(repoRoot, 'packages/database/package.json'),
  );
  const prismaCli = requireFromDatabase.resolve('prisma/build/index.js');
  execFileSync(
    process.execPath,
    [prismaCli, 'migrate', 'deploy', '--schema=prisma/schema.prisma'],
    {
      cwd: stage,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        TMPDIR: process.env.TMPDIR,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'pipe',
    },
  );
}

async function spendAccepted(
  prisma: PrismaClient,
  ownerUserId: string,
  email: string,
  createdAt: Date,
  count: number,
  purpose:
    | 'email_verification_send'
    | 'password_reset_send' = 'email_verification_send',
) {
  for (let index = 0; index < count; index += 1) {
    await prisma.authAbuseOperation.create({
      data: {
        ownerUserId,
        email,
        purpose,
        idempotencyKey: idempotencyKey(),
        contentHash: 'ab'.repeat(32),
        status: 'accepted',
        createdAt,
      },
    });
  }
}

function reserveAt(
  store: AuthAbuseStore,
  ownerUserId: string,
  email: string,
  now: Date,
) {
  return store.reserveMail({
    purpose: 'email_verification_send',
    idempotencyKey: idempotencyKey(),
    ownerUserId,
    contentHash: mailContentHash('email_verification_send', ownerUserId, email),
    now,
    dailyBudget: 1_000_000,
    monthlyBudget: 1_000_000,
  });
}

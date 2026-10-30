import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { turnstileToken as syntheticTurnstileToken } from '../../test/integration/abuse-request';
import { syntheticServerEnv } from '../core/config/synthetic-server-env';
import { AppException } from '../core/errors';
import { AntifraudService } from '../antifraud';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';

const resetProof = syntheticTurnstileToken('password_reset');

const passwordHasher = {
  hash: vi.fn().mockResolvedValue('new-hash'),
};

const rateLimits = {
  consume: vi.fn().mockReturnValue(true),
};

const abuse = {
  lockAbuseUser: AntifraudService.prototype.lockAbuseUser,
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
};

function createService(prisma: unknown) {
  return new PasswordResetService(
    prisma as never,
    passwordHasher as never,
    syntheticServerEnv(),
    { ...abuse, consumeRateLimit: rateLimits.consume } as never,
  );
}

describe('PasswordResetService', () => {
  afterEach(() => {
    vi.clearAllMocks();
    rateLimits.consume.mockReturnValue(true);
    passwordHasher.hash.mockResolvedValue('new-hash');
  });

  it('returns before a reset send when the forgot IP limit is exceeded', async () => {
    rateLimits.consume.mockReturnValueOnce(false);

    await createService({}).requestReset('user@example.com', {
      ip: '203.0.113.4',
      idempotencyKey: 'idem-key-1',
      turnstileToken: resetProof,
    });

    expect(abuse.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('delegates the reset send after the IP limit', async () => {
    await createService({}).requestReset('User@Example.com', {
      ip: '203.0.113.9',
      turnstileToken: resetProof,
      idempotencyKey: 'idem-key-1',
    });

    expect(rateLimits.consume).toHaveBeenCalledWith(
      'password-reset:request:ip:203.0.113.9',
      10,
      60_000,
    );
    expect(abuse.sendPasswordReset).toHaveBeenCalledWith({
      email: 'User@Example.com',
      ip: '203.0.113.9',
      turnstileToken: resetProof,
      idempotencyKey: 'idem-key-1',
    });
  });

  it('reads the prototype ip getter for a forgot request', async () => {
    const request = Object.assign(
      Object.create({
        get ip() {
          return '203.0.113.50';
        },
      }),
      {
        socket: { remoteAddress: '10.0.0.9' },
      },
    );
    expect({ ...request }.ip).toBeUndefined();
    const controller = new PasswordResetController({
      requestReset: abuse.sendPasswordReset,
    } as never);
    await controller.forgot(
      {
        email: 'person@example.com',
        idempotencyKey: 'idem-key-1',
        turnstileToken: resetProof,
      },
      request,
    );
    expect(abuse.sendPasswordReset).toHaveBeenCalledWith(
      'person@example.com',
      expect.objectContaining({
        ip: '203.0.113.50',
        socket: { remoteAddress: '10.0.0.9' },
      }),
    );
  });

  it('rejects expired tokens with PASSWORD_RESET_INVALID', async () => {
    const prisma = {
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'token-1',
          userId: 'user-1',
          usedAt: null,
          expiresAt: new Date(Date.now() - 1),
          user: { id: 'user-1', status: 'active' },
        }),
      },
    };

    await expect(
      createService(prisma).resetPassword('raw-token', 'new-password123'),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.PASSWORD_RESET_INVALID,
    });
  });

  it('increments sessionVersion and marks the token used on success', async () => {
    const tx = {
      emailVerificationCode: { updateMany: vi.fn() },
      authFlow: { updateMany: vi.fn() },
      externalIdentity: { deleteMany: vi.fn() },
      $executeRaw: vi.fn().mockResolvedValue(0),
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'user-1' }]),
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'token-1',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: { status: 'active' },
        }),
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: 'user-1' }),
      },
    };
    const prisma = {
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'token-1',
          userId: 'user-1',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: { id: 'user-1', status: 'active' },
        }),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    await createService(prisma).resetPassword('raw-token', 'new-password123');

    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(tx.passwordResetToken.findUnique).toHaveBeenCalled();
    expect(passwordHasher.hash).toHaveBeenCalledWith('new-password123');
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: 'new-hash',
        sessionVersion: { increment: 1 },
      },
    });
  });

  it('rejects a reset that expires while the password hash waits for the user lock', async () => {
    const early = Date.parse('2026-10-10T12:00:00.000Z');
    const late = early + 10_000;
    vi.useFakeTimers({ now: early });
    const tx = {
      emailVerificationCode: { updateMany: vi.fn() },
      authFlow: { updateMany: vi.fn() },
      externalIdentity: { deleteMany: vi.fn() },
      $executeRaw: vi.fn().mockResolvedValue(0),
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'user-1' }]),
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'token-1',
          usedAt: null,
          expiresAt: new Date(early + 5_000),
          user: { status: 'active' },
        }),
        updateMany: vi.fn(),
      },
      user: { update: vi.fn() },
    };
    const prisma = {
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'token-1',
          userId: 'user-1',
          usedAt: null,
          expiresAt: new Date(early + 60_000),
          user: { id: 'user-1', status: 'active' },
        }),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    passwordHasher.hash.mockImplementation(async () => {
      vi.setSystemTime(late);
      return 'new-hash';
    });

    try {
      await expect(
        createService(prisma).resetPassword('raw-token', 'new-password123'),
      ).rejects.toMatchObject({
        apiCode: ApiErrorCode.PASSWORD_RESET_INVALID,
      });
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(tx.passwordResetToken.updateMany).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not change the password when the locked user is inactive', async () => {
    const tx = {
      emailVerificationCode: { updateMany: vi.fn() },
      authFlow: { updateMany: vi.fn() },
      externalIdentity: { deleteMany: vi.fn() },
      $executeRaw: vi.fn().mockResolvedValue(0),
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'user-1' }]),
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'token-1',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: { status: 'banned' },
        }),
        updateMany: vi.fn(),
      },
      user: { update: vi.fn() },
    };
    const prisma = {
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'token-1',
          userId: 'user-1',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: { id: 'user-1', status: 'active' },
        }),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    await expect(
      createService(prisma).resetPassword('raw-token', 'new-password123'),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.PASSWORD_RESET_INVALID,
    });
    expect(tx.passwordResetToken.updateMany).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('throws RATE_LIMITED when reset IP limit is exceeded', async () => {
    rateLimits.consume.mockReturnValueOnce(false);

    await expect(
      createService({
        passwordResetToken: { findUnique: vi.fn() },
      }).resetPassword('raw-token', 'new-password123'),
    ).rejects.toBeInstanceOf(AppException);
  });
});

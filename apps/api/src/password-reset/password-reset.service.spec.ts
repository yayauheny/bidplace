import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { syntheticServerEnv } from '../core/config/synthetic-server-env';
import { AppException } from '../core/errors';
import {
  PasswordResetService,
  type PasswordResetRequestContext,
} from './password-reset.service';
import { MailTransport } from '../core/mail';

const passwordHasher = {
  hash: vi.fn().mockResolvedValue('new-hash'),
};

const rateLimits = {
  consume: vi.fn().mockReturnValue(true),
};

const mail: MailTransport = {
  send: vi.fn().mockResolvedValue(undefined),
};

function createService(
  prisma: unknown,
  overrides: NodeJS.ProcessEnv = {},
) {
  return new PasswordResetService(
    prisma as never,
    passwordHasher as never,
    mail,
    rateLimits as never,
    syntheticServerEnv(overrides),
  );
}

describe('PasswordResetService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(mail.send).mockReset();
    vi.mocked(mail.send).mockResolvedValue(undefined);
    vi.mocked(rateLimits.consume).mockReset();
    vi.mocked(rateLimits.consume).mockReturnValue(true);
  });

  it('returns without creating a token for unknown emails', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      passwordResetToken: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    await createService(prisma).requestReset('missing@example.com');

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('returns without creating a token for banned users', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'banned@example.com',
          status: 'banned',
        }),
      },
      passwordResetToken: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    await createService(prisma).requestReset('banned@example.com');

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('creates a token and sends mail for active users', async () => {
    vi.stubEnv('PASSWORD_RESET_URL_BASE', 'http://ignored.example');
    const tx = {
      passwordResetToken: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 'token-1' }),
      },
    };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          status: 'active',
        }),
      },
      passwordResetToken: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await createService(prisma).requestReset('user@example.com');

    expect(tx.passwordResetToken.updateMany).toHaveBeenCalled();
    expect(tx.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.any(String),
        }),
      }),
    );
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'bidplace password reset',
        text: expect.stringContaining(
          'http://localhost:8081/reset-password?token=',
        ),
      }),
    );
  });

  it('returns without creating a token when forgot IP rate limits are exceeded', async () => {
    rateLimits.consume.mockReturnValueOnce(false);

    const prisma = {
      user: {
        findUnique: vi.fn(),
      },
      passwordResetToken: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    await createService(prisma).requestReset('user@example.com');

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('returns without creating a token when forgot email rate limits are exceeded', async () => {
    rateLimits.consume
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          status: 'active',
        }),
      },
      passwordResetToken: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    await createService(prisma).requestReset('user@example.com');

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('ignores resend cooldown for already-used tokens', async () => {
    const tx = {
      passwordResetToken: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 'token-2' }),
      },
    };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          status: 'active',
        }),
      },
      passwordResetToken: {
        findFirst: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await createService(prisma).requestReset('user@example.com');

    expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', usedAt: null },
      }),
    );
    expect(tx.passwordResetToken.create).toHaveBeenCalled();
  });

  it('deletes the token but still completes when mail delivery fails', async () => {
    vi.mocked(mail.send).mockRejectedValueOnce(new Error('smtp down'));

    const tx = {
      passwordResetToken: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 'token-1' }),
      },
    };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          status: 'active',
        }),
      },
      passwordResetToken: {
        findFirst: vi.fn().mockResolvedValue(null),
        delete: vi.fn().mockResolvedValue({ id: 'token-1' }),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await expect(
      createService(prisma).requestReset('user@example.com'),
    ).resolves.toBeUndefined();

    expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { id: 'token-1' },
    });
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
      passwordResetToken: {
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
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await createService(prisma).resetPassword('raw-token', 'new-password123');

    expect(passwordHasher.hash).toHaveBeenCalledWith('new-password123');
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: 'new-hash',
        sessionVersion: { increment: 1 },
      },
    });
  });

  it('throws RATE_LIMITED when reset IP limit is exceeded', async () => {
    rateLimits.consume.mockReturnValueOnce(false);

    await expect(
      createService({ passwordResetToken: { findUnique: vi.fn() } }).resetPassword(
        'raw-token',
        'new-password123',
      ),
    ).rejects.toBeInstanceOf(AppException);
  });
});

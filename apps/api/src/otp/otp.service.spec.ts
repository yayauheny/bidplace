import { afterEach, describe, expect, it, vi } from 'vitest';

import { syntheticServerEnv } from '../core/config/synthetic-server-env';
import { MailTransport } from '../core/mail';
import { OtpService } from './otp.service';

const mail: MailTransport = { send: vi.fn() };
const rateLimits = { consume: vi.fn().mockReturnValue(true) };

describe('OtpService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(mail.send).mockReset();
  });

  it('rejects an expired code without marking the user verified', async () => {
    const prisma = {
      emailVerificationCode: {
        findFirst: vi.fn().mockResolvedValue({
          expiresAt: new Date(Date.now() - 1),
          attempts: 0,
          usedAt: null,
          codeHash: 'hash',
        }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          emailVerifiedAt: null,
        }),
        update: vi.fn(),
      },
    };
    const service = new OtpService(
      prisma as never,
      mail,
      rateLimits as never,
      syntheticServerEnv(),
    );

    await expect(service.verify('user-id', '123456')).rejects.toThrow('OTP has expired');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects a code after five failed attempts', async () => {
    const prisma = {
      emailVerificationCode: {
        findFirst: vi.fn().mockResolvedValue({
          expiresAt: new Date(Date.now() + 60_000),
          attempts: 5,
          usedAt: null,
          codeHash: 'hash',
        }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          emailVerifiedAt: null,
        }),
        update: vi.fn(),
      },
    };
    const service = new OtpService(
      prisma as never,
      mail,
      rateLimits as never,
      syntheticServerEnv(),
    );

    await expect(service.verify('user-id', '123456')).rejects.toThrow('OTP retry limit reached');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('enforces the resend cooldown before creating a new code', async () => {
    const prisma = {
      emailVerificationCode: {
        findFirst: vi.fn().mockResolvedValue({ createdAt: new Date() }),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          email: 'user@example.com',
          emailVerifiedAt: null,
        }),
      },
    };
    const service = new OtpService(
      prisma as never,
      mail,
      rateLimits as never,
      syntheticServerEnv(),
    );

    await expect(service.request('user-id')).rejects.toThrow('OTP resend cooldown is active');
    expect(prisma.emailVerificationCode.create).not.toHaveBeenCalled();
  });

  it('uses the injected bypass flag when process.env disables it', async () => {
    vi.stubEnv('TEST_EMAIL_BYPASS', 'false');
    const prisma = {
      emailVerificationCode: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'code-1' }),
        update: vi.fn(),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          email: 'user@example.com',
          emailVerifiedAt: null,
        }),
        update: vi.fn(),
      },
      $transaction: vi.fn().mockResolvedValue([]),
    };
    const service = new OtpService(
      prisma as never,
      mail,
      rateLimits as never,
      syntheticServerEnv({ TEST_EMAIL_BYPASS: 'true' }),
    );

    await service.request('user-id');

    expect(mail.send).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('sends mail when the injected snapshot disables bypass', async () => {
    vi.stubEnv('TEST_EMAIL_BYPASS', 'true');
    vi.mocked(mail.send).mockResolvedValue(undefined);
    const prisma = {
      emailVerificationCode: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'code-1' }),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          email: 'user@example.com',
          emailVerifiedAt: null,
        }),
      },
    };
    const service = new OtpService(
      prisma as never,
      mail,
      rateLimits as never,
      syntheticServerEnv({ TEST_EMAIL_BYPASS: 'false' }),
    );

    await service.request('user-id');

    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'bidplace email verification code',
      }),
    );
    expect(prisma.emailVerificationCode.delete).not.toHaveBeenCalled();
  });
});

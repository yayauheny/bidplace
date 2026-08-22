import { describe, expect, it, vi } from 'vitest';

import { MailTransport } from '../core/mail';
import { OtpService } from './otp.service';

const mail: MailTransport = { send: vi.fn() };
const rateLimits = { consume: vi.fn().mockReturnValue(true) };

describe('OtpService', () => {
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
    const service = new OtpService(prisma as never, mail, rateLimits as never);

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
    const service = new OtpService(prisma as never, mail, rateLimits as never);

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
    const service = new OtpService(prisma as never, mail, rateLimits as never);

    await expect(service.request('user-id')).rejects.toThrow('OTP resend cooldown is active');
    expect(prisma.emailVerificationCode.create).not.toHaveBeenCalled();
  });
});

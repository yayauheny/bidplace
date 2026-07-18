import { describe, expect, it, vi } from 'vitest';

import { OtpService, OtpTransport } from './otp.service';

const transport: OtpTransport = { deliver: vi.fn() };

describe('OtpService', () => {
  it('rejects an expired code without marking the user verified', async () => {
    const prisma = {
      phoneVerificationCode: { findFirst: vi.fn().mockResolvedValue({ expiresAt: new Date(Date.now() - 1), attempts: 0 }) },
      user: { update: vi.fn() },
    };
    const service = new OtpService(prisma as never, transport);

    await expect(service.verify('user-id', '123456')).rejects.toThrow('OTP has expired');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects a code after five failed attempts', async () => {
    const prisma = {
      phoneVerificationCode: { findFirst: vi.fn().mockResolvedValue({ expiresAt: new Date(Date.now() + 60_000), attempts: 5 }) },
      user: { update: vi.fn() },
    };
    const service = new OtpService(prisma as never, transport);

    await expect(service.verify('user-id', '123456')).rejects.toThrow('OTP retry limit reached');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('enforces the resend cooldown before creating a new code', async () => {
    const prisma = {
      phoneVerificationCode: { findFirst: vi.fn().mockResolvedValue({ createdAt: new Date() }), create: vi.fn() },
      user: { findUnique: vi.fn() },
    };
    const service = new OtpService(prisma as never, transport);

    await expect(service.request('user-id')).rejects.toThrow('OTP resend cooldown is active');
    expect(prisma.phoneVerificationCode.create).not.toHaveBeenCalled();
  });
});

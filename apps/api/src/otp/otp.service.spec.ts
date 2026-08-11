import { describe, expect, it, vi } from 'vitest';

import {
  buildSmtpTransportOptions,
  OtpService,
  OtpTransport,
} from './otp.service';

const transport: OtpTransport = { deliver: vi.fn() };
const rateLimits = { consume: vi.fn().mockReturnValue(true) };

describe('OtpService', () => {
  it('requires TLS for production SMTP relays and rejects partial auth', () => {
    expect(
      buildSmtpTransportOptions({
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
      SMTP_SECURE: false,
        SMTP_AUTH_MODE: 'none',
        SMTP_FROM: 'no-reply@example.com',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
      } as never).requireTLS,
    ).toBe(true);

    expect(() =>
      buildSmtpTransportOptions({
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 465,
      SMTP_SECURE: true,
        SMTP_AUTH_MODE: 'login',
        SMTP_USERNAME: 'user',
        SMTP_FROM: 'no-reply@example.com',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
      } as never),
    ).toThrow('SMTP_USERNAME and SMTP_PASSWORD must be configured together');
  });

  it('omits SMTP auth for an unauthenticated relay', () => {
    expect(
      buildSmtpTransportOptions({
        NODE_ENV: 'development',
        SMTP_AUTH_MODE: 'none',
        SMTP_HOST: 'mailpit',
        SMTP_PORT: 1025,
        SMTP_SECURE: false,
        SMTP_FROM: 'no-reply@example.com',
      } as never),
    ).not.toHaveProperty('auth');
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
    const service = new OtpService(prisma as never, transport, rateLimits as never);

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
    const service = new OtpService(prisma as never, transport, rateLimits as never);

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
    const service = new OtpService(prisma as never, transport, rateLimits as never);

    await expect(service.request('user-id')).rejects.toThrow('OTP resend cooldown is active');
    expect(prisma.emailVerificationCode.create).not.toHaveBeenCalled();
  });
});

import { type ServerEnv, loadServerEnv } from '../core/config';
import { PrismaService } from '../core/database';
import { RateLimitService } from '../core/rate-limit';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createHash,
  randomInt,
} from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import {
  createTransport,
  type Transporter,
} from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type OtpRequestContext = {
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

export abstract class OtpTransport {
  abstract deliver(email: string, code: string): Promise<void>;
}

@Injectable()
export class LocalOtpTransport extends OtpTransport {
  async deliver(email: string, code: string): Promise<void> {
    const env = loadServerEnv();

    if (env.NODE_ENV === 'production') {
      throw new Error('Local OTP transport cannot run in production');
    }

    if (env.TEST_EMAIL_FILE) {
      await appendFile(
        env.TEST_EMAIL_FILE,
        `${JSON.stringify({ email, code })}\n`,
      );
    }
  }
}

@Injectable()
export class SmtpOtpTransport extends OtpTransport {
  constructor(
    private readonly env: ServerEnv,
    private readonly transport: Transporter,
  ) {
    super();
  }

  static create(env: ServerEnv): SmtpOtpTransport {
    return new SmtpOtpTransport(
      env,
      createTransport(buildSmtpTransportOptions(env)),
    );
  }

  async deliver(email: string, code: string): Promise<void> {
    await this.transport.sendMail({
      from: this.env.SMTP_FROM,
      to: email,
      subject: 'bidplace email verification code',
      text: `Your bidplace verification code is ${code}.`,
    });
  }
}

export function buildSmtpTransportOptions(env: ServerEnv): SMTPTransport.Options {
  const hasUsername = env.SMTP_USERNAME !== undefined;
  const hasPassword = env.SMTP_PASSWORD !== undefined;

  if (env.SMTP_AUTH_MODE === 'login' && (!hasUsername || !hasPassword)) {
    throw new Error('SMTP_USERNAME and SMTP_PASSWORD must be configured together');
  }

  if (env.SMTP_AUTH_MODE === 'none' && (hasUsername || hasPassword)) {
    throw new Error('SMTP_USERNAME and SMTP_PASSWORD require SMTP_AUTH_MODE=login');
  }

  const auth =
    env.SMTP_AUTH_MODE === 'login' && hasUsername && hasPassword
      ? {
          user: env.SMTP_USERNAME,
          pass: env.SMTP_PASSWORD,
        }
      : undefined;

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? false,
    requireTLS: env.SMTP_SECURE === false,
    ...(auth ? { auth } : {}),
    connectionTimeout: 10_000,
    socketTimeout: 10_000,
  };
}

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

function isTestEmailBypassEnabled(env: ServerEnv): boolean {
  return env.NODE_ENV === 'test' && env.TEST_EMAIL_BYPASS === true;
}

function resolveIp(context?: OtpRequestContext): string {
  return context?.ip ?? context?.socket?.remoteAddress ?? 'unknown';
}

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transport: OtpTransport,
    private readonly rateLimits: RateLimitService,
  ) {}

  async request(userId: string, context?: OtpRequestContext): Promise<void> {
    const ip = resolveIp(context);
    this.consumeRequestLimits(userId, ip);
    const env = loadServerEnv();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true },
    });

    if (!user) {
      throw new ForbiddenException('User is not available');
    }

    if (user.emailVerifiedAt) {
      return;
    }

    const last = await this.prisma.emailVerificationCode.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (last && Date.now() - last.createdAt.getTime() < 60_000) {
      throw new ConflictException('OTP resend cooldown is active');
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const record = await this.prisma.emailVerificationCode.create({
      data: {
        userId,
        codeHash: hash(code),
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });

    if (isTestEmailBypassEnabled(env)) {
      const now = new Date();

      await this.prisma.$transaction([
        this.prisma.emailVerificationCode.update({
          where: { id: record.id },
          data: { usedAt: now },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { emailVerifiedAt: now },
        }),
      ]);

      return;
    }

    try {
      await this.transport.deliver(user.email, code);
    } catch {
      await this.prisma.emailVerificationCode.delete({
        where: { id: record.id },
      });
      throw new ServiceUnavailableException('Email delivery failed');
    }
  }

  async verify(
    userId: string,
    code: string,
    context?: OtpRequestContext,
  ): Promise<void> {
    const ip = resolveIp(context);
    this.consumeVerifyLimits(userId, ip);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });

    if (!user) {
      throw new ForbiddenException('User is not available');
    }

    if (user.emailVerifiedAt) {
      return;
    }

    const now = new Date();
    const record = await this.prisma.emailVerificationCode.findFirst({
      where: { userId, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt <= now) {
      throw new ForbiddenException('OTP has expired');
    }

    if (record.attempts >= 5) {
      throw new ForbiddenException('OTP retry limit reached');
    }

    if (record.codeHash !== hash(code)) {
      await this.prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new ForbiddenException('OTP is invalid');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: now },
      }),
    ]);
  }

  private consumeRequestLimits(userId: string, ip: string): void {
    if (
      !this.rateLimits.consume(`email-otp:request:user:${userId}`, 3, 60_000)
    ) {
      throw new ConflictException('OTP resend cooldown is active');
    }

    if (!this.rateLimits.consume(`email-otp:request:ip:${ip}`, 10, 60_000)) {
      throw new ConflictException('OTP resend cooldown is active');
    }
  }

  private consumeVerifyLimits(userId: string, ip: string): void {
    if (
      !this.rateLimits.consume(`email-otp:verify:user:${userId}`, 10, 60_000)
    ) {
      throw new ConflictException('OTP retry limit reached');
    }

    if (!this.rateLimits.consume(`email-otp:verify:ip:${ip}`, 20, 60_000)) {
      throw new ConflictException('OTP retry limit reached');
    }
  }
}

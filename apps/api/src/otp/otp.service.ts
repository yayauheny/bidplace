import {
  isTestEmailBypassEnabled,
  SERVER_ENV,
  type ServerEnv,
} from '../core/config';
import { PrismaService } from '../core/database';
import { MailTransport } from '../core/mail';
import { RateLimitService } from '../core/rate-limit';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';

export type OtpRequestContext = {
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

function resolveIp(context?: OtpRequestContext): string {
  return context?.ip ?? context?.socket?.remoteAddress ?? 'unknown';
}

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailTransport,
    private readonly rateLimits: RateLimitService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  async request(userId: string, context?: OtpRequestContext): Promise<void> {
    const ip = resolveIp(context);
    this.consumeRequestLimits(userId, ip);
    const env = this.env;

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
      await this.mail.send({
        to: user.email,
        subject: 'bidplace email verification code',
        text: `Your bidplace verification code is ${code}.`,
      });
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

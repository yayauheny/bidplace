import { ApiErrorCode } from '@bidplace/contracts';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PasswordHasherService } from '../auth/password-hasher.service';
import { type ServerEnv, loadServerEnv, resolveCorsOrigin } from '../core/config';
import { PrismaService } from '../core/database';
import { AppException } from '../core/errors';
import { RateLimitService } from '../core/rate-limit';
import {
  buildPasswordResetLink,
  PasswordResetTransport,
} from './password-reset.transport';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60_000;

export type PasswordResetRequestContext = {
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function resolveIp(context?: PasswordResetRequestContext): string {
  return context?.ip ?? context?.socket?.remoteAddress ?? 'unknown';
}

function resolveResetUrlBase(env: ServerEnv): string | undefined {
  return env.PASSWORD_RESET_URL_BASE ?? resolveCorsOrigin(env);
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly transport: PasswordResetTransport,
    private readonly rateLimits: RateLimitService,
  ) {}

  async requestReset(
    email: string,
    context?: PasswordResetRequestContext,
  ): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    const ip = resolveIp(context);
    if (!this.consumeForgotIpLimit(ip)) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, status: true },
    });

    if (!user || user.status !== 'active') {
      return;
    }

    if (!this.consumeForgotEmailLimit(normalizedEmail)) {
      return;
    }

    const last = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      return;
    }

    const env = loadServerEnv();
    const resetUrlBase = resolveResetUrlBase(env);
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);

    const record = await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      return tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });
    });

    if (!resetUrlBase) {
      await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
      this.logger.error(
        'Password reset link base URL is not configured; token removed',
      );
      return;
    }

    const resetLink = buildPasswordResetLink(resetUrlBase, rawToken);

    try {
      await this.transport.deliver(user.email, resetLink);
    } catch (error) {
      await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
      this.logger.error(
        'Password reset email delivery failed; token removed',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async resetPassword(
    token: string,
    password: string,
    context?: PasswordResetRequestContext,
  ): Promise<void> {
    const ip = resolveIp(context);
    this.consumeResetLimits(ip);

    const tokenHash = hashToken(token.trim());
    const now = new Date();

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!record || record.usedAt || record.expiresAt <= now) {
      throw new AppException({
        status: HttpStatus.BAD_REQUEST,
        code: ApiErrorCode.PASSWORD_RESET_INVALID,
        message: 'Password reset link is invalid or expired',
      });
    }

    if (record.user.status !== 'active') {
      throw new AppException({
        status: HttpStatus.BAD_REQUEST,
        code: ApiErrorCode.PASSWORD_RESET_INVALID,
        message: 'Password reset link is invalid or expired',
      });
    }

    const passwordHash = await this.passwordHasher.hash(password);

    const updated = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: record.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (consumed.count !== 1) {
        return false;
      }

      await tx.passwordResetToken.updateMany({
        where: {
          userId: record.userId,
          usedAt: null,
          id: { not: record.id },
        },
        data: { usedAt: now },
      });

      await tx.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          sessionVersion: { increment: 1 },
        },
      });

      return true;
    });

    if (!updated) {
      throw new AppException({
        status: HttpStatus.BAD_REQUEST,
        code: ApiErrorCode.PASSWORD_RESET_INVALID,
        message: 'Password reset link is invalid or expired',
      });
    }
  }

  private consumeForgotIpLimit(ip: string): boolean {
    return this.rateLimits.consume(
      `password-reset:request:ip:${ip}`,
      10,
      60_000,
    );
  }

  private consumeForgotEmailLimit(email: string): boolean {
    return this.rateLimits.consume(
      `password-reset:request:email:${email}`,
      3,
      60_000,
    );
  }

  private consumeResetLimits(ip: string): void {
    if (!this.rateLimits.consume(`password-reset:reset:ip:${ip}`, 20, 60_000)) {
      throw new AppException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ApiErrorCode.RATE_LIMITED,
        message: 'Too many requests',
      });
    }
  }
}

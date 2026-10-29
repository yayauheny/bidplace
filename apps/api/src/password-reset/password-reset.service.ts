import { ApiErrorCode } from '@bidplace/contracts';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import {
  AntifraudService,
  resolveClientIp,
  type ClientIpRequest,
} from '../antifraud';
import { PasswordHasherService } from '../auth/password-hasher.service';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import { PrismaService } from '../core/database';
import { AppException } from '../core/errors';
import { RateLimitService } from '../core/rate-limit';

export type PasswordResetRequestContext = ClientIpRequest & {
  turnstileToken: string;
  idempotencyKey: string;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly rateLimits: RateLimitService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
    private readonly abuse: AntifraudService,
  ) {}

  async requestReset(
    email: string,
    context: PasswordResetRequestContext,
  ): Promise<void> {
    const ip = resolveClientIp(context, this.env.TRUST_PROXY);
    if (!this.consumeForgotIpLimit(ip)) return;

    await this.abuse.sendPasswordReset({
      email,
      turnstileToken: context.turnstileToken,
      idempotencyKey: context.idempotencyKey,
      ip,
    });
  }

  async resetPassword(
    token: string,
    password: string,
    context?: ClientIpRequest,
  ): Promise<void> {
    const ip = resolveClientIp(context, this.env.TRUST_PROXY);
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
      await this.abuse.lockAbuseUser(tx, record.userId);
      const current = await tx.passwordResetToken.findUnique({
        where: { id: record.id },
        select: {
          id: true,
          usedAt: true,
          expiresAt: true,
          user: { select: { status: true } },
        },
      });
      const consumedAt = new Date();
      if (
        !current ||
        current.usedAt ||
        current.expiresAt <= consumedAt ||
        current.user.status !== 'active'
      ) {
        return false;
      }

      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: current.id,
          usedAt: null,
          expiresAt: { gt: consumedAt },
        },
        data: { usedAt: consumedAt },
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
        data: { usedAt: consumedAt },
      });

      await tx.emailVerificationCode.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: consumedAt },
      });
      await tx.authFlow.updateMany({
        where: {
          userId: record.userId,
          stage: { notIn: ['complete', 'cancelled', 'failed'] },
        },
        data: { stage: 'cancelled', verifier: null, nonce: null },
      });
      await tx.externalIdentity.deleteMany({
        where: { userId: record.userId, activatedAt: null },
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

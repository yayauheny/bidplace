import { AntifraudService } from '../antifraud';
import {
  type AdminUserRevokeSessionsRequest,
  type AdminUserStatusUpdateRequest,
} from '@bidplace/contracts';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService, runSerializableTransaction } from '../core/database';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertSessionRevokeTargetAllowed(
  adminUserId: string,
  target: { id: string; role: string },
): void {
  if (target.id === adminUserId) {
    throw new ForbiddenException(
      'Admins cannot revoke their own sessions through emergency controls',
    );
  }
  if (target.role === 'admin') {
    throw new ForbiddenException(
      'Admin sessions cannot be revoked through emergency controls',
    );
  }
}

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly antifraud: AntifraudService,
  ) {}

  async lookupByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
      },
    });

    return { users: user ? [user] : [] };
  }

  async updateStatus(
    adminUserId: string,
    userId: string,
    input: AdminUserStatusUpdateRequest,
  ) {
    return this.antifraud.updateUserStatus(adminUserId, userId, input);
  }

  releaseHold(adminId: string, userId: string, note: string) {
    return this.antifraud.releaseHold(adminId, userId, note);
  }

  ban(adminId: string, userId: string, reason: string) {
    return this.antifraud.banUser(adminId, userId, reason);
  }

  async card(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      ...user,
      trustSignals: await this.antifraud.getTrustSignals(this.prisma, userId),
    };
  }

  async revokeSessions(
    adminUserId: string,
    userId: string,
    input: AdminUserRevokeSessionsRequest,
  ) {
    return runSerializableTransaction(this.prisma, async (tx) => {
      await this.antifraud.lockUsers(tx, [adminUserId, userId]);
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        this.logger.warn('Admin session revoke target was not found');
        throw new NotFoundException('User not found');
      }

      assertSessionRevokeTargetAllowed(adminUserId, user);

      const updated = await tx.user.update({
        where: { id: userId },
        data: { sessionVersion: { increment: 1 } },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: adminUserId,
          targetType: 'USER',
          targetId: user.id,
          oldStatus: 'session',
          newStatus: 'revoked',
          reason: input.reason,
        },
      });

      return updated;
    });
  }
}

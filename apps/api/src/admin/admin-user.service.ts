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

function assertIncidentTargetAllowed(
  adminUserId: string,
  target: { id: string; role: string },
  action: 'status' | 'revoke-sessions',
): void {
  if (target.id === adminUserId) {
    throw new ForbiddenException(
      action === 'status'
        ? 'Admins cannot change their own account status'
        : 'Admins cannot revoke their own sessions through emergency controls',
    );
  }

  if (target.role === 'admin') {
    throw new ForbiddenException(
      action === 'status'
        ? 'Admin accounts cannot be banned or unbanned through emergency controls'
        : 'Admin sessions cannot be revoked through emergency controls',
    );
  }
}

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    return runSerializableTransaction(this.prisma, async (tx) => {
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
        this.logger.warn('Admin user status target was not found');
        throw new NotFoundException('User not found');
      }

      assertIncidentTargetAllowed(adminUserId, user, 'status');

      if (user.status === input.status) {
        return user;
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          status: input.status,
          ...(input.status === 'banned'
            ? { sessionVersion: { increment: 1 } }
            : {}),
        },
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
          oldStatus: user.status,
          newStatus: input.status,
          reason: input.reason,
        },
      });

      return updated;
    });
  }

  async revokeSessions(
    adminUserId: string,
    userId: string,
    input: AdminUserRevokeSessionsRequest,
  ) {
    return runSerializableTransaction(this.prisma, async (tx) => {
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

      assertIncidentTargetAllowed(adminUserId, user, 'revoke-sessions');

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

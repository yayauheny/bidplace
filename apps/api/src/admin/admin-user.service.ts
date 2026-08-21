import {
  type AdminUserRevokeSessionsRequest,
  type AdminUserStatusUpdateRequest,
} from '@bidplace/contracts';
import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService, runSerializableTransaction } from '../core/database';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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
          sessionVersion: true,
        },
      });

      if (!user) {
        this.logger.warn('Admin session revoke target was not found');
        throw new NotFoundException('User not found');
      }

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
          oldStatus: String(user.sessionVersion),
          newStatus: String(user.sessionVersion + 1),
          reason: input.reason,
        },
      });

      return updated;
    });
  }
}

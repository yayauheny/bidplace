import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AntifraudService } from '../antifraud';

import { AdminUserService } from './admin-user.service';

function createService(prisma: unknown) {
  return new AdminUserService(prisma as never, {} as AntifraudService);
}

describe('AdminUserService', () => {
  it('returns an empty list for unknown emails', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    await expect(
      createService(prisma).lookupByEmail('missing@example.com'),
    ).resolves.toEqual({ users: [] });
  });

  it('revokes sessions and writes audit with stable labels', async () => {
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          role: 'user',
          status: 'active',
          sessionVersion: 2,
        }),
        update: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          role: 'user',
          status: 'active',
        }),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    await createService(prisma).revokeSessions('admin-1', 'user-1', {
      reason: 'Compromised account',
    });

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { sessionVersion: { increment: 1 } },
      select: expect.any(Object),
    });
    expect(tx.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetType: 'USER',
        oldStatus: 'session',
        newStatus: 'revoked',
        reason: 'Compromised account',
      }),
    });
  });

  it('rejects self session revoke', async () => {
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'admin-1',
          email: 'admin@example.com',
          displayName: 'Admin',
          role: 'admin',
          status: 'active',
          sessionVersion: 1,
        }),
        update: vi.fn(),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    await expect(
      createService(prisma).revokeSessions('admin-1', 'admin-1', {
        reason: 'Self revoke',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

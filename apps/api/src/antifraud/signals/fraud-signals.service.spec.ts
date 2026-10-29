import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { FraudSignalsService } from './fraud-signals.service';
function createService(prisma: unknown) {
  return new FraudSignalsService(prisma as never);
}
describe('canonical antifraud user status changes', () => {
  it('bans an active user, increments sessionVersion, and writes audit', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ role: 'admin', status: 'active' })
          .mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            displayName: 'User',
            role: 'user',
            status: 'active',
          }),
        update: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'User',
          role: 'user',
          status: 'banned',
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

    await createService(prisma).updateUserStatus('admin-1', 'user-1', {
      status: 'banned',
      reason: 'Abuse',
    });

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        status: 'banned',
        sessionVersion: { increment: 1 },
      },
      select: expect.any(Object),
    });
    expect(tx.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        targetType: 'USER',
        targetId: 'user-1',
        oldStatus: 'active',
        newStatus: 'banned',
        reason: 'Abuse',
      }),
    });
  });

  it('rejects self status changes', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ role: 'admin', status: 'active' })
          .mockResolvedValue({
            id: 'admin-1',
            email: 'admin@example.com',
            displayName: 'Admin',
            role: 'admin',
            status: 'active',
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
      createService(prisma).updateUserStatus('admin-1', 'admin-1', {
        status: 'banned',
        reason: 'Self ban',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('rejects admin account status changes', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ role: 'admin', status: 'active' })
          .mockResolvedValue({
            id: 'admin-2',
            email: 'other-admin@example.com',
            displayName: 'Other admin',
            role: 'admin',
            status: 'active',
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
      createService(prisma).updateUserStatus('admin-1', 'admin-2', {
        status: 'banned',
        reason: 'Ban admin',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns without audit when status is unchanged', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ role: 'admin', status: 'active' })
          .mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            displayName: 'User',
            role: 'user',
            status: 'banned',
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

    await createService(prisma).updateUserStatus('admin-1', 'user-1', {
      status: 'banned',
      reason: 'Repeat',
    });

    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });
});

import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../core/database';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const prisma = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    bid: {
      findMany: vi.fn(),
    },
  };

  const service = new AdminService(prisma as unknown as PrismaService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists users with their status', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'seller@example.com',
        phone: '+15555550123',
        displayName: 'Demo Seller',
        role: 'user',
        status: 'active',
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
      },
    ]);

    const result = await service.listUsers();

    expect(result.users[0].status).toBe('active');
  });

  it('bans a user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      phone: '+15555550123',
      displayName: 'Demo Seller',
      role: 'user',
      status: 'active',
      createdAt: new Date('2026-07-13T12:00:00.000Z'),
      updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    });
    prisma.user.update.mockResolvedValue({
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      phone: '+15555550123',
      displayName: 'Demo Seller',
      role: 'user',
      status: 'banned',
      createdAt: new Date('2026-07-13T12:00:00.000Z'),
      updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    });

    const result = await service.banUser(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    );

    expect(result.user.status).toBe('banned');
  });

  it('rejects banning missing users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.banUser('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

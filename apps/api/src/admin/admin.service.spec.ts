import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@bidplace/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminService, type AdminRepository } from './admin.service';
import { authUserContractSelect } from '../auth/auth.mapper';
import { auctionContractSelect } from '../auctions/auction.mapper';
import { bidContractSelect } from '../bids/bid.mapper';

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
  } satisfies AdminRepository;

  const service = new AdminService(prisma);

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

    const result = await service.listUsers({ page: 2, limit: 5 });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      skip: 5,
      take: 5,
      select: authUserContractSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    expect(result.users[0].status).toBe('active');
  });

  it('lists auctions with pagination', async () => {
    prisma.auction.findMany.mockResolvedValue([
      {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        slug: 'demo-auction',
        startPrice: new Decimal(100),
        reservePrice: new Decimal(150),
        currentPrice: new Decimal(100),
        currency: 'USD',
        bidStep: new Decimal(5),
        startsAt: new Date('2026-07-13T12:00:00.000Z'),
        endsAt: new Date('2026-07-14T12:00:00.000Z'),
        status: 'active',
        bidCount: 0,
        winnerBidId: null,
        buyNowPrice: null,
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
      },
    ]);

    const result = await service.listAuctions({ page: 3, limit: 7 });

    expect(prisma.auction.findMany).toHaveBeenCalledWith({
      skip: 14,
      take: 7,
      select: auctionContractSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    expect(result.auctions[0].slug).toBe('demo-auction');
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

  it('lists bids for auctions with pagination', async () => {
    prisma.auction.findUnique.mockResolvedValue({
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    });
    prisma.bid.findMany.mockResolvedValue([
      {
        id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        amount: new Decimal(125),
        status: 'winning',
        createdAt: new Date('2026-07-13T12:10:00.000Z'),
        updatedAt: new Date('2026-07-13T12:10:00.000Z'),
      },
    ]);

    const result = await service.listAuctionBids(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      { page: 2, limit: 4 },
    );

    expect(prisma.bid.findMany).toHaveBeenCalledWith({
      where: {
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
      select: bidContractSelect,
      skip: 4,
      take: 4,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    expect(result.bids).toHaveLength(1);
  });
});

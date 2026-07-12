import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../core/database';
import { AuctionsService, calculateBidStep } from './auctions.service';

type AuctionRecord = {
  id: string;
  lotId: string;
  sellerProfileId: string;
  slug: string;
  startPrice: number;
  reservePrice: number;
  currentPrice: number;
  currency: string;
  bidStep: number;
  startsAt: Date;
  endsAt: Date;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
};

function createAuctionRecord(
  overrides: Partial<AuctionRecord> = {},
): AuctionRecord {
  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
    sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
    slug: 'demo-auction',
    startPrice: 100,
    reservePrice: 150,
    currentPrice: 100,
    currency: 'USD',
    bidStep: 5,
    startsAt: new Date('2026-07-13T13:00:00.000Z'),
    endsAt: new Date('2026-07-14T13:00:00.000Z'),
    status: 'draft',
    bidCount: 0,
    winnerBidId: null,
    buyNowPrice: null,
    createdAt: new Date('2026-07-13T12:00:00.000Z'),
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

describe('calculateBidStep', () => {
  it.each([
    [0, 0.5],
    [24.99, 0.5],
    [25, 1],
    [99.99, 1],
    [100, 5],
    [499.99, 5],
    [500, 10],
    [999.99, 10],
    [1000, 25],
  ])('maps %s to %s', (amount, step) => {
    expect(calculateBidStep(amount)).toBe(step);
  });
});

describe('AuctionsService', () => {
  const prisma = {
    sellerProfile: {
      findUnique: vi.fn(),
    },
    lot: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auction: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  const realtimeEventsService = {
    publishAuctionUpdated: vi.fn(),
  };

  const service = new AuctionsService(
    prisma as unknown as PrismaService,
    realtimeEventsService as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:30:00.000Z'));
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: typeof prisma) => Promise<unknown>)(prisma),
    );
  });

  it('creates an auction draft for an active seller with a draft lot', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'draft',
    });
    prisma.auction.findFirst.mockResolvedValue(null);
    prisma.auction.create.mockResolvedValue(createAuctionRecord());

    const result = await service.createAuction(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      {
        lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currency: 'USD',
        startsAt: '2026-07-13T13:00:00.000Z',
        endsAt: '2026-07-14T13:00:00.000Z',
      },
    );

    expect(prisma.auction.create).toHaveBeenCalledWith({
      data: {
        lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currentPrice: 100,
        currency: 'USD',
        bidStep: 5,
        startsAt: new Date('2026-07-13T13:00:00.000Z'),
        endsAt: new Date('2026-07-14T13:00:00.000Z'),
        status: 'draft',
        bidCount: 0,
        winnerBidId: null,
        buyNowPrice: null,
      },
    });
    expect(result.auction.status).toBe('draft');
    expect(result.auction.bidStep).toBe(5);
    expect(realtimeEventsService.publishAuctionUpdated).not.toHaveBeenCalled();
  });

  it('rejects auction creation when the lot already has an auction', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'draft',
    });
    prisma.auction.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.createAuction('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', {
        lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currency: 'USD',
        startsAt: '2026-07-13T13:00:00.000Z',
        endsAt: '2026-07-14T13:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('publishes a draft auction as scheduled when it starts in the future', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.auction.findUnique.mockResolvedValue(
      createAuctionRecord({
        startsAt: new Date('2026-07-13T13:00:00.000Z'),
        status: 'draft',
      }),
    );
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'draft',
    });
    prisma.auction.update.mockResolvedValue(
      createAuctionRecord({
        status: 'scheduled',
      }),
    );
    prisma.lot.update.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'published',
    });

    const result = await service.publishAuction(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    );

    expect(prisma.lot.update).toHaveBeenCalledWith({
      where: {
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      },
      data: {
        status: 'published',
      },
    });
    expect(result.auction.status).toBe('scheduled');
    expect(realtimeEventsService.publishAuctionUpdated).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 100,
      bidCount: 0,
      status: 'scheduled',
      endsAt: '2026-07-14T13:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });
  });

  it('publishes a draft auction as active when it already started', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.auction.findUnique.mockResolvedValue(
      createAuctionRecord({
        startsAt: new Date('2026-07-13T11:00:00.000Z'),
        status: 'draft',
      }),
    );
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'draft',
    });
    prisma.auction.update.mockResolvedValue(
      createAuctionRecord({
        status: 'active',
      }),
    );
    prisma.lot.update.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'published',
    });

    const result = await service.publishAuction(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    );

    expect(result.auction.status).toBe('active');
    expect(realtimeEventsService.publishAuctionUpdated).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 100,
      bidCount: 0,
      status: 'active',
      endsAt: '2026-07-14T13:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });
  });

  it('rejects publishing an auction that is not draft', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.auction.findUnique.mockResolvedValue(
      createAuctionRecord({
        status: 'scheduled',
      }),
    );

    await expect(
      service.publishAuction(
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects publishing when the seller profile is missing', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.publishAuction(
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@bidplace/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Clock } from '../core/time';
import { calculateBidStep } from '../core/auction';
import {
  BidsService,
  type BidsRealtimePublisher,
  type BidsRepository,
} from './bids.service';

type AuctionRecord = {
  id: string;
  lotId: string;
  sellerProfileId: string;
  slug: string;
  startPrice: Decimal;
  reservePrice: Decimal;
  currentPrice: Decimal;
  currency: string;
  bidStep: Decimal;
  startsAt: Date;
  endsAt: Date;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  sellerProfile: {
    userId: string;
  };
  lot: {
    status: 'draft' | 'published' | 'sold' | 'hidden' | 'archived';
  };
};

type BidRecord = {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amount: Decimal;
  status: 'active' | 'winning' | 'outbid' | 'won' | 'lost' | 'cancelled' | 'invalid';
  createdAt: Date;
  updatedAt: Date;
};

function createAuctionRecord(overrides: Partial<AuctionRecord> = {}): AuctionRecord {
  const d = (value: number | string) => new Decimal(value);

  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
    sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
    slug: 'demo-auction',
    startPrice: d(100),
    reservePrice: d(150),
    currentPrice: d(100),
    currency: 'USD',
    bidStep: d(5),
    startsAt: new Date('2026-07-13T11:00:00.000Z'),
    endsAt: new Date('2026-07-14T13:00:00.000Z'),
    status: 'active',
    bidCount: 0,
    winnerBidId: null,
    buyNowPrice: null,
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
    updatedAt: new Date('2026-07-13T10:00:00.000Z'),
    sellerProfile: {
      userId: '9d5e8f46-5f7d-4c1a-9f7c-3d4c8d7a1111',
    },
    lot: {
      status: 'published',
    },
    ...overrides,
  };
}

function createBidRecord(overrides: Partial<BidRecord> = {}): BidRecord {
  const d = (value: number | string) => new Decimal(value);

  return {
    id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
    auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
    amount: d(120),
    status: 'winning',
    createdAt: new Date('2026-07-13T12:10:00.000Z'),
    updatedAt: new Date('2026-07-13T12:10:00.000Z'),
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
    expect(calculateBidStep(new Decimal(amount)).toString()).toBe(
      new Decimal(step).toString(),
    );
  });
});

describe('BidsService', () => {
  const prisma = {
    auction: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    bid: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  } satisfies BidsRepository;
  const realtimeEventsService = {
    publishBidPlaced: vi.fn(),
    publishAuctionUpdated: vi.fn(),
  } satisfies BidsRealtimePublisher;
  class TestClock extends Clock {
    now = vi.fn(() => new Date('2026-07-13T12:30:00.000Z'));
  }
  const clock = new TestClock();

  const service = new BidsService(
    prisma,
    realtimeEventsService,
    clock,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:30:00.000Z'));
    clock.now.mockReturnValue(new Date('2026-07-13T12:30:00.000Z'));
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: typeof prisma) => Promise<unknown>)(prisma),
    );
  });

  it('places a winning bid and updates the auction atomically', async () => {
    prisma.auction.findUnique.mockResolvedValueOnce(createAuctionRecord());
    prisma.auction.updateMany.mockResolvedValue({ count: 1 });
    prisma.bid.updateMany.mockResolvedValue({ count: 1 });
    prisma.bid.create.mockResolvedValue(createBidRecord());
    prisma.auction.findUnique.mockResolvedValueOnce(
      createAuctionRecord({
        currentPrice: new Decimal(120),
        bidStep: new Decimal(5),
        bidCount: 1,
        updatedAt: new Date('2026-07-13T12:10:00.000Z'),
      }),
    );

    const result = await service.placeBid(
      'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      { amount: 120 },
    );

    expect(prisma.auction.updateMany).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        status: 'active',
        currentPrice: new Decimal(100),
        endsAt: {
          gt: new Date('2026-07-13T12:30:00.000Z'),
        },
      },
      data: {
        currentPrice: new Decimal(120),
        bidCount: {
          increment: 1,
        },
        bidStep: new Decimal(5),
      },
    });
    expect(result.bid.status).toBe('winning');
    expect(result.auction.currentPrice).toBe(120);
    expect(result.auction.bidCount).toBe(1);
    expect(realtimeEventsService.publishBidPlaced).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      bid: {
        id: result.bid.id,
        auctionId: result.bid.auctionId,
        amount: result.bid.amount,
        status: result.bid.status,
        createdAt: result.bid.createdAt,
        updatedAt: result.bid.updatedAt,
      },
      currentPrice: 120,
      bidCount: 1,
    });
    expect(realtimeEventsService.publishAuctionUpdated).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 120,
      bidCount: 1,
      status: 'active',
      endsAt: '2026-07-14T13:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });
  });

  it('rejects self-bidding', async () => {
    prisma.auction.findUnique.mockResolvedValueOnce(createAuctionRecord());

    await expect(
      service.placeBid('9d5e8f46-5f7d-4c1a-9f7c-3d4c8d7a1111', '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', {
        amount: 120,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects bids below the minimum increment', async () => {
    prisma.auction.findUnique.mockResolvedValueOnce(createAuctionRecord());

    await expect(
      service.placeBid('e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e', '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', {
        amount: 100.4,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects bids on inactive auctions', async () => {
    prisma.auction.findUnique.mockResolvedValueOnce(
      createAuctionRecord({
        status: 'scheduled',
      }),
    );

    await expect(
      service.placeBid('e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e', '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', {
        amount: 120,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(realtimeEventsService.publishBidPlaced).not.toHaveBeenCalled();
  });

  it('rejects bids when the auction price changes during placement', async () => {
    prisma.auction.findUnique.mockResolvedValueOnce(createAuctionRecord());
    prisma.auction.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.placeBid(
        'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        {
          amount: 120,
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.bid.create).not.toHaveBeenCalled();
    expect(realtimeEventsService.publishBidPlaced).not.toHaveBeenCalled();
  });

  it('returns bid history in reverse chronological order for the seller', async () => {
    prisma.auction.findUnique.mockResolvedValueOnce(createAuctionRecord());
    prisma.bid.findMany.mockResolvedValue([
      createBidRecord({
        id: 'c1e3d3a3-4d91-4c9e-8d5f-8ebd8c10c001',
        amount: new Decimal(140),
        createdAt: new Date('2026-07-13T12:20:00.000Z'),
        updatedAt: new Date('2026-07-13T12:20:00.000Z'),
      }),
      createBidRecord({
        id: 'c1e3d3a3-4d91-4c9e-8d5f-8ebd8c10c002',
        amount: new Decimal(120),
        createdAt: new Date('2026-07-13T12:10:00.000Z'),
        updatedAt: new Date('2026-07-13T12:10:00.000Z'),
      }),
    ]);

    const result = await service.listAuctionBids(
      '9d5e8f46-5f7d-4c1a-9f7c-3d4c8d7a1111',
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      { page: 2, limit: 10 },
    );

    expect(prisma.bid.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
      skip: 10,
      take: 10,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }));
    expect(result.bids).toHaveLength(2);
    expect(result.bids[0].id).toBe('c1e3d3a3-4d91-4c9e-8d5f-8ebd8c10c001');
    expect(result.bids[1].id).toBe('c1e3d3a3-4d91-4c9e-8d5f-8ebd8c10c002');
  });

  it('rejects bid history for non-owner users', async () => {
    prisma.auction.findUnique.mockResolvedValueOnce(
      createAuctionRecord({
        sellerProfile: {
          userId: '4f89be1d-2f8d-4f7c-a1c2-0a94f2f1b222',
        },
      }),
    );

    await expect(
      service.listAuctionBids(
        '9d5e8f46-5f7d-4c1a-9f7c-3d4c8d7a1111',
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        { page: 1, limit: 20 },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

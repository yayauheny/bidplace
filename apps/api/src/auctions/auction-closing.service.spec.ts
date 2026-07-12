import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../core/database';
import { AuctionClosingService } from './auction-closing.service';

type AuctionRecord = {
  id: string;
  reservePrice: number;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  endsAt: Date;
};

type BidRecord = {
  id: string;
  amount: number;
};

function createAuctionRecord(
  overrides: Partial<AuctionRecord> = {},
): AuctionRecord {
  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    reservePrice: 150,
    status: 'active',
    endsAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

function createBidRecord(overrides: Partial<BidRecord> = {}): BidRecord {
  return {
    id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
    amount: 160,
    ...overrides,
  };
}

describe('AuctionClosingService', () => {
  const prisma = {
    auction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    bid: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const service = new AuctionClosingService(prisma as unknown as PrismaService);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:30:00.000Z'));
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: typeof prisma) => Promise<unknown>)(prisma),
    );
  });

  it('closes active auctions with reserve met as sold and marks bids accordingly', async () => {
    prisma.auction.findMany.mockResolvedValue([
      {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
    ]);
    prisma.auction.findUnique.mockResolvedValue(
      createAuctionRecord({
        endsAt: new Date('2026-07-13T12:00:00.000Z'),
      }),
    );
    prisma.bid.findFirst.mockResolvedValue(
      createBidRecord({
        id: 'a1111111-1111-4111-8111-111111111111',
        amount: 160,
      }),
    );
    prisma.auction.updateMany.mockResolvedValue({ count: 1 });
    prisma.bid.updateMany.mockResolvedValue({ count: 1 });
    prisma.bid.update.mockResolvedValue({});

    const result = await service.closeExpiredAuctions();

    expect(prisma.auction.updateMany).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        status: 'active',
        endsAt: {
          lte: new Date('2026-07-13T12:30:00.000Z'),
        },
      },
      data: {
        status: 'sold',
        winnerBidId: 'a1111111-1111-4111-8111-111111111111',
      },
    });
    expect(prisma.bid.update).toHaveBeenCalledWith({
      where: {
        id: 'a1111111-1111-4111-8111-111111111111',
      },
      data: {
        status: 'won',
      },
    });
    expect(result).toEqual([
      {
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        status: 'sold',
        winnerBidId: 'a1111111-1111-4111-8111-111111111111',
        reserveReached: true,
      },
    ]);
  });

  it('closes active auctions without reserve as failed and loses bids', async () => {
    prisma.auction.findMany.mockResolvedValue([
      {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
    ]);
    prisma.auction.findUnique.mockResolvedValue(createAuctionRecord());
    prisma.bid.findFirst.mockResolvedValue(
      createBidRecord({
        amount: 120,
      }),
    );
    prisma.auction.updateMany.mockResolvedValue({ count: 1 });
    prisma.bid.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.closeExpiredAuctions();

    expect(prisma.auction.updateMany).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        status: 'active',
        endsAt: {
          lte: new Date('2026-07-13T12:30:00.000Z'),
        },
      },
      data: {
        status: 'failed',
        winnerBidId: null,
      },
    });
    expect(prisma.bid.updateMany).toHaveBeenCalledWith({
      where: {
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
      data: {
        status: 'lost',
      },
    });
    expect(result).toEqual([
      {
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        status: 'failed',
        winnerBidId: null,
        reserveReached: false,
      },
    ]);
  });

  it('does not close auctions that are not active or not ended', async () => {
    prisma.auction.findMany.mockResolvedValue([]);

    const result = await service.closeExpiredAuctions();

    expect(result).toEqual([]);
    expect(prisma.auction.updateMany).not.toHaveBeenCalled();
  });
});

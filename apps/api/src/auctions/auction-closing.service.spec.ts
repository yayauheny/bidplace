import { Decimal } from '@bidplace/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { eligibleBidStatuses } from '../core/auction';
import { Clock } from '../core/time';
import {
  AuctionLifecycleService,
  type AuctionLifecyclePublisher,
  type AuctionLifecycleRepository,
} from './auction-closing.service';

type AuctionRecord = {
  id: string;
  reservePrice: Decimal;
  currentPrice: Decimal;
  bidCount: number;
  winnerBidId: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  endsAt: Date;
};

type BidRecord = {
  id: string;
  amount: Decimal;
  status: 'active' | 'winning' | 'outbid' | 'won' | 'lost' | 'cancelled' | 'invalid';
  createdAt: Date;
  updatedAt: Date;
};

const d = (value: number | string) => new Decimal(value);

function createAuctionRecord(
  overrides: Partial<AuctionRecord> = {},
): AuctionRecord {
  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    reservePrice: d(150),
    currentPrice: d(100),
    bidCount: 1,
    winnerBidId: null,
    status: 'active',
    endsAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

function createBidRecord(overrides: Partial<BidRecord> = {}): BidRecord {
  return {
    id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
    amount: d(160),
    status: 'winning',
    createdAt: new Date('2026-07-13T12:10:00.000Z'),
    updatedAt: new Date('2026-07-13T12:10:00.000Z'),
    ...overrides,
  };
}

describe('AuctionLifecycleService', () => {
  const prisma = {
    auction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    bid: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  } satisfies AuctionLifecycleRepository;
  const realtimeEventsService = {
    publishAuctionUpdated: vi.fn(),
    publishAuctionEnded: vi.fn(),
  } satisfies AuctionLifecyclePublisher;

  class TestClock extends Clock {
    now = vi.fn(() => new Date('2026-07-13T12:30:00.000Z'));
  }

  const clock = new TestClock();

  const service = new AuctionLifecycleService(
    prisma,
    realtimeEventsService,
    clock,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.auction.findMany.mockReset();
    prisma.auction.findUnique.mockReset();
    prisma.auction.updateMany.mockReset();
    prisma.bid.findMany.mockReset();
    prisma.bid.updateMany.mockReset();
    prisma.bid.update.mockReset();
    clock.now.mockReturnValue(new Date('2026-07-13T12:30:00.000Z'));
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: typeof prisma) => Promise<unknown>)(prisma),
    );
  });

  it('activates scheduled auctions that have reached their start time', async () => {
    prisma.auction.findMany.mockResolvedValue([
      {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
    ]);
    prisma.auction.findUnique.mockResolvedValue(
      createAuctionRecord({
        status: 'scheduled',
        startsAt: new Date('2026-07-13T12:00:00.000Z'),
        endsAt: new Date('2026-07-13T13:00:00.000Z'),
      }),
    );
    prisma.auction.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.activateScheduledAuctions();

    expect(prisma.auction.updateMany).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        status: 'scheduled',
        startsAt: {
          lte: new Date('2026-07-13T12:30:00.000Z'),
        },
        endsAt: {
          gt: new Date('2026-07-13T12:30:00.000Z'),
        },
      },
      data: {
        status: 'active',
      },
    });
    expect(realtimeEventsService.publishAuctionUpdated).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 100,
      bidCount: 1,
      status: 'active',
      endsAt: '2026-07-13T13:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });
    expect(result).toEqual([
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    ]);
  });

  it('closes active auctions with reserve met as sold and marks bids accordingly', async () => {
    prisma.auction.findMany.mockResolvedValue([
      {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
    ]);
    prisma.auction.findUnique.mockImplementation(async () =>
      createAuctionRecord({
        currentPrice: d(160),
        endsAt: new Date('2026-07-13T12:00:00.000Z'),
      }),
    );
    prisma.bid.findMany.mockImplementation(async () => [
      createBidRecord({
        id: 'a1111111-1111-4111-8111-111111111111',
        amount: d(160),
      }),
    ]);
    prisma.auction.updateMany.mockResolvedValue({ count: 1 });
    prisma.bid.updateMany.mockResolvedValue({ count: 1 });
    prisma.bid.update.mockResolvedValue({});

    const result = await service.closeExpiredAuctions();

    expect(prisma.auction.updateMany).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        status: {
          in: ['scheduled', 'active'],
        },
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
    expect(realtimeEventsService.publishAuctionUpdated).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 160,
      bidCount: 1,
      status: 'sold',
      endsAt: '2026-07-13T12:00:00.000Z',
      winnerBidId: 'a1111111-1111-4111-8111-111111111111',
      reserveReached: true,
    });
    expect(realtimeEventsService.publishAuctionEnded).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      status: 'sold',
      winnerBidId: 'a1111111-1111-4111-8111-111111111111',
      reserveReached: true,
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
    prisma.bid.findMany.mockResolvedValue([
      createBidRecord({
        amount: d(120),
      }),
    ]);
    prisma.auction.updateMany.mockResolvedValue({ count: 1 });
    prisma.bid.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.closeExpiredAuctions();

    expect(prisma.auction.updateMany).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        status: {
          in: ['scheduled', 'active'],
        },
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
        status: {
          in: eligibleBidStatuses,
        },
      },
      data: {
        status: 'lost',
      },
    });
    expect(realtimeEventsService.publishAuctionUpdated).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 100,
      bidCount: 1,
      status: 'failed',
      endsAt: '2026-07-13T12:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });
    expect(realtimeEventsService.publishAuctionEnded).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      status: 'failed',
      winnerBidId: null,
      reserveReached: false,
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

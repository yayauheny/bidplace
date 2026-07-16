import { randomUUID } from 'node:crypto';

import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { Decimal, PrismaClient } from '@bidplace/database';

import { AuctionLifecycleService } from '../../src/auctions/auction-closing.service';
import { BidsService } from '../../src/bids/bids.service';
import { calculateBidStep } from '../../src/core/auction';
import { runSerializableTransaction } from '../../src/core/database';
import { Clock } from '../../src/core/time';
import { type AuctionsRealtimePublisher } from '../../src/auctions/auctions.service';
import { type AuctionLifecyclePublisher } from '../../src/auctions/auction-closing.service';
import { type BidsRealtimePublisher } from '../../src/bids/bids.service';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const now = new Date('2026-07-13T12:30:00.000Z');

class FixedClock extends Clock {
  now(): Date {
    return now;
  }
}

const clock = new FixedClock();
const realtimeEventsService = {
  publishBidPlaced: vi.fn(),
  publishAuctionUpdated: vi.fn(),
  publishAuctionEnded: vi.fn(),
} satisfies BidsRealtimePublisher &
  AuctionsRealtimePublisher &
  AuctionLifecyclePublisher;

let prisma: PrismaClient;
let auctionLifecycleService: AuctionLifecycleService;
let bidsService: BidsService;
let integrationDatabaseContext: IntegrationDatabaseContext;

const d = (value: number | string) => new Decimal(value);

async function resetDatabase() {
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(displayName: string) {
  const suffix = randomUUID();

  return prisma.user.create({
    data: {
      email: `${displayName}.${suffix}@bidplace.test`,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$demo$hash',
      phone: `+1555${suffix.slice(0, 8)}`,
      displayName,
      role: 'user',
    },
  });
}

async function createSellerFixture() {
  const seller = await createUser('Seller');
  const buyerOne = await createUser('Buyer One');
  const buyerTwo = await createUser('Buyer Two');

  const category = await prisma.category.create({
    data: {
      slug: `art-object-${randomUUID()}`,
      name: 'Art Object',
      description: 'Integration test category',
    },
  });

  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: `seller-${randomUUID()}`,
      sellerType: 'creator',
      storeName: 'Test Store',
      country: 'BY',
      contactPreference: 'telegram',
      status: 'active',
    },
  });

  return {
    seller,
    buyerOne,
    buyerTwo,
    category,
    sellerProfile,
  };
}

async function createAuctionWithLot(options: {
  sellerProfileId: string;
  categoryId: string;
  status?: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  currentPrice: Decimal;
  reservePrice: Decimal;
  startsAt: Date;
  endsAt: Date;
  bidCount?: number;
  winnerBidId?: string | null;
}) {
  const lot = await prisma.lot.create({
    data: {
      sellerProfileId: options.sellerProfileId,
      categoryId: options.categoryId,
      title: `Lot ${randomUUID()}`,
      description: 'Integration test lot',
      condition: 'excellent',
      status: 'published',
    },
  });

  return prisma.auction.create({
    data: {
      lotId: lot.id,
      sellerProfileId: options.sellerProfileId,
      slug: `auction-${randomUUID()}`,
      startPrice: d(100),
      reservePrice: options.reservePrice,
      currentPrice: options.currentPrice,
      currency: 'USD',
      bidStep: calculateBidStep(options.currentPrice),
      startsAt: options.startsAt,
      endsAt: options.endsAt,
      status: options.status ?? 'active',
      bidCount: options.bidCount ?? 0,
      winnerBidId: options.winnerBidId ?? null,
    },
  });
}

async function getAuctionState(auctionId: string) {
  return prisma.auction.findUnique({
    where: {
      id: auctionId,
    },
    include: {
      bids: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      },
    },
  });
}

beforeAll(async () => {
  integrationDatabaseContext = await createIntegrationDatabaseContext();
  prisma = integrationDatabaseContext.prisma;
  auctionLifecycleService = new AuctionLifecycleService(
    prisma,
    realtimeEventsService,
    clock,
  );
  bidsService = new BidsService(prisma, realtimeEventsService, clock);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await resetDatabase();
});

afterAll(async () => {
  await integrationDatabaseContext.cleanup();
});

describe('auction lifecycle integration', () => {
  it('rejects bids before the auction start without changing database state', async () => {
    const { sellerProfile, buyerOne, category } = await createSellerFixture();
    const auction = await createAuctionWithLot({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      currentPrice: d(100),
      reservePrice: d(150),
      startsAt: new Date('2026-07-13T12:45:00.000Z'),
      endsAt: new Date('2026-07-13T13:45:00.000Z'),
      status: 'active',
    });

    await expect(
      bidsService.placeBid(buyerOne.id, auction.id, { amount: 120 }),
    ).rejects.toThrow('Auction is not active');

    const unchangedAuction = await getAuctionState(auction.id);

    expect(unchangedAuction?.currentPrice.toNumber()).toBe(100);
    expect(unchangedAuction?.bidCount).toBe(0);
    expect(unchangedAuction?.bids).toHaveLength(0);
  });

  it('rejects seller self-bids without changing database state', async () => {
    const { seller, sellerProfile, category } = await createSellerFixture();
    const auction = await createAuctionWithLot({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      currentPrice: d(100),
      reservePrice: d(150),
      startsAt: new Date('2026-07-13T12:00:00.000Z'),
      endsAt: new Date('2026-07-13T13:00:00.000Z'),
      status: 'active',
    });

    await expect(
      bidsService.placeBid(seller.id, auction.id, { amount: 120 }),
    ).rejects.toThrow('Cannot bid on your own auction');

    const unchangedAuction = await getAuctionState(auction.id);

    expect(unchangedAuction?.currentPrice.toNumber()).toBe(100);
    expect(unchangedAuction?.bidCount).toBe(0);
    expect(unchangedAuction?.bids).toHaveLength(0);
  });

  it('rejects bids below the minimum step without changing database state', async () => {
    const { sellerProfile, buyerOne, category } = await createSellerFixture();
    const auction = await createAuctionWithLot({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      currentPrice: d(100),
      reservePrice: d(150),
      startsAt: new Date('2026-07-13T12:00:00.000Z'),
      endsAt: new Date('2026-07-13T13:00:00.000Z'),
      status: 'active',
    });

    await expect(
      bidsService.placeBid(buyerOne.id, auction.id, { amount: 104 }),
    ).rejects.toThrow('Bid must be at least 105.00');

    const unchangedAuction = await getAuctionState(auction.id);

    expect(unchangedAuction?.currentPrice.toNumber()).toBe(100);
    expect(unchangedAuction?.bidCount).toBe(0);
    expect(unchangedAuction?.bids).toHaveLength(0);
  });

  it('keeps the highest bid after two concurrent placements', async () => {
    const { sellerProfile, buyerOne, buyerTwo, category } = await createSellerFixture();
    const auction = await createAuctionWithLot({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      currentPrice: d(100),
      reservePrice: d(150),
      startsAt: new Date('2026-07-13T12:00:00.000Z'),
      endsAt: new Date('2026-07-13T13:00:00.000Z'),
      status: 'active',
    });

    const firstBid = bidsService.placeBid(buyerOne.id, auction.id, { amount: 120 });
    const secondBid = bidsService.placeBid(buyerTwo.id, auction.id, { amount: 130 });

    const results = await Promise.allSettled([firstBid, secondBid]);
    const fulfilledResults = results.filter(
      (result): result is PromiseFulfilledResult<Awaited<typeof firstBid>> =>
        result.status === 'fulfilled',
    );

    expect(fulfilledResults.length).toBeGreaterThan(0);

    const updatedAuction = await getAuctionState(auction.id);

    expect(updatedAuction).not.toBeNull();
    const highestSuccessfulBid = Math.max(
      ...fulfilledResults.map((result) => result.value.bid.amount),
    );

    expect(updatedAuction?.currentPrice.toNumber()).toBe(highestSuccessfulBid);
    expect(updatedAuction?.bidCount).toBe(fulfilledResults.length);
    expect(updatedAuction?.bids).toHaveLength(fulfilledResults.length);
    expect(updatedAuction?.bids.some((bid) => bid.status === 'winning')).toBe(true);
    expect(updatedAuction?.bids.at(-1)?.amount.toNumber()).toBe(highestSuccessfulBid);
  });

  it('closes a due auction and rejects a bid raced against the close', async () => {
    const { sellerProfile, buyerOne, category } = await createSellerFixture();
    const auction = await createAuctionWithLot({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      currentPrice: d(260),
      reservePrice: d(240),
      startsAt: new Date('2026-07-13T11:00:00.000Z'),
      endsAt: now,
      status: 'active',
      bidCount: 1,
    });

    const winningBid = await prisma.bid.create({
      data: {
        auctionId: auction.id,
        bidderUserId: buyerOne.id,
        amount: d(260),
        status: 'winning',
      },
    });

    const closePromise = auctionLifecycleService.closeAuctionById(auction.id, now);
    const bidPromise = bidsService.placeBid(buyerOne.id, auction.id, { amount: 270 });

    const [closeResult, bidResult] = await Promise.allSettled([closePromise, bidPromise]);

    expect(closeResult.status).toBe('fulfilled');
    expect(bidResult.status).toBe('rejected');

    const closedAuction = await getAuctionState(auction.id);

    expect(closedAuction?.status).toBe('sold');
    expect(closedAuction?.winnerBidId).toBe(winningBid.id);
    expect(closedAuction?.currentPrice.toNumber()).toBe(260);
    expect(closedAuction?.bidCount).toBe(1);
    expect(closedAuction?.bids).toHaveLength(1);
    expect(closedAuction?.bids.find((bid) => bid.id === winningBid.id)?.status).toBe('won');
  });

  it('returns null on a concurrent duplicate close', async () => {
    const { sellerProfile, buyerOne, category } = await createSellerFixture();
    const auction = await createAuctionWithLot({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      currentPrice: d(260),
      reservePrice: d(240),
      startsAt: new Date('2026-07-13T11:00:00.000Z'),
      endsAt: now,
      status: 'active',
      bidCount: 1,
    });

    await prisma.bid.create({
      data: {
        auctionId: auction.id,
        bidderUserId: buyerOne.id,
        amount: d(260),
        status: 'winning',
      },
    });

    const firstClose = auctionLifecycleService.closeAuctionById(auction.id, now);
    const secondClose = auctionLifecycleService.closeAuctionById(auction.id, now);

    const results = await Promise.all([firstClose, secondClose]);
    const closedAuction = await getAuctionState(auction.id);

    expect(results.filter((result) => result !== null)).toHaveLength(1);
    expect(results.filter((result) => result === null)).toHaveLength(1);
    expect(closedAuction?.status).toBe('sold');
    expect(closedAuction?.bidCount).toBe(1);
  });

  it('marks reserve-met auctions as sold with a winner', async () => {
    const { sellerProfile, buyerOne, category } = await createSellerFixture();
    const auction = await createAuctionWithLot({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      currentPrice: d(180),
      reservePrice: d(150),
      startsAt: new Date('2026-07-13T11:00:00.000Z'),
      endsAt: now,
      status: 'active',
      bidCount: 1,
    });
    const winningBid = await prisma.bid.create({
      data: {
        auctionId: auction.id,
        bidderUserId: buyerOne.id,
        amount: d(180),
        status: 'winning',
      },
    });

    const result = await auctionLifecycleService.closeAuctionById(auction.id, now);
    const closedAuction = await getAuctionState(auction.id);

    expect(result?.status).toBe('sold');
    expect(result?.winnerBidId).toBe(winningBid.id);
    expect(closedAuction?.status).toBe('sold');
    expect(closedAuction?.winnerBidId).toBe(winningBid.id);
    expect(closedAuction?.currentPrice.toNumber()).toBe(180);
    expect(closedAuction?.bids.find((bid) => bid.id === winningBid.id)?.status).toBe('won');
  });

  it('marks reserve-unmet auctions as failed without a winner', async () => {
    const { sellerProfile, buyerOne, category } = await createSellerFixture();
    const auction = await createAuctionWithLot({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      currentPrice: d(140),
      reservePrice: d(150),
      startsAt: new Date('2026-07-13T11:00:00.000Z'),
      endsAt: now,
      status: 'active',
      bidCount: 1,
    });
    const lastBid = await prisma.bid.create({
      data: {
        auctionId: auction.id,
        bidderUserId: buyerOne.id,
        amount: d(140),
        status: 'winning',
      },
    });

    const result = await auctionLifecycleService.closeAuctionById(auction.id, now);
    const closedAuction = await getAuctionState(auction.id);

    expect(result?.status).toBe('failed');
    expect(result?.winnerBidId).toBeNull();
    expect(closedAuction?.status).toBe('failed');
    expect(closedAuction?.winnerBidId).toBeNull();
    expect(closedAuction?.currentPrice.toNumber()).toBe(140);
    expect(closedAuction?.bids.find((bid) => bid.id === lastBid.id)?.status).toBe('lost');
  });

  it('rolls back when a serializable transaction throws', async () => {
    await expect(
      runSerializableTransaction(prisma, async (tx) => {
        await tx.category.create({
          data: {
            slug: `rollback-${randomUUID()}`,
            name: 'Rollback',
          },
        });

        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const categories = await prisma.category.findMany({
      where: {
        slug: {
          startsWith: 'rollback-',
        },
      },
    });

    expect(categories).toHaveLength(0);
  });
});

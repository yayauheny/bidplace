import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { Decimal } from '@bidplace/database';
import type { PrismaClient } from '@bidplace/database';

import { AuctionLifecycleService } from '../../src/auctions/auction-closing.service';
import { BidsService } from '../../src/bids/bids.service';
import { calculateBidStep } from '../../src/core/auction';
import { runSerializableTransaction } from '../../src/core/database';
import { Clock } from '../../src/core/time';
import { type AuctionsRealtimePublisher } from '../../src/auctions/auctions.service';
import { type AuctionLifecyclePublisher } from '../../src/auctions/auction-closing.service';
import { type BidsRealtimePublisher } from '../../src/bids/bids.service';

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

const d = (value: number | string) => new Decimal(value);

async function resetDatabase() {
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

function resolveGeneratedClientPath(): string {
  const pnpmStoreRoot = resolve(process.cwd(), '../../node_modules/.pnpm');
  const clientDir = readdirSync(pnpmStoreRoot).find(
    (entry) =>
      entry.startsWith('@prisma+client@6.19.3_prisma@6.19.3_typescript@6.0.3') &&
      entry.endsWith('__typescript@6.0.3'),
  );

  if (!clientDir) {
    throw new Error('Generated Prisma client was not found');
  }

  return resolve(
    pnpmStoreRoot,
    clientDir,
    'node_modules',
    '@prisma',
    'client',
    'index.js',
  );
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
      images: [],
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

beforeAll(async () => {
  const { PrismaClient } = await import(
    pathToFileURL(resolveGeneratedClientPath()).href
  );
  prisma = new PrismaClient();
  auctionLifecycleService = new AuctionLifecycleService(
    prisma,
    realtimeEventsService,
    clock,
  );
  bidsService = new BidsService(prisma, realtimeEventsService, clock);
  await prisma.$connect();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('auction lifecycle integration', () => {
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

    const updatedAuction = await prisma.auction.findUnique({
      where: { id: auction.id },
      include: { bids: true },
    });

    expect(updatedAuction).not.toBeNull();
    const highestSuccessfulBid = Math.max(
      ...fulfilledResults.map((result) => result.value.bid.amount),
    );

    expect(updatedAuction?.currentPrice.toNumber()).toBe(highestSuccessfulBid);
    expect(updatedAuction?.bidCount).toBe(fulfilledResults.length);
    expect(updatedAuction?.bids).toHaveLength(fulfilledResults.length);
    expect(updatedAuction?.bids.some((bid) => bid.status === 'winning')).toBe(true);
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

    const closedAuction = await prisma.auction.findUnique({
      where: { id: auction.id },
      include: { bids: true },
    });

    expect(closedAuction?.status).toBe('sold');
    expect(closedAuction?.winnerBidId).toBe(winningBid.id);
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

    expect(results.filter((result) => result !== null)).toHaveLength(1);
    expect(results.filter((result) => result === null)).toHaveLength(1);
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

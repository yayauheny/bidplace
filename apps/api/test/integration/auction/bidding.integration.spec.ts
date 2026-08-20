import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ApiErrorCode } from '@bidplace/contracts';
import type { PrismaClient } from '@bidplace/database';

import { BidsService } from '../../../src/bids/bids.service';
import { AppException } from '../../../src/core/errors';
import { Clock } from '../../../src/core/time';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from '../test-database';
import {
  assertListingBidInvariants,
  auctionNow,
  createAuctionFixture,
  resetAuctionFixture,
} from './fixtures';

class MutableClock extends Clock {
  private current = auctionNow;

  now(): Date {
    return this.current;
  }

  set(value: Date): void {
    this.current = value;
  }
}

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;

function createBidsService(clock: MutableClock, emit = vi.fn()): BidsService {
  return new BidsService(prisma as never, clock, { emit } as never);
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterEach(async () => resetAuctionFixture(prisma));
afterAll(async () => context?.cleanup());

describe('auction bidding business guarantees', () => {
  it('accepts the first Bid at startPrice', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 120 });
    const bids = createBidsService(clock);

    const result = await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'first-at-start',
      { amount: 120 },
    );

    expect(result.bid.amount).toBe(120);
    expect(result.listing.currentPrice).toBe(120);
    expect(result.listing.bidCount).toBe(1);
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });

  it('accepts a first Bid above startPrice', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 120 });
    const bids = createBidsService(clock);

    const result = await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'first-above-start',
      { amount: 150 },
    );

    expect(result.listing.currentPrice).toBe(150);
    expect(result.listing.bidCount).toBe(1);
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });

  it('rejects a first Bid below startPrice with BID_TOO_LOW details', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 120 });
    const bids = createBidsService(clock);

    try {
      await bids.place(
        fixture.buyerA.id,
        'user',
        fixture.listing.id,
        'below-start',
        { amount: 119.99 },
      );
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).apiCode).toBe(ApiErrorCode.BID_TOO_LOW);
      expect((error as AppException).getStatus()).toBe(400);
      expect((error as AppException).getResponse()).toMatchObject({
        details: { minimumBid: '120.00' },
      });
    }

    await assertListingBidInvariants(prisma, fixture.listing.id);
    expect(
      await prisma.bid.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
  });

  it('enforces minimum increment without a fixed amount grid', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 120 });
    const bids = createBidsService(clock);

    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'open-at-120',
      { amount: 120 },
    );

    // MVP_BYN_V1: current 120 → step 5 → minimum 125
    try {
      await bids.place(
        fixture.buyerB.id,
        'user',
        fixture.listing.id,
        'below-min',
        { amount: 124.99 },
      );
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).apiCode).toBe(ApiErrorCode.BID_TOO_LOW);
      expect((error as AppException).getResponse()).toMatchObject({
        details: { minimumBid: '125.00' },
      });
    }

    const atMinimum = await bids.place(
      fixture.buyerB.id,
      'user',
      fixture.listing.id,
      'at-min',
      { amount: 125 },
    );
    expect(atMinimum.listing.currentPrice).toBe(125);

    // After 125, step remains 5 → minimum 130; 132 is a valid non-grid amount.
    const offGrid = await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'off-grid-ok',
      { amount: 132 },
    );
    expect(offGrid.listing.currentPrice).toBe(132);
    expect(offGrid.listing.bidCount).toBe(3);
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });

  it('replays the same Idempotency-Key without a second Bid', async () => {
    const clock = new MutableClock();
    const emit = vi.fn();
    const fixture = await createAuctionFixture(prisma, { startPrice: 10 });
    const bids = createBidsService(clock, emit);

    const first = await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'same-key',
      { amount: 10 },
    );
    const replay = await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'same-key',
      { amount: 10 },
    );

    expect(replay.bid.id).toBe(first.bid.id);
    expect(replay.listing.bidCount).toBe(1);
    expect(emit).toHaveBeenCalledTimes(1);
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });

  it('rejects Idempotency-Key reuse with a different amount', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 10 });
    const bids = createBidsService(clock);

    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'conflict-key',
      { amount: 10 },
    );

    await expect(
      bids.place(
        fixture.buyerA.id,
        'user',
        fixture.listing.id,
        'conflict-key',
        { amount: 11 },
      ),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT,
    });
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });

  it('serializes concurrent 110 vs 120 into consistent Listing state', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 100 });
    const bids = createBidsService(clock);

    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'seed-100',
      { amount: 100 },
    );

    const results = await Promise.allSettled([
      bids.place(fixture.buyerA.id, 'user', fixture.listing.id, 'race-110', {
        amount: 110,
      }),
      bids.place(fixture.buyerB.id, 'user', fixture.listing.id, 'race-120', {
        amount: 120,
      }),
    ]);

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<unknown> =>
        result.status === 'fulfilled',
    );
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    for (const failure of rejected) {
      expect(failure.reason).toBeInstanceOf(AppException);
      expect(
        [ApiErrorCode.BID_TOO_LOW, ApiErrorCode.LISTING_CHANGED].includes(
          (failure.reason as AppException).apiCode,
        ),
      ).toBe(true);
    }

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    const bidRows = await prisma.bid.findMany({
      where: { listingId: fixture.listing.id },
      orderBy: { amount: 'asc' },
    });

    expect(listing.currentPrice.toNumber()).toBe(120);
    expect(bidRows.some((bid) => bid.amount.toNumber() === 120)).toBe(true);
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });

  it('accepts only one Bid when concurrent equal amounts race', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 100 });
    const bids = createBidsService(clock);

    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'seed-equal',
      { amount: 100 },
    );

    const results = await Promise.allSettled([
      bids.place(fixture.buyerA.id, 'user', fixture.listing.id, 'equal-a', {
        amount: 110,
      }),
      bids.place(fixture.buyerB.id, 'user', fixture.listing.id, 'equal-b', {
        amount: 110,
      }),
    ]);

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<unknown> =>
        result.status === 'fulfilled',
    );
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0]!.reason as AppException).apiCode).toBe(
      ApiErrorCode.BID_TOO_LOW,
    );

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(listing.currentPrice.toNumber()).toBe(110);
    expect(listing.bidCount).toBe(2);
    expect(
      await prisma.bid.count({
        where: { listingId: fixture.listing.id, amount: 110 },
      }),
    ).toBe(1);
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });

  it('serializes concurrent 110 vs 120 vs 130 into a consistent top price', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, {
      startPrice: 100,
      withBuyerC: true,
    });
    const bids = createBidsService(clock);

    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'seed-triple',
      { amount: 100 },
    );

    const results = await Promise.allSettled([
      bids.place(fixture.buyerA.id, 'user', fixture.listing.id, 't-110', {
        amount: 110,
      }),
      bids.place(fixture.buyerB.id, 'user', fixture.listing.id, 't-120', {
        amount: 120,
      }),
      bids.place(fixture.buyerC!.id, 'user', fixture.listing.id, 't-130', {
        amount: 130,
      }),
    ]);

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<unknown> =>
        result.status === 'fulfilled',
    );
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(listing.currentPrice.toNumber()).toBe(130);
    expect(
      await prisma.bid.count({
        where: { listingId: fixture.listing.id, amount: 130 },
      }),
    ).toBe(1);
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });

  it('rejects SCHEDULED listings with LISTING_NOT_OPEN and no writes', async () => {
    const clock = new MutableClock();
    const emit = vi.fn();
    const fixture = await createAuctionFixture(prisma, {
      status: 'SCHEDULED',
      startsAt: new Date(auctionNow.getTime() + 3_600_000),
      originalEndsAt: new Date(auctionNow.getTime() + 7_200_000),
    });
    const bids = createBidsService(clock, emit);

    await expect(
      bids.place(
        fixture.buyerA.id,
        'user',
        fixture.listing.id,
        'scheduled-bid',
        { amount: 10 },
      ),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.LISTING_NOT_OPEN });

    expect(
      await prisma.bid.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(emit).not.toHaveBeenCalled();
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });
});

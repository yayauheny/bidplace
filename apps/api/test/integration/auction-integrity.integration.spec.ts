import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import { BidsService } from '../../src/bids/bids.service';
import { Clock } from '../../src/core/time';
import { resolveMinimumBidAmount } from '../../src/core/auction';
import { ListingLifecycleService } from '../../src/lifecycle/listing-lifecycle.service';
import {
  createAuctionIntegrityFixture,
  fixtureNow,
  resetAuctionIntegrityFixture,
} from './auction-integrity-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

class MutableClock extends Clock {
  private current = fixtureNow;

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

async function listingState(listingId: string) {
  const [listing, bids, audits] = await Promise.all([
    prisma.listing.findUnique({ where: { id: listingId } }),
    prisma.bid.findMany({
      where: { listingId },
      orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.auditEvent.count({
      where: { targetType: 'LISTING', targetId: listingId },
    }),
  ]);
  return { listing, bids, audits };
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterEach(async () => resetAuctionIntegrityFixture(prisma));
afterAll(async () => context?.cleanup());

describe('auction integrity against PostgreSQL', () => {
  it('denies an ordinary buyer Bid on a SCHEDULED Listing without changing state', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionIntegrityFixture(prisma, {
      status: 'SCHEDULED',
      startsAt: new Date(fixtureNow.getTime() + 3_600_000),
      originalEndsAt: new Date(fixtureNow.getTime() + 7_200_000),
    });
    const emit = vi.fn();
    const bids = createBidsService(clock, emit);
    const before = await listingState(fixture.listing.id);

    await expect(
      bids.place(
        fixture.buyerA.id,
        'user',
        fixture.listing.id,
        'scheduled-bid',
        { amount: 10 },
      ),
    ).rejects.toThrow('Listing is not open for bids');

    const after = await listingState(fixture.listing.id);
    expect(after.listing).toMatchObject({
      status: 'SCHEDULED',
      currentPrice: before.listing?.currentPrice,
      bidCount: 0,
      endsAt: before.listing?.endsAt,
    });
    expect(after.listing?.updatedAt).toEqual(before.listing?.updatedAt);
    expect(after.bids).toHaveLength(0);
    expect(after.audits).toBe(0);
    expect(emit).not.toHaveBeenCalled();
  });

  it('rejects a genuine stale minimum, then accepts the refetched retry and preserves idempotency', async () => {
    const clock = new MutableClock();
    const emit = vi.fn();
    const fixture = await createAuctionIntegrityFixture(prisma, {
      originalEndsAt: new Date(fixtureNow.getTime() + 300_000),
    });
    const bids = createBidsService(clock, emit);
    const snapshotForBothBuyers = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(snapshotForBothBuyers.currentPrice.toNumber()).toBe(10);
    expect(
      resolveMinimumBidAmount({
        currentPrice: snapshotForBothBuyers.currentPrice,
        startPrice: 10,
        bidCount: snapshotForBothBuyers.bidCount,
      }).toNumber(),
    ).toBe(10);

    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'buyer-a-bid',
      { amount: 11 },
    );
    const afterBuyerA = await listingState(fixture.listing.id);
    const beforeStaleRetry = {
      currentPrice: afterBuyerA.listing?.currentPrice,
      bidCount: afterBuyerA.listing?.bidCount,
      endsAt: afterBuyerA.listing?.endsAt,
      bidCountRows: afterBuyerA.bids.length,
    };

    await expect(
      bids.place(
        fixture.buyerB.id,
        'user',
        fixture.listing.id,
        'buyer-b-retry',
        { amount: 11 },
      ),
    ).rejects.toThrow('Bid must be at least 11.50');

    const afterStale = await listingState(fixture.listing.id);
    expect(afterStale.listing?.currentPrice).toEqual(
      beforeStaleRetry.currentPrice,
    );
    expect(afterStale.listing?.bidCount).toBe(beforeStaleRetry.bidCount);
    expect(afterStale.listing?.endsAt).toEqual(beforeStaleRetry.endsAt);
    expect(afterStale.bids).toHaveLength(beforeStaleRetry.bidCountRows);
    expect(afterStale.audits).toBe(0);

    const retry = await bids.place(
      fixture.buyerB.id,
      'user',
      fixture.listing.id,
      'buyer-b-retry',
      { amount: 11.5 },
    );
    const replay = await bids.place(
      fixture.buyerB.id,
      'user',
      fixture.listing.id,
      'buyer-b-retry',
      { amount: 11.5 },
    );
    expect(replay.bid.id).toBe(retry.bid.id);

    const afterRetry = await listingState(fixture.listing.id);
    expect(afterRetry.listing?.currentPrice.toNumber()).toBe(11.5);
    expect(afterRetry.listing?.bidCount).toBe(2);
    expect(afterRetry.bids).toHaveLength(2);
    expect(afterRetry.bids[0]?.bidderUserId).toBe(fixture.buyerB.id);
    expect(afterRetry.bids[0]?.amount.toNumber()).toBe(11.5);
    expect(emit).toHaveBeenCalledTimes(2);

    const lifecycle = new ListingLifecycleService(
      prisma as never,
      clock,
      { generate: () => 'auctionWinner01' } as never,
      { emit: vi.fn() } as never,
    );
    clock.set(new Date(fixture.listing.endsAt.getTime() + 1));
    expect(await lifecycle.close(fixture.listing.id)).toBe(true);
    const order = await prisma.order.findUnique({
      where: { sourceBidId: retry.bid.id },
    });
    expect(order?.buyerId).toBe(fixture.buyerB.id);
  });

  it('keeps endsAt outside the window and persists the inclusive boundary extension for the next Bid', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionIntegrityFixture(prisma, {
      originalEndsAt: new Date(fixtureNow.getTime() + 61_000),
    });
    const bids = createBidsService(clock);

    const outsideWindow = await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'outside-window',
      { amount: 10 },
    );
    expect(outsideWindow.listing.endsAt).toBe(
      fixture.listing.endsAt.toISOString(),
    );
    expect(
      (
        await prisma.listing.findUniqueOrThrow({
          where: { id: fixture.listing.id },
        })
      ).endsAt,
    ).toEqual(fixture.listing.endsAt);

    const boundaryFixture = await createAuctionIntegrityFixture(prisma, {
      originalEndsAt: new Date(fixtureNow.getTime() + 60_000),
    });
    clock.set(fixtureNow);
    const first = await bids.place(
      boundaryFixture.buyerA.id,
      'user',
      boundaryFixture.listing.id,
      'boundary-first',
      { amount: 10 },
    );
    const firstEndsAt = new Date(fixtureNow.getTime() + 120_000);
    expect(first.listing.endsAt).toBe(firstEndsAt.toISOString());
    expect(
      (
        await prisma.listing.findUniqueOrThrow({
          where: { id: boundaryFixture.listing.id },
        })
      ).endsAt,
    ).toEqual(firstEndsAt);

    clock.set(new Date(fixtureNow.getTime() + 61_000));
    const second = await bids.place(
      boundaryFixture.buyerB.id,
      'user',
      boundaryFixture.listing.id,
      'boundary-next',
      { amount: 10.5 },
    );
    const secondEndsAt = new Date(fixtureNow.getTime() + 180_000);
    expect(second.listing.endsAt).toBe(secondEndsAt.toISOString());
    const persisted = await listingState(boundaryFixture.listing.id);
    expect(persisted.listing?.endsAt).toEqual(secondEndsAt);
    expect(persisted.bids).toHaveLength(2);
  });

  it('caps repeated soft-close extensions at 600 seconds and rejects the post-close boundary unchanged', async () => {
    const clock = new MutableClock();
    const emit = vi.fn();
    const fixture = await createAuctionIntegrityFixture(prisma, {
      originalEndsAt: new Date(fixtureNow.getTime() + 60_000),
    });
    const bids = createBidsService(clock, emit);

    for (let index = 0; index <= 10; index += 1) {
      clock.set(new Date(fixtureNow.getTime() + index * 60_000));
      await bids.place(
        index % 2 === 0 ? fixture.buyerA.id : fixture.buyerB.id,
        'user',
        fixture.listing.id,
        `cap-${index}`,
        { amount: 10 + index * 0.5 },
      );
    }

    const capEndsAt = new Date(
      fixture.listing.originalEndsAt.getTime() + 600_000,
    );
    const capped = await listingState(fixture.listing.id);
    expect(capped.listing?.endsAt).toEqual(capEndsAt);
    expect(capped.listing?.bidCount).toBe(11);
    expect(capped.bids).toHaveLength(11);

    const beforeRejected = await listingState(fixture.listing.id);
    clock.set(capEndsAt);
    await expect(
      bids.place(fixture.buyerA.id, 'user', fixture.listing.id, 'after-cap', {
        amount: 20,
      }),
    ).rejects.toThrow('Listing is not open for bids');
    const afterRejected = await listingState(fixture.listing.id);
    expect(afterRejected.listing).toMatchObject({
      currentPrice: beforeRejected.listing?.currentPrice,
      bidCount: beforeRejected.listing?.bidCount,
      endsAt: beforeRejected.listing?.endsAt,
      updatedAt: beforeRejected.listing?.updatedAt,
    });
    expect(afterRejected.bids).toHaveLength(11);
    expect(afterRejected.audits).toBe(0);
    expect(emit).toHaveBeenCalledTimes(11);
  });

  it('closes only after the persisted extended deadline', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionIntegrityFixture(prisma, {
      originalEndsAt: new Date(fixtureNow.getTime() + 60_000),
    });
    const bids = createBidsService(clock);
    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'lifecycle-bid',
      { amount: 10 },
    );
    const persistedEndsAt = new Date(fixtureNow.getTime() + 120_000);
    const lifecycle = new ListingLifecycleService(
      prisma as never,
      clock,
      { generate: () => 'lifecycleOrder01' } as never,
      { emit: vi.fn() } as never,
    );

    clock.set(new Date(fixtureNow.getTime() + 61_000));
    expect(await lifecycle.close(fixture.listing.id)).toBe(false);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(
      (
        await prisma.listing.findUniqueOrThrow({
          where: { id: fixture.listing.id },
        })
      ).status,
    ).toBe('LIVE');

    clock.set(new Date(persistedEndsAt.getTime() + 1));
    expect(await lifecycle.close(fixture.listing.id)).toBe(true);
    const closed = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(closed.status).toBe('ENDED');
    expect(closed.endsAt).toEqual(persistedEndsAt);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(1);
  });
});

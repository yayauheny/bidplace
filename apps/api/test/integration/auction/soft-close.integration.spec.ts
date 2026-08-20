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

describe('auction soft-close business guarantees', () => {
  it('keeps endsAt unchanged outside the window and extends at the inclusive boundary', async () => {
    const clock = new MutableClock();
    const outside = await createAuctionFixture(prisma, {
      originalEndsAt: new Date(auctionNow.getTime() + 61_000),
    });
    const bids = createBidsService(clock);

    const outsideResult = await bids.place(
      outside.buyerA.id,
      'user',
      outside.listing.id,
      'outside-window',
      { amount: 10 },
    );
    expect(outsideResult.listing.endsAt).toBe(outside.listing.endsAt.toISOString());

    const boundary = await createAuctionFixture(prisma, {
      originalEndsAt: new Date(auctionNow.getTime() + 60_000),
    });
    clock.set(auctionNow);
    const first = await bids.place(
      boundary.buyerA.id,
      'user',
      boundary.listing.id,
      'boundary-first',
      { amount: 10 },
    );
    const firstEndsAt = new Date(auctionNow.getTime() + 120_000);
    expect(first.listing.endsAt).toBe(firstEndsAt.toISOString());

    clock.set(new Date(auctionNow.getTime() + 61_000));
    const second = await bids.place(
      boundary.buyerB.id,
      'user',
      boundary.listing.id,
      'boundary-next',
      { amount: 10.5 },
    );
    const secondEndsAt = new Date(auctionNow.getTime() + 180_000);
    expect(second.listing.endsAt).toBe(secondEndsAt.toISOString());
    await assertListingBidInvariants(prisma, boundary.listing.id);
  });

  it('caps repeated soft-close extensions at 600 seconds', async () => {
    const clock = new MutableClock();
    const emit = vi.fn();
    const fixture = await createAuctionFixture(prisma, {
      originalEndsAt: new Date(auctionNow.getTime() + 60_000),
    });
    const bids = createBidsService(clock, emit);

    for (let index = 0; index <= 10; index += 1) {
      clock.set(new Date(auctionNow.getTime() + index * 60_000));
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
    const capped = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(capped.endsAt).toEqual(capEndsAt);
    expect(capped.bidCount).toBe(11);

    clock.set(capEndsAt);
    await expect(
      bids.place(fixture.buyerA.id, 'user', fixture.listing.id, 'after-cap', {
        amount: 20,
      }),
    ).rejects.toMatchObject({ apiCode: ApiErrorCode.LISTING_NOT_OPEN });
    await assertListingBidInvariants(prisma, fixture.listing.id);
    expect(emit).toHaveBeenCalledTimes(11);
  });
});

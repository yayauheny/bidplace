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
import { Prisma } from '@bidplace/database';

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

let database: IntegrationDatabaseContext;
let prisma: PrismaClient;

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
});

afterEach(async () => resetAuctionIntegrityFixture(prisma));

afterAll(async () => database?.cleanup());

function lifecycle(realtime = vi.fn()): {
  service: ListingLifecycleService;
  emit: ReturnType<typeof vi.fn>;
} {
  return {
    service: new ListingLifecycleService(
      prisma as never,
      { now: () => fixtureNow } as never,
      { generate: () => 'wave3order01' } as never,
      { emit: realtime } as never,
    ),
    emit: realtime,
  };
}

describe('ListingLifecycleService close against PostgreSQL', () => {
  it('ends a no-bid LIVE Listing without a winner or Order and keeps repeat close idempotent', async () => {
    const fixture = await createAuctionIntegrityFixture(prisma);
    const emit = vi.fn();
    const { service } = lifecycle(emit);
    const closeAt = new Date(fixture.listing.endsAt.getTime() + 1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(true);
    const afterFirstClose = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(afterFirstClose.status).toBe('ENDED');
    expect(afterFirstClose.closedAt).toEqual(closeAt);
    expect(
      await prisma.bid.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(emit).toHaveBeenCalledTimes(1);

    const persistedBeforeRepeat = {
      status: afterFirstClose.status,
      closedAt: afterFirstClose.closedAt,
      currentPrice: afterFirstClose.currentPrice.toString(),
      bidCount: afterFirstClose.bidCount,
    };
    expect(await service.close(fixture.listing.id, closeAt)).toBe(false);
    const afterRepeat = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect({
      status: afterRepeat.status,
      closedAt: afterRepeat.closedAt,
      currentPrice: afterRepeat.currentPrice.toString(),
      bidCount: afterRepeat.bidCount,
    }).toEqual(persistedBeforeRepeat);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('chooses the canonical ID tie-break winner and keeps Listing, Order and event aligned on repeat close', async () => {
    const fixture = await createAuctionIntegrityFixture(prisma);
    const sameCreatedAt = new Date(fixtureNow.getTime() - 1_000);
    const bids = await Promise.all([
      prisma.bid.create({
        data: {
          listingId: fixture.listing.id,
          bidderUserId: fixture.buyerA.id,
          idempotencyKey: 'tie-a',
          amount: new Prisma.Decimal(20),
          createdAt: sameCreatedAt,
        },
      }),
      prisma.bid.create({
        data: {
          listingId: fixture.listing.id,
          bidderUserId: fixture.buyerB.id,
          idempotencyKey: 'tie-b',
          amount: new Prisma.Decimal(20),
          createdAt: sameCreatedAt,
        },
      }),
    ]);
    await prisma.listing.update({
      where: { id: fixture.listing.id },
      data: { currentPrice: new Prisma.Decimal(20), bidCount: 2 },
    });

    const expectedWinner = [...bids].sort((left, right) =>
      left.id.localeCompare(right.id),
    )[0]!;
    const emit = vi.fn();
    const { service } = lifecycle(emit);
    const closeAt = new Date(fixture.listing.endsAt.getTime() + 1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(true);
    const order = await prisma.order.findUnique({
      where: { sourceBidId: expectedWinner.id },
    });
    expect(order).not.toBeNull();
    expect(order?.buyerId).toBe(expectedWinner.bidderUserId);
    expect(order?.finalAmount.toNumber()).toBe(20);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(1);

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(
      fixture.listing.id,
      'listing.ended',
      expect.objectContaining({
        listingId: fixture.listing.id,
        currentPrice: 20,
        bidCount: 2,
        status: 'ENDED',
        endsAt: fixture.listing.endsAt.toISOString(),
      }),
    );

    const persistedBeforeRepeat = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(await service.close(fixture.listing.id, closeAt)).toBe(false);
    const persistedAfterRepeat = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(persistedAfterRepeat.status).toBe(persistedBeforeRepeat.status);
    expect(persistedAfterRepeat.closedAt).toEqual(
      persistedBeforeRepeat.closedAt,
    );
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(1);
    expect(emit).toHaveBeenCalledTimes(1);
  });
});

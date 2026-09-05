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
import { Prisma, type PrismaClient } from '@bidplace/database';

import { BidsService } from '../../../src/bids/bids.service';
import { AppException } from '../../../src/core/errors';
import { Clock } from '../../../src/core/time';
import {
  EXPIRED_SCHEDULED_AUDIT_REASON,
  ListingLifecycleService,
} from '../../../src/lifecycle/listing-lifecycle.service';
import { computeOrderContactDueAt } from '../../../src/orders/order-contact-deadline';
import { OrdersService } from '../../../src/orders/orders.service';
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

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterEach(async () => resetAuctionFixture(prisma));
afterAll(async () => context?.cleanup());

function lifecycle(
  clock: MutableClock,
  emit = vi.fn(),
  publicId = 'auctionOrder01',
) {
  return {
    service: new ListingLifecycleService(
      prisma as never,
      clock,
      { generate: () => publicId } as never,
      { emit } as never,
    ),
    emit,
  };
}

describe('auction lifecycle business guarantees', () => {
  it('ends a no-bid LIVE Listing without Order and stays idempotent', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma);
    const emit = vi.fn();
    const { service } = lifecycle(clock, emit);
    const closeAt = new Date(fixture.listing.endsAt.getTime() + 1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(true);
    const afterFirst = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(afterFirst.status).toBe('ENDED');
    expect(afterFirst.closedAt).toEqual(closeAt);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(emit).toHaveBeenCalledTimes(1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(false);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('closes with the deterministic winner Order', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 10 });
    const bids = new BidsService(
      prisma as never,
      clock,
      { emit: vi.fn() } as never,
    );
    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'lower',
      { amount: 10 },
    );
    const winner = await bids.place(
      fixture.buyerB.id,
      'user',
      fixture.listing.id,
      'winner',
      { amount: 11 },
    );
    const { service, emit } = lifecycle(clock);
    const closeAt = new Date(fixture.listing.endsAt.getTime() + 1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(true);
    const order = await prisma.order.findFirst({
      where: { listingId: fixture.listing.id },
    });
    expect(order?.sourceBidId).toBe(winner.bid.id);
    expect(order?.buyerId).toBe(fixture.buyerB.id);
    expect(order?.contactDueAt.getTime()).toBe(
      computeOrderContactDueAt(closeAt).getTime(),
    );
    expect(emit).toHaveBeenCalledTimes(1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(false);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(1);
  });

  it('retries a real publicId collision after ENDED and creates exactly one Order', async () => {
    const clock = new MutableClock();
    const takenPublicId = 'takenPubId1';
    const freePublicId = 'freshPubId1';

    const occupied = await createAuctionFixture(prisma, {
      startPrice: 10,
      originalEndsAt: auctionNow,
      endsAt: auctionNow,
    });
    await prisma.bid.create({
      data: {
        listingId: occupied.listing.id,
        bidderUserId: occupied.buyerA.id,
        idempotencyKey: 'taken-public-id-winner',
        amount: new Prisma.Decimal(10),
      },
    });
    await prisma.listing.update({
      where: { id: occupied.listing.id },
      data: { currentPrice: new Prisma.Decimal(10), bidCount: 1 },
    });
    const closeAt = new Date(auctionNow.getTime() + 1);
    expect(
      await lifecycle(clock, vi.fn(), takenPublicId).service.close(
        occupied.listing.id,
        closeAt,
      ),
    ).toBe(true);
    expect(
      (
        await prisma.order.findFirstOrThrow({
          where: { listingId: occupied.listing.id },
        })
      ).publicId,
    ).toBe(takenPublicId);

    const target = await createAuctionFixture(prisma, {
      startPrice: 20,
      originalEndsAt: auctionNow,
      endsAt: auctionNow,
    });
    const winner = await prisma.bid.create({
      data: {
        listingId: target.listing.id,
        bidderUserId: target.buyerA.id,
        idempotencyKey: 'retry-public-id-winner',
        amount: new Prisma.Decimal(20),
      },
    });
    await prisma.listing.update({
      where: { id: target.listing.id },
      data: { currentPrice: new Prisma.Decimal(20), bidCount: 1 },
    });

    let generateCalls = 0;
    const collidingPublicIds = {
      generate: () => {
        generateCalls += 1;
        return generateCalls === 1 ? takenPublicId : freePublicId;
      },
    };
    const emit = vi.fn();
    const service = new ListingLifecycleService(
      prisma as never,
      clock,
      collidingPublicIds as never,
      { emit } as never,
    );

    expect(await service.close(target.listing.id, closeAt)).toBe(true);

    const closed = await prisma.listing.findUniqueOrThrow({
      where: { id: target.listing.id },
    });
    expect(closed.status).toBe('ENDED');
    expect(closed.closedAt).toEqual(closeAt);
    expect(
      await prisma.order.count({ where: { listingId: target.listing.id } }),
    ).toBe(1);
    const created = await prisma.order.findFirstOrThrow({
      where: { listingId: target.listing.id },
    });
    expect(created.publicId).toBe(freePublicId);
    expect(created.sourceBidId).toBe(winner.id);
    expect(generateCalls).toBeGreaterThanOrEqual(2);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('keeps Listing ENDED when Order creation fails, then recovery creates one Order', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, { startPrice: 10 });
    const winner = await prisma.bid.create({
      data: {
        listingId: fixture.listing.id,
        bidderUserId: fixture.buyerA.id,
        idempotencyKey: 'injected-fail-winner',
        amount: new Prisma.Decimal(10),
      },
    });
    await prisma.listing.update({
      where: { id: fixture.listing.id },
      data: { currentPrice: new Prisma.Decimal(10), bidCount: 1 },
    });
    const emit = vi.fn();
    const failingPublicIds = {
      generate: () => {
        throw new Error('injected Order create failure');
      },
    };
    const service = new ListingLifecycleService(
      prisma as never,
      clock,
      failingPublicIds as never,
      { emit } as never,
    );
    const closeAt = new Date(fixture.listing.endsAt.getTime() + 1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(true);

    const closed = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(closed.status).toBe('ENDED');
    expect(closed.closedAt).toEqual(closeAt);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(emit).toHaveBeenCalledTimes(1);

    const orders = new OrdersService(prisma as never, {
      generate: () => 'recoveryOrd',
    } as never);
    const recovered = await orders.createOrderForEndedListing(
      fixture.seller.id,
      'admin',
      fixture.listing.id,
    );

    expect(recovered.order.listingId).toBe(fixture.listing.id);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(1);
    const persisted = await prisma.order.findFirstOrThrow({
      where: { listingId: fixture.listing.id },
    });
    expect(persisted.sourceBidId).toBe(winner.id);
    expect(persisted.buyerId).toBe(fixture.buyerA.id);
  });

  it('uses amount/createdAt/id tie-break for equal winning Bids', async () => {
    const fixture = await createAuctionFixture(prisma);
    const sameCreatedAt = new Date(auctionNow.getTime() - 1_000);
    const created = await Promise.all([
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
    const expectedWinner = [...created].sort((left, right) =>
      left.id.localeCompare(right.id),
    )[0]!;
    const clock = new MutableClock();
    const { service } = lifecycle(clock);
    const closeAt = new Date(fixture.listing.endsAt.getTime() + 1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(true);
    const order = await prisma.order.findUnique({
      where: { sourceBidId: expectedWinner.id },
    });
    expect(order?.buyerId).toBe(expectedWinner.bidderUserId);
  });

  it('ends the Listing without Order when seller handoff is missing', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, {
      startPrice: 10,
      omitHandoff: true,
    });
    await prisma.bid.create({
      data: {
        listingId: fixture.listing.id,
        bidderUserId: fixture.buyerA.id,
        idempotencyKey: 'no-handoff-winner',
        amount: new Prisma.Decimal(10),
      },
    });
    await prisma.listing.update({
      where: { id: fixture.listing.id },
      data: { currentPrice: new Prisma.Decimal(10), bidCount: 1 },
    });
    const { service, emit } = lifecycle(clock);
    const closeAt = new Date(fixture.listing.endsAt.getTime() + 1);

    expect(await service.close(fixture.listing.id, closeAt)).toBe(true);
    const closed = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(closed.status).toBe('ENDED');
    expect(closed.closedAt).toEqual(closeAt);
    expect(closed.endsAt.getTime()).toBeLessThan(closeAt.getTime());
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('does not activate SCHEDULED listings that lack seller handoff', async () => {
    const clock = new MutableClock();
    clock.set(auctionNow);
    const fixture = await createAuctionFixture(prisma, {
      status: 'SCHEDULED',
      startsAt: new Date(auctionNow.getTime() - 60_000),
      originalEndsAt: new Date(auctionNow.getTime() + 300_000),
      omitHandoff: true,
    });
    const { service } = lifecycle(clock);

    await service.run();

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(listing.status).toBe('SCHEDULED');
  });

  it('cancels SCHEDULED listings whose window already ended without an Order', async () => {
    const clock = new MutableClock();
    const endsAt = new Date(auctionNow.getTime() - 60_000);
    const fixture = await createAuctionFixture(prisma, {
      status: 'SCHEDULED',
      startsAt: new Date(auctionNow.getTime() - 120_000),
      originalEndsAt: endsAt,
      endsAt,
    });
    const { service, emit } = lifecycle(clock);

    await service.run();
    await service.run();

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    const audits = await prisma.auditEvent.findMany({
      where: { targetType: 'LISTING', targetId: fixture.listing.id },
    });
    expect(listing.status).toBe('CANCELLED');
    expect(listing.closedAt).toEqual(auctionNow);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: null,
      oldStatus: 'SCHEDULED',
      newStatus: 'CANCELLED',
      reason: EXPIRED_SCHEDULED_AUDIT_REASON,
    });
    expect(emit).toHaveBeenCalledWith(
      fixture.listing.id,
      'listing.updated',
      expect.objectContaining({ status: 'CANCELLED' }),
    );
  });

  it('cancels expired SCHEDULED listings even when seller handoff is missing', async () => {
    const clock = new MutableClock();
    const endsAt = new Date(auctionNow.getTime() - 60_000);
    const fixture = await createAuctionFixture(prisma, {
      status: 'SCHEDULED',
      startsAt: new Date(auctionNow.getTime() - 120_000),
      originalEndsAt: endsAt,
      endsAt,
      omitHandoff: true,
    });
    const { service } = lifecycle(clock);

    await service.run();

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    expect(listing.status).toBe('CANCELLED');
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);
  });

  it('rejects a Bid at the close boundary while close keeps the prior winner', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, {
      startPrice: 10,
      originalEndsAt: auctionNow,
      endsAt: auctionNow,
    });
    const winner = await prisma.bid.create({
      data: {
        listingId: fixture.listing.id,
        bidderUserId: fixture.buyerA.id,
        idempotencyKey: 'existing-winner',
        amount: new Prisma.Decimal(10),
      },
    });
    await prisma.listing.update({
      where: { id: fixture.listing.id },
      data: { currentPrice: new Prisma.Decimal(10), bidCount: 1 },
    });
    const bids = new BidsService(
      prisma as never,
      clock,
      { emit: vi.fn() } as never,
    );
    const { service } = lifecycle(clock);

    const [close, bid] = await Promise.allSettled([
      service.close(fixture.listing.id, auctionNow),
      bids.place(fixture.buyerB.id, 'user', fixture.listing.id, 'close-race', {
        amount: 11,
      }),
    ]);

    expect(close).toMatchObject({ status: 'fulfilled', value: true });
    expect(bid.status).toBe('rejected');
    expect((bid as PromiseRejectedResult).reason).toBeInstanceOf(AppException);
    expect(((bid as PromiseRejectedResult).reason as AppException).apiCode).toBe(
      ApiErrorCode.LISTING_NOT_OPEN,
    );

    const closed = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
    });
    const order = await prisma.order.findFirst({
      where: { listingId: fixture.listing.id },
    });
    expect(closed.status).toBe('ENDED');
    expect(order?.sourceBidId).toBe(winner.id);
    expect(
      await prisma.bid.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(1);
  });

  it('keeps Listing LIVE when a soft-close Bid extends endsAt past the close attempt', async () => {
    const clock = new MutableClock();
    const fixture = await createAuctionFixture(prisma, {
      startPrice: 10,
      originalEndsAt: new Date(auctionNow.getTime() + 60_000),
    });
    const bids = new BidsService(
      prisma as never,
      clock,
      { emit: vi.fn() } as never,
    );
    await bids.place(
      fixture.buyerA.id,
      'user',
      fixture.listing.id,
      'soft-close-bid',
      { amount: 10 },
    );
    const extendedEndsAt = new Date(auctionNow.getTime() + 120_000);
    const { service } = lifecycle(clock);

    clock.set(new Date(auctionNow.getTime() + 61_000));
    expect(await service.close(fixture.listing.id)).toBe(false);
    expect(
      (
        await prisma.listing.findUniqueOrThrow({
          where: { id: fixture.listing.id },
        })
      ).status,
    ).toBe('LIVE');
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);

    clock.set(new Date(extendedEndsAt.getTime() + 1));
    expect(await service.close(fixture.listing.id)).toBe(true);
    expect(
      (
        await prisma.listing.findUniqueOrThrow({
          where: { id: fixture.listing.id },
        })
      ).status,
    ).toBe('ENDED');
    await assertListingBidInvariants(prisma, fixture.listing.id);
  });
});

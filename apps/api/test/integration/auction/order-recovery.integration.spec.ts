import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Prisma, type PrismaClient } from '@bidplace/database';

import { Clock } from '../../../src/core/time';
import { ListingLifecycleService } from '../../../src/lifecycle/listing-lifecycle.service';
import { ORDER_CONTACT_WINDOW_MS } from '../../../src/orders/order-contact-deadline';
import { OrdersService } from '../../../src/orders/orders.service';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from '../test-database';
import {
  auctionNow,
  createAuctionFixture,
  resetAuctionFixture,
} from './fixtures';

class FixedClock extends Clock {
  constructor(private readonly current = auctionNow) {
    super();
  }

  now(): Date {
    return this.current;
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

function ordersService() {
  return new OrdersService(prisma as never, {
    generate: () => 'recoveryOrd',
  } as never);
}

function lifecycleService(clock: FixedClock, publicId = 'closeOrd001') {
  return new ListingLifecycleService(
    prisma as never,
    clock,
    { generate: () => publicId } as never,
    { emit: vi.fn() } as never,
  );
}

describe('admin Order recovery for ended Listings', () => {
  it('lists ENDED auctions with Bids and no Order as needing attention', async () => {
    const clock = new FixedClock(
      new Date(auctionNow.getTime() + 301_000),
    );
    const withBids = await createAuctionFixture(prisma, {
      startPrice: 10,
      omitHandoff: true,
      originalEndsAt: auctionNow,
      endsAt: auctionNow,
    });
    await prisma.bid.create({
      data: {
        listingId: withBids.listing.id,
        bidderUserId: withBids.buyerA.id,
        idempotencyKey: 'needs-order-bid',
        amount: new Prisma.Decimal(10),
      },
    });
    await prisma.listing.update({
      where: { id: withBids.listing.id },
      data: { currentPrice: new Prisma.Decimal(10), bidCount: 1 },
    });
    expect(
      await lifecycleService(clock).close(withBids.listing.id, clock.now()),
    ).toBe(true);

    const noBids = await createAuctionFixture(prisma, {
      startPrice: 20,
      originalEndsAt: auctionNow,
      endsAt: auctionNow,
    });
    expect(
      await lifecycleService(clock, 'closeOrd002').close(
        noBids.listing.id,
        clock.now(),
      ),
    ).toBe(true);

    const needing = await ordersService().listEndedWithoutOrder('admin');
    expect(needing.listings.map((item) => item.listingId)).toEqual([
      withBids.listing.id,
    ]);
    expect(needing.listings[0]).toMatchObject({
      bidCount: 1,
      handoffReady: false,
      productPublicId: expect.any(String),
    });
  });

  it('creates exactly one Order after handoff is fixed, and repeated retry is idempotent', async () => {
    const closeAt = new Date(auctionNow.getTime() + 1);
    const fixture = await createAuctionFixture(prisma, {
      startPrice: 10,
      omitHandoff: true,
      originalEndsAt: auctionNow,
      endsAt: auctionNow,
    });
    const winner = await prisma.bid.create({
      data: {
        listingId: fixture.listing.id,
        bidderUserId: fixture.buyerA.id,
        idempotencyKey: 'recovery-winner',
        amount: new Prisma.Decimal(10),
      },
    });
    await prisma.bid.create({
      data: {
        listingId: fixture.listing.id,
        bidderUserId: fixture.buyerB.id,
        idempotencyKey: 'recovery-lower',
        amount: new Prisma.Decimal(9),
      },
    });
    await prisma.listing.update({
      where: { id: fixture.listing.id },
      data: { currentPrice: new Prisma.Decimal(10), bidCount: 2 },
    });

    expect(
      await lifecycleService(new FixedClock(closeAt)).close(
        fixture.listing.id,
        closeAt,
      ),
    ).toBe(true);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(0);

    const orders = ordersService();
    await expect(
      orders.createOrderForEndedListing(
        fixture.seller.id,
        'admin',
        fixture.listing.id,
      ),
    ).rejects.toThrow('Seller handoff contact is missing');

    await prisma.sellerProfile.update({
      where: { id: fixture.sellerProfileId },
      data: {
        handoffContactType: 'TELEGRAM',
        handoffContactValue: '@recovered_seller',
      },
    });

    const first = await orders.createOrderForEndedListing(
      fixture.seller.id,
      'admin',
      fixture.listing.id,
    );
    const second = await orders.createOrderForEndedListing(
      fixture.seller.id,
      'admin',
      fixture.listing.id,
    );

    expect(first.order.publicId).toBe(second.order.publicId);
    expect(first.order.listingId).toBe(fixture.listing.id);
    expect(first.order.contactDueAt).toBe(second.order.contactDueAt);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(1);
    const persisted = await prisma.order.findFirstOrThrow({
      where: { listingId: fixture.listing.id },
    });
    expect(persisted.sourceBidId).toBe(winner.id);
    expect(persisted.buyerId).toBe(fixture.buyerA.id);
    expect(persisted.sellerHandoffValue).toBe('@recovered_seller');
    expect(persisted.contactDueAt.getTime()).toBeGreaterThan(Date.now());
    expect(persisted.contactDueAt.toISOString()).toBe(first.order.contactDueAt);
    expect(
      persisted.contactDueAt.getTime() - persisted.createdAt.getTime(),
    ).toBe(ORDER_CONTACT_WINDOW_MS);

    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        targetType: 'ORDER',
        targetId: persisted.id,
      },
    });
    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0]).toMatchObject({
      actorUserId: fixture.seller.id,
      oldStatus: null,
      newStatus: 'PENDING_CONTACT',
      reason: expect.stringContaining('Admin created Order for ended Listing'),
    });

    const needing = await orders.listEndedWithoutOrder('admin');
    expect(needing.listings).toHaveLength(0);
  });

  it('rejects recovery when the ended Listing has no Bids', async () => {
    const closeAt = new Date(auctionNow.getTime() + 1);
    const fixture = await createAuctionFixture(prisma, {
      originalEndsAt: auctionNow,
      endsAt: auctionNow,
    });
    expect(
      await lifecycleService(new FixedClock(closeAt)).close(
        fixture.listing.id,
        closeAt,
      ),
    ).toBe(true);

    await expect(
      ordersService().createOrderForEndedListing(
        fixture.seller.id,
        'admin',
        fixture.listing.id,
      ),
    ).rejects.toThrow('Order recovery is unavailable');
  });

  it('returns the existing Order when one is already present', async () => {
    const closeAt = new Date(auctionNow.getTime() + 1);
    const fixture = await createAuctionFixture(prisma, {
      startPrice: 10,
      originalEndsAt: auctionNow,
      endsAt: auctionNow,
    });
    const winner = await prisma.bid.create({
      data: {
        listingId: fixture.listing.id,
        bidderUserId: fixture.buyerA.id,
        idempotencyKey: 'existing-order-winner',
        amount: new Prisma.Decimal(10),
      },
    });
    await prisma.listing.update({
      where: { id: fixture.listing.id },
      data: { currentPrice: new Prisma.Decimal(10), bidCount: 1 },
    });
    expect(
      await lifecycleService(new FixedClock(closeAt)).close(
        fixture.listing.id,
        closeAt,
      ),
    ).toBe(true);

    const existing = await prisma.order.findFirstOrThrow({
      where: { listingId: fixture.listing.id },
    });
    expect(existing.sourceBidId).toBe(winner.id);

    const replay = await ordersService().createOrderForEndedListing(
      fixture.seller.id,
      'admin',
      fixture.listing.id,
    );

    expect(replay.order.publicId).toBe(existing.publicId);
    expect(
      await prisma.order.count({ where: { listingId: fixture.listing.id } }),
    ).toBe(1);
  });
});

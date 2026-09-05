import { Prisma, type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { OrdersService } from '../../src/orders/orders.service';
import {
  createOrderFixture,
  resetOrderFixture,
} from './order-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;

function createOrdersService(): OrdersService {
  return new OrdersService(prisma as never, { generate: () => 'unusedPubId' } as never);
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterEach(async () => resetOrderFixture(prisma));
afterAll(async () => context?.cleanup());

describe('seller Order inbox against PostgreSQL', () => {
  it('lists the seller Orders from frozen snapshot fields and hides cancelled rows', async () => {
    const fixture = await createOrderFixture(prisma);
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
      select: { productId: true, product: { select: { publicId: true } } },
    });
    await prisma.order.update({
      where: { id: fixture.order.id },
      data: {
        snapshotTitle: 'Frozen inbox title',
        snapshotCurrency: 'BYN',
        snapshotProductPublicId: listing.product.publicId,
      },
    });
    await prisma.product.update({
      where: { id: listing.productId },
      data: { title: 'Live title after close' },
    });
    const orders = createOrdersService();

    const page = await orders.listForSeller(fixture.seller.id, 'user', {
      page: 1,
      limit: 20,
    });
    expect(page.pagination).toEqual({ page: 1, limit: 20, total: 1 });
    expect(page.orders).toHaveLength(1);
    expect(page.orders[0]?.productSummary).toEqual({
      publicId: listing.product.publicId,
      title: 'Frozen inbox title',
    });
    expect(page.orders[0]?.order.currency).toBe('BYN');
    expect(page.orders[0]?.buyerEmailAtClose).toBe(fixture.winner.email);

    const outsider = await orders.listForSeller(fixture.outsider.id, 'user', {
      page: 1,
      limit: 20,
    });
    expect(outsider.orders).toHaveLength(0);
    expect(outsider.pagination.total).toBe(0);

    await expect(
      orders.listForSeller(fixture.admin.id, 'admin', { page: 1, limit: 20 }),
    ).rejects.toThrow('Seller access required');

    await orders.cancel(fixture.admin.id, 'admin', fixture.order.publicId, {
      reason: 'ADMIN_CANCELLED',
    });
    const afterCancel = await orders.listForSeller(fixture.seller.id, 'user', {
      page: 1,
      limit: 20,
    });
    expect(afterCancel.orders).toHaveLength(0);
    expect(afterCancel.pagination.total).toBe(0);
  });

  it('pages seller Orders with a bounded skip/take window', async () => {
    const fixture = await createOrderFixture(prisma);
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.listing.id },
      select: { productId: true },
    });
    const secondListing = await prisma.listing.create({
      data: {
        productId: listing.productId,
        status: 'ENDED',
        startsAt: new Date('2026-08-04T10:00:00.000Z'),
        originalEndsAt: new Date('2026-08-05T10:00:00.000Z'),
        endsAt: new Date('2026-08-05T10:00:00.000Z'),
        currentPrice: new Prisma.Decimal(50),
        bidCount: 1,
        auctionRules: { create: { startPrice: new Prisma.Decimal(50) } },
      },
      select: { id: true },
    });
    const secondBid = await prisma.bid.create({
      data: {
        listingId: secondListing.id,
        bidderUserId: fixture.nextRanked.id,
        idempotencyKey: `second-${fixture.order.publicId}`,
        amount: new Prisma.Decimal(50),
      },
      select: { id: true },
    });
    await prisma.order.create({
      data: {
        publicId: `inbx${fixture.order.id.replace(/-/g, '').slice(0, 7)}`,
        listingId: secondListing.id,
        sellerId: fixture.seller.id,
        buyerId: fixture.nextRanked.id,
        sourceBidId: secondBid.id,
        finalAmount: new Prisma.Decimal(50),
        contactDueAt: new Date('2026-08-06T10:00:00.000Z'),
        sellerHandoffType: 'TELEGRAM',
        sellerHandoffValue: fixture.sellerContact,
        buyerEmailAtClose: fixture.nextRanked.email,
        handoffInitiator: 'BUYER_CONTACTS_SELLER',
        snapshotTitle: 'Second inbox order',
        snapshotCurrency: 'BYN',
        snapshotProductPublicId: 'product0011',
        createdAt: new Date('2026-08-06T10:00:00.000Z'),
      },
    });
    const orders = createOrdersService();

    const firstPage = await orders.listForSeller(fixture.seller.id, 'user', {
      page: 1,
      limit: 1,
    });
    const secondPage = await orders.listForSeller(fixture.seller.id, 'user', {
      page: 2,
      limit: 1,
    });

    expect(firstPage.pagination).toEqual({ page: 1, limit: 1, total: 2 });
    expect(secondPage.pagination).toEqual({ page: 2, limit: 1, total: 2 });
    expect(firstPage.orders).toHaveLength(1);
    expect(secondPage.orders).toHaveLength(1);
    expect(firstPage.orders[0]?.order.publicId).not.toBe(
      secondPage.orders[0]?.order.publicId,
    );
  });
});

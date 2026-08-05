import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { OrdersService } from '../../src/orders/orders.service';
import {
  createOrderFixture,
  resetOrderFixture,
  type OrderFixture,
} from './order-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;

function createOrdersService(): OrdersService {
  return new OrdersService(
    prisma as never,
    {
      generate: () => `rep${randomUUID().replace(/-/g, '').slice(0, 8)}`,
    } as never,
  );
}

async function orderState(fixture: OrderFixture) {
  const [orders, audits, listing] = await Promise.all([
    prisma.order.findMany({
      where: { listingId: fixture.listing.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.auditEvent.findMany({
      where: { targetType: 'ORDER', targetId: fixture.order.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.listing.findUnique({ where: { id: fixture.listing.id } }),
  ]);
  return { orders, audits, listing };
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterEach(async () => resetOrderFixture(prisma));
afterAll(async () => context?.cleanup());

describe('manual Order replacement against PostgreSQL', () => {
  it('uses the next ranked Bid, preserves the cancelled history and snapshots privacy safely', async () => {
    const fixture = await createOrderFixture(prisma, {
      handoffInitiator: 'SELLER_CONTACTS_BUYER',
    });
    const orders = createOrdersService();

    const ranked = await orders.listRankedBids(
      fixture.admin.id,
      'admin',
      fixture.listing.id,
    );
    expect(ranked.bids.map((bid) => bid.id)).toEqual([
      fixture.winnerBid.id,
      fixture.nextRankedBid.id,
    ]);

    await orders.cancel(fixture.admin.id, 'admin', fixture.order.publicId, {
      reason: 'BUYER_DECLINED',
    });
    const replacement = await orders.replace(
      fixture.admin.id,
      'admin',
      fixture.order.publicId,
      { bidId: fixture.nextRankedBid.id },
    );

    expect(replacement.order.status).toBe('PENDING_CONTACT');
    expect(replacement.buyerEmailAtClose).toBe(fixture.nextRanked.email);
    expect(replacement.sellerHandoffValue).toBe(fixture.sellerContact);
    expect(replacement.sellerHandoffType).toBe('TELEGRAM');

    const state = await orderState(fixture);
    expect(state.orders).toHaveLength(2);
    expect(state.orders).toMatchObject([
      {
        publicId: fixture.order.publicId,
        status: 'CANCELLED',
        buyerId: fixture.winner.id,
        sourceBidId: fixture.winnerBid.id,
        cancellationReason: 'BUYER_DECLINED',
      },
      {
        status: 'PENDING_CONTACT',
        buyerId: fixture.nextRanked.id,
        sourceBidId: fixture.nextRankedBid.id,
      },
    ]);
    expect(state.listing?.currentPrice.toNumber()).toBe(200);
    expect(state.listing?.bidCount).toBe(2);
    expect(state.audits).toHaveLength(2);
    expect(state.audits).toMatchObject([
      {
        actorUserId: fixture.admin.id,
        oldStatus: 'PENDING_CONTACT',
        newStatus: 'CANCELLED',
        reason: 'BUYER_DECLINED',
      },
      {
        actorUserId: fixture.admin.id,
        oldStatus: 'CANCELLED',
        newStatus: 'REPLACED',
      },
    ]);
    expect(state.audits[1]?.reason).toContain(
      `originalBid=${fixture.winnerBid.id}`,
    );
    expect(state.audits[1]?.reason).toContain(
      `replacementBid=${fixture.nextRankedBid.id}`,
    );

    const buyerProjection = await orders.get(
      fixture.nextRanked.id,
      'user',
      replacement.order.publicId,
    );
    const sellerProjection = await orders.get(
      fixture.seller.id,
      'user',
      replacement.order.publicId,
    );
    const adminProjection = await orders.get(
      fixture.admin.id,
      'admin',
      replacement.order.publicId,
    );
    expect(buyerProjection.sellerHandoffValue).toBeNull();
    expect(buyerProjection.sellerHandoffType).toBeNull();
    expect(sellerProjection.buyerEmailAtClose).toBe(fixture.nextRanked.email);
    expect(adminProjection.buyerEmailAtClose).toBe(fixture.nextRanked.email);
    await expect(
      orders.get(fixture.winner.id, 'user', fixture.order.publicId),
    ).rejects.toThrow('Order is not available');
  });

  it('rejects non-admins, the original winner, unrelated Bids and duplicate active replacement', async () => {
    const fixture = await createOrderFixture(prisma);
    const orders = createOrdersService();

    await orders.cancel(fixture.admin.id, 'admin', fixture.order.publicId, {
      reason: 'ADMIN_CANCELLED',
    });
    const beforeRejectedActions = await orderState(fixture);

    await expect(
      orders.replace(fixture.outsider.id, 'user', fixture.order.publicId, {
        bidId: fixture.nextRankedBid.id,
      }),
    ).rejects.toThrow('Admin access required');
    await expect(
      orders.replace(fixture.admin.id, 'admin', fixture.order.publicId, {
        bidId: fixture.winnerBid.id,
      }),
    ).rejects.toThrow(
      'Replacement bid must differ from the original source bid',
    );
    await expect(
      orders.replace(fixture.admin.id, 'admin', fixture.order.publicId, {
        bidId: randomUUID(),
      }),
    ).rejects.toThrow('Bid not found for Listing');

    const afterRejectedActions = await orderState(fixture);
    expect(afterRejectedActions.orders).toHaveLength(1);
    expect(afterRejectedActions.orders[0]).toMatchObject({
      status: beforeRejectedActions.orders[0]?.status,
      buyerId: fixture.winner.id,
    });
    expect(afterRejectedActions.audits).toHaveLength(1);

    await orders.replace(fixture.admin.id, 'admin', fixture.order.publicId, {
      bidId: fixture.nextRankedBid.id,
    });
    await expect(
      orders.replace(fixture.admin.id, 'admin', fixture.order.publicId, {
        bidId: fixture.nextRankedBid.id,
      }),
    ).rejects.toThrow('Listing already has an active Order');

    const finalState = await orderState(fixture);
    expect(finalState.orders).toHaveLength(2);
    expect(finalState.audits).toHaveLength(2);
  });

  it('denies ranked Bid listing outside the admin role without touching the database', async () => {
    const fixture = await createOrderFixture(prisma);
    const orders = createOrdersService();

    await expect(
      orders.listRankedBids(fixture.seller.id, 'user', fixture.listing.id),
    ).rejects.toThrow('Admin access required');
    const state = await orderState(fixture);
    expect(state.orders).toHaveLength(1);
    expect(state.audits).toHaveLength(0);
  });
});

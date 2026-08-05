import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

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
      generate: () => `ord${randomUUID().replace(/-/g, '').slice(0, 8)}`,
    } as never,
  );
}

async function orderState(fixture: OrderFixture) {
  const [order, audits, orderCount] = await Promise.all([
    prisma.order.findUnique({ where: { publicId: fixture.order.publicId } }),
    prisma.auditEvent.findMany({
      where: { targetType: 'ORDER', targetId: fixture.order.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.count({ where: { listingId: fixture.listing.id } }),
  ]);
  return { order, audits, orderCount };
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterEach(async () => resetOrderFixture(prisma));
afterAll(async () => context?.cleanup());

describe('Order mutations against PostgreSQL', () => {
  it('enforces seller handoff roles, transitions, snapshots and terminal repeats', async () => {
    const fixture = await createOrderFixture(prisma);
    const orders = createOrdersService();

    const buyerProjection = await orders.get(
      fixture.winner.id,
      'user',
      fixture.order.publicId,
    );
    const sellerProjection = await orders.get(
      fixture.seller.id,
      'user',
      fixture.order.publicId,
    );
    expect(buyerProjection.sellerHandoffValue).toBe(fixture.sellerContact);
    expect(sellerProjection.buyerEmailAtClose).toBe(fixture.winner.email);

    await expect(
      orders.markContacted(fixture.winner.id, 'user', fixture.order.publicId),
    ).rejects.toThrow('Order is not owned by seller');
    await expect(
      orders.markContacted(fixture.outsider.id, 'user', fixture.order.publicId),
    ).rejects.toThrow('Order is not owned by seller');
    await expect(
      orders.markContacted(fixture.admin.id, 'admin', fixture.order.publicId),
    ).rejects.toThrow('Seller action requires a user account');

    await orders.markContacted(
      fixture.seller.id,
      'user',
      fixture.order.publicId,
    );
    await orders.markCompleted(
      fixture.seller.id,
      'user',
      fixture.order.publicId,
    );
    const completed = await orderState(fixture);
    expect(completed.order?.status).toBe('COMPLETED');
    expect(completed.audits).toHaveLength(2);
    expect(completed.audits).toMatchObject([
      {
        actorUserId: fixture.seller.id,
        oldStatus: 'PENDING_CONTACT',
        newStatus: 'CONTACTED',
      },
      {
        actorUserId: fixture.seller.id,
        oldStatus: 'CONTACTED',
        newStatus: 'COMPLETED',
      },
    ]);

    await expect(
      orders.markCompleted(fixture.seller.id, 'user', fixture.order.publicId),
    ).rejects.toThrow('Order cannot transition to the requested status');
    const afterRepeat = await orderState(fixture);
    expect(afterRepeat.orderCount).toBe(1);
    expect(afterRepeat.audits).toHaveLength(2);
  });

  it('allows handoff failure once and keeps the terminal state append-only', async () => {
    const fixture = await createOrderFixture(prisma);
    const orders = createOrdersService();

    await orders.markHandoffFailed(
      fixture.seller.id,
      'user',
      fixture.order.publicId,
    );
    await expect(
      orders.markHandoffFailed(
        fixture.seller.id,
        'user',
        fixture.order.publicId,
      ),
    ).rejects.toThrow('Order cannot transition to the requested status');
    await expect(
      orders.markCompleted(fixture.seller.id, 'user', fixture.order.publicId),
    ).rejects.toThrow('Order cannot transition to the requested status');

    const state = await orderState(fixture);
    expect(state.order?.status).toBe('HANDOFF_FAILED');
    expect(state.audits).toHaveLength(1);
    expect(state.audits[0]).toMatchObject({
      actorUserId: fixture.seller.id,
      oldStatus: 'PENDING_CONTACT',
      newStatus: 'HANDOFF_FAILED',
      reason: null,
    });
  });

  it('cancels only through the admin role, preserves snapshots and does not duplicate audit', async () => {
    const fixture = await createOrderFixture(prisma);
    const orders = createOrdersService();

    await expect(
      orders.cancel(fixture.outsider.id, 'user', fixture.order.publicId, {
        reason: 'BUYER_UNREACHABLE',
      }),
    ).rejects.toThrow('Admin access required');
    expect((await orderState(fixture)).audits).toHaveLength(0);

    const response = await orders.cancel(
      fixture.admin.id,
      'admin',
      fixture.order.publicId,
      { reason: 'BUYER_UNREACHABLE' },
    );
    expect(response.order.status).toBe('CANCELLED');
    expect(response.order.cancellationReason).toBe('BUYER_UNREACHABLE');
    expect(response.buyerEmailAtClose).toBe(fixture.winner.email);
    expect(response.sellerHandoffValue).toBe(fixture.sellerContact);

    await expect(
      orders.get(fixture.seller.id, 'user', fixture.order.publicId),
    ).rejects.toThrow('Order is not available');
    await expect(
      orders.get(fixture.winner.id, 'user', fixture.order.publicId),
    ).rejects.toThrow('Order is not available');

    const cancelled = await orderState(fixture);
    expect(cancelled.order).toMatchObject({
      status: 'CANCELLED',
      cancellationReason: 'BUYER_UNREACHABLE',
      buyerId: fixture.winner.id,
      sourceBidId: fixture.winnerBid.id,
    });
    expect(cancelled.orderCount).toBe(1);
    expect(cancelled.audits).toHaveLength(1);
    expect(cancelled.audits[0]).toMatchObject({
      actorUserId: fixture.admin.id,
      oldStatus: 'PENDING_CONTACT',
      newStatus: 'CANCELLED',
      reason: 'BUYER_UNREACHABLE',
    });

    await expect(
      orders.cancel(fixture.admin.id, 'admin', fixture.order.publicId, {
        reason: 'BUYER_UNREACHABLE',
      }),
    ).rejects.toThrow('Order cannot be cancelled');
    const afterRepeat = await orderState(fixture);
    expect(afterRepeat.orderCount).toBe(1);
    expect(afterRepeat.audits).toHaveLength(1);
  });
});

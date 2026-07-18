import { describe, expect, it, vi } from 'vitest';

import { OrdersService } from './orders.service';

const order = {
  id: '7a728f95-6c4d-4f35-a3fd-a7b9903a3182',
  publicId: 'orderPub001',
  listingId: 'dc20fe0f-138b-45b4-b4ce-4fd55312a985',
  sellerId: 'seller-id',
  buyerId: 'buyer-id',
  finalAmount: { toNumber: () => 125 },
  contactDueAt: new Date('2026-07-19T00:00:00.000Z'),
  status: 'PENDING_CONTACT' as const,
  cancellationReason: null,
  createdAt: new Date('2026-07-18T00:00:00.000Z'),
  updatedAt: new Date('2026-07-18T00:00:00.000Z'),
  listing: { product: { publicId: 'product0011', title: 'Product' } },
  buyer: { phone: '+375290000000' },
};

describe('OrdersService', () => {
  it('allows seller access and includes the verified buyer phone', async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(order) } };
    const service = new OrdersService(prisma as never, {} as never);

    const result = await service.get('seller-id', 'user', order.publicId);

    expect(result.buyerPhone).toBe('+375290000000');
  });

  it('allows buyer access without exposing the buyer contact projection', async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(order) } };
    const service = new OrdersService(prisma as never, {} as never);

    const result = await service.get('buyer-id', 'user', order.publicId);

    expect(result.buyerPhone).toBeNull();
  });

  it('rejects unrelated users', async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(order) } };
    const service = new OrdersService(prisma as never, {} as never);

    await expect(service.get('other-id', 'user', order.publicId))
      .rejects.toThrow('Order is not available');
  });
});

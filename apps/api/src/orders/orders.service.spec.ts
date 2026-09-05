import { describe, expect, it, vi } from 'vitest';

import { OrdersService } from './orders.service';
import { sellerProfileHandoffSelect } from '../sellers/seller-profile.mapper';

const baseOrder = {
  id: '7a728f95-6c4d-4f35-a3fd-a7b9903a3182',
  publicId: 'orderPub001',
  listingId: 'dc20fe0f-138b-45b4-b4ce-4fd55312a985',
  sellerId: 'seller-id',
  buyerId: 'buyer-id',
  finalAmount: { toNumber: () => 125 },
  contactDueAt: new Date('2026-07-19T00:00:00.000Z'),
  sellerHandoffType: 'PHONE' as const,
  sellerHandoffValue: '+375291234567',
  buyerEmailAtClose: 'buyer@example.com',
  handoffInitiator: 'BUYER_CONTACTS_SELLER' as const,
  status: 'PENDING_CONTACT' as const,
  cancellationReason: null,
  createdAt: new Date('2026-07-18T00:00:00.000Z'),
  updatedAt: new Date('2026-07-18T00:00:00.000Z'),
  listing: {
    currency: 'BYN',
    product: { publicId: 'product0011', title: 'Product' },
  },
  buyer: { phone: '+375290000000' },
};

const orderProjectionSelect = {
  id: true,
  publicId: true,
  listingId: true,
  sourceBidId: true,
  finalAmount: true,
  contactDueAt: true,
  status: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  sellerHandoffType: true,
  sellerHandoffValue: true,
  buyerEmailAtClose: true,
  handoffInitiator: true,
  snapshotTitle: true,
  snapshotCurrency: true,
  snapshotProductPublicId: true,
  sellerId: true,
  buyerId: true,
  listing: {
    select: {
      currency: true,
      product: {
        select: {
          publicId: true,
          title: true,
        },
      },
    },
  },
} as const;

describe('OrdersService', () => {
  it('allows seller access and includes the buyer email snapshot', async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(baseOrder) } };
    const service = new OrdersService(prisma as never, {} as never);

    const result = await service.get('seller-id', 'user', baseOrder.publicId);

    expect(result.buyerEmailAtClose).toBe('buyer@example.com');
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { publicId: baseOrder.publicId },
      select: orderProjectionSelect,
    });
  });

  it('shows seller contact to buyers in BUYER_CONTACTS_SELLER privacy mode', async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(baseOrder) } };
    const service = new OrdersService(prisma as never, {} as never);

    const result = await service.get('buyer-id', 'user', baseOrder.publicId);

    expect(result.sellerHandoffType).toBe('PHONE');
    expect(result.sellerHandoffValue).toBe('+375291234567');
  });

  it('hides seller contact from buyers in SELLER_CONTACTS_BUYER privacy mode', async () => {
    const order = {
      ...baseOrder,
      handoffInitiator: 'SELLER_CONTACTS_BUYER' as const,
    };
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(order) } };
    const service = new OrdersService(prisma as never, {} as never);

    const result = await service.get('buyer-id', 'user', order.publicId);

    expect(result.sellerHandoffType).toBeNull();
    expect(result.sellerHandoffValue).toBeNull();
  });

  it('rejects unrelated users', async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(baseOrder) } };
    const service = new OrdersService(prisma as never, {} as never);

    await expect(service.get('other-id', 'user', baseOrder.publicId)).rejects.toThrow(
      'Order is not available',
    );
  });

  it('hides cancelled orders from buyer and seller while keeping them visible to admin', async () => {
    const cancelledOrder = {
      ...baseOrder,
      status: 'CANCELLED' as const,
    };
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(cancelledOrder) } };
    const service = new OrdersService(prisma as never, {} as never);

    await expect(service.get('seller-id', 'user', cancelledOrder.publicId)).rejects.toThrow(
      'Order is not available',
    );
    await expect(service.get('buyer-id', 'user', cancelledOrder.publicId)).rejects.toThrow(
      'Order is not available',
    );

    const adminResult = await service.get('admin-id', 'admin', cancelledOrder.publicId);
    expect(adminResult.order.status).toBe('CANCELLED');
    expect(adminResult.buyerEmailAtClose).toBe('buyer@example.com');
    expect(adminResult.order.currency).toBe('BYN');
  });

  it('returns the frozen product summary even if the live Product title changed', async () => {
    const order = {
      ...baseOrder,
      snapshotTitle: 'Frozen title',
      snapshotCurrency: 'BYN',
      snapshotProductPublicId: 'product0011',
      listing: {
        currency: 'RUB',
        product: { publicId: 'changed0001', title: 'Changed title' },
      },
    };
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(order) } };
    const service = new OrdersService(prisma as never, {} as never);

    const result = await service.get('seller-id', 'user', order.publicId);

    expect(result.productSummary).toEqual({
      publicId: 'product0011',
      title: 'Frozen title',
    });
    expect(result.order.currency).toBe('BYN');
  });

  it('falls back to live Product fields for historical Orders without a snapshot', async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(baseOrder) } };
    const service = new OrdersService(prisma as never, {} as never);

    const result = await service.get('seller-id', 'user', baseOrder.publicId);

    expect(result.productSummary).toEqual({
      publicId: 'product0011',
      title: 'Product',
    });
    expect(result.order.currency).toBe('BYN');
  });

  it('lists the current seller Orders with frozen titles and hides cancelled rows', async () => {
    const visible = {
      ...baseOrder,
      snapshotTitle: 'Frozen inbox title',
      snapshotCurrency: 'BYN',
      snapshotProductPublicId: 'product0011',
      listing: {
        currency: 'RUB',
        product: { publicId: 'changed0001', title: 'Changed title' },
      },
    };
    const findMany = vi.fn().mockResolvedValue([visible]);
    const count = vi.fn().mockResolvedValue(1);
    const prisma = { order: { findMany, count } };
    const service = new OrdersService(prisma as never, {} as never);

    const result = await service.listForSeller('seller-id', 'user', {
      page: 2,
      limit: 10,
    });

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]?.productSummary.title).toBe('Frozen inbox title');
    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 1 });
    expect(findMany).toHaveBeenCalledWith({
      where: { sellerId: 'seller-id', status: { not: 'CANCELLED' } },
      select: orderProjectionSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 10,
      take: 10,
    });
    expect(orderProjectionSelect).not.toHaveProperty('sellerProfile');
    expect(orderProjectionSelect).not.toHaveProperty('buyer');
    expect(orderProjectionSelect).not.toHaveProperty('seller');
    expect(Object.keys(orderProjectionSelect.listing.select.product.select)).toEqual(
      ['publicId', 'title'],
    );
    expect(count).toHaveBeenCalledWith({
      where: { sellerId: 'seller-id', status: { not: 'CANCELLED' } },
    });
  });

  it('rejects admin listing through the seller inbox', async () => {
    const prisma = { order: { findMany: vi.fn(), count: vi.fn() } };
    const service = new OrdersService(prisma as never, {} as never);

    await expect(
      service.listForSeller('admin-id', 'admin', { page: 1, limit: 20 }),
    ).rejects.toThrow('Seller access required');
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it('loads seller handoff fields without profile photo bytes on recovery', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      status: 'LIVE',
      product: {
        sellerProfile: {
          userId: 'seller-id',
          status: 'APPROVED',
          handoffContactType: 'PHONE',
          handoffContactValue: '+375291234567',
          handoffInitiator: 'BUYER_CONTACTS_SELLER',
        },
      },
    });
    const prisma = {
      $transaction: vi.fn(async (callback: (tx: object) => Promise<unknown>) =>
        callback({ listing: { findUnique } }),
      ),
    };
    const service = new OrdersService(prisma as never, {} as never);

    await expect(
      service.createOrderForEndedListing('admin-id', 'admin', 'listing-id'),
    ).rejects.toThrow('Listing is not ended');
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'listing-id' },
      include: {
        product: {
          include: {
            sellerProfile: { select: sellerProfileHandoffSelect },
          },
        },
      },
    });
  });

  it('loads seller handoff fields without profile photo bytes on replacement', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      status: 'PENDING_CONTACT',
      listing: {
        product: {
          sellerProfile: {
            userId: 'seller-id',
            status: 'APPROVED',
            handoffContactType: 'PHONE',
            handoffContactValue: '+375291234567',
            handoffInitiator: 'BUYER_CONTACTS_SELLER',
          },
        },
      },
    });
    const prisma = {
      $transaction: vi.fn(async (callback: (tx: object) => Promise<unknown>) =>
        callback({ order: { findUnique } }),
      ),
    };
    const service = new OrdersService(prisma as never, {} as never);

    await expect(
      service.replace('admin-id', 'admin', 'orderPub001', {
        bidId: '00000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toThrow('Order is not eligible for replacement');
    expect(findUnique).toHaveBeenCalledWith({
      where: { publicId: 'orderPub001' },
      include: {
        listing: {
          include: {
            product: {
              include: {
                sellerProfile: { select: sellerProfileHandoffSelect },
              },
            },
          },
        },
      },
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../notifications/notification-outbox', () => ({
  enqueueNotification: vi.fn(),
}));

import { OrdersService } from './orders.service';

const listing = {
  id: 'listing-1',
  productId: 'product-1',
  sellerUserId: 'seller-1',
  currency: 'BYN',
  contactWindowHours: 6,
};

function serviceWith(generate: () => string, orderCreate: ReturnType<typeof vi.fn>) {
  const tx = {
    product: {
      findUnique: vi.fn().mockResolvedValue({
        title: 'Work',
        publicId: 'workpublic1',
        publishedRevision: null,
        sellerProfile: { fullName: 'Seller' },
      }),
    },
    order: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: orderCreate,
    },
  };
  const service = new OrdersService(
    {} as never,
    { generate } as never,
    {} as never,
    {} as never,
  );
  return { service, tx };
}

describe('createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when a generated order public id is not 11 url-safe characters', async () => {
    const orderCreate = vi.fn();
    const { service, tx } = serviceWith(
      vi
        .fn()
        .mockReturnValueOnce('not valid')
        .mockReturnValueOnce('abcdefghijk'),
      orderCreate,
    );
    await expect(
      service.createOrder(tx as never, {
        listing,
        buyerUserId: 'buyer-1',
        amountMinor: 1_500,
        source: 'FIXED_PURCHASE',
        status: 'ACTIVE',
        idempotencyKey: 'purchase-key',
        now: new Date('2026-10-30T12:00:00.000Z'),
      }),
    ).rejects.toThrow('Order public id is invalid');
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it('does not recheck an idempotency key or comment the purchase schema owns', async () => {
    const orderCreate = vi.fn(async ({ data }) => data);
    const { service, tx } = serviceWith(() => 'abcdefghijk', orderCreate);
    await service.createOrder(tx as never, {
      listing,
      buyerUserId: 'buyer-1',
      amountMinor: 1_500,
      source: 'FIXED_PURCHASE',
      status: 'ACTIVE',
      idempotencyKey: 'short',
      buyerComment: `  ${'a'.repeat(501)}  `,
      now: new Date('2026-10-30T12:00:00.000Z'),
    });
    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: 'short',
          buyerComment: 'a'.repeat(501),
        }),
      }),
    );
  });
});

describe('order detail author snapshot', () => {
  it('returns the stored author name to participants and rejects outsiders', async () => {
    const stored = {
      publicId: 'abcdefghijk', dealCode: '123456', status: 'COMPLETED',
      source: 'FIXED_PURCHASE', amountMinor: 1500, currency: 'BYN',
      workTitleSnapshot: 'Work', workPublicIdSnapshot: 'workpublic1',
      sellerNameSnapshot: 'Original author', coverImageIdSnapshot: null,
      buyerUserId: 'buyer-1', sellerUserId: 'seller-1', listingId: 'listing-1',
      createdAt: new Date('2026-10-30T12:00:00Z'), activatedAt: null,
      contactDeadlineAt: null, offerExpiresAt: null, buyerComment: null,
      sellerNote: null, failReason: null, faultSide: null,
      completedAt: new Date('2026-10-31T12:00:00Z'), failedAt: null,
    };
    const db = {
      order: { findUnique: vi.fn().mockResolvedValue(stored) },
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      sellerProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      listing: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const service = new OrdersService(db as never, {} as never, {} as never, {} as never);
    expect((await service.get('buyer-1', stored.publicId)).sellerNameSnapshot).toBe('Original author');
    expect((await service.get('seller-1', stored.publicId)).sellerNameSnapshot).toBe('Original author');
    await expect(service.get('other-user', stored.publicId)).rejects.toThrow('Order not found');
  });
});

describe('admin order author snapshot', () => {
  it('maps the stored author name with the administrative order detail', async () => {
    const { toAdminOrderDetail } = await import('./commerce.mapper');
    const detail = toAdminOrderDetail({
      publicId: 'abcdefghijk', dealCode: '123456', status: 'COMPLETED', source: 'FIXED_PURCHASE',
      amountMinor: 1500, currency: 'BYN', workTitle: 'Work', workPublicId: 'workpublic1',
      sellerNameSnapshot: 'Original author', coverImageId: null, createdAt: new Date('2026-10-30T12:00:00Z'),
      contactDeadlineAt: null, offerExpiresAt: null, buyerComment: null, sellerNote: null,
      failReason: null, faultSide: null, completedAt: new Date('2026-10-31T12:00:00Z'), failedAt: null,
      buyerEmail: 'buyer@example.invalid', buyerPhone: null, buyerTelegram: null, buyerInstagram: null, buyerVk: null,
      sellerEmail: 'seller@example.invalid', sellerPhone: null, sellerTelegram: null, sellerInstagram: null, sellerVk: null,
    });
    expect(detail.sellerNameSnapshot).toBe('Original author');
  });
});

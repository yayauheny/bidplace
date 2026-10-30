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
        images: [],
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

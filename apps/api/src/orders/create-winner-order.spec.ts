import { type Prisma } from '@bidplace/database';
import { describe, expect, it, vi } from 'vitest';

import {
  createWinnerOrder,
  WinnerOrderPublicIdExhaustedError,
} from './create-winner-order';

const baseInput = {
  listingId: 'listing-1',
  sellerId: 'seller-1',
  buyerId: 'buyer-1',
  sourceBidId: 'bid-1',
  finalAmount: { toString: () => '10' } as Prisma.Decimal,
  contactDueAt: new Date('2026-08-21T12:00:00.000Z'),
  sellerHandoffType: 'TELEGRAM' as const,
  sellerHandoffValue: '@seller',
  buyerEmailAtClose: 'buyer@example.com',
  handoffInitiator: 'BUYER_CONTACTS_SELLER' as const,
};

describe('createWinnerOrder', () => {
  it('returns already_exists when sourceBid Order is present in a fresh TX', async () => {
    const existing = { id: 'order-1', sourceBidId: 'bid-1' };
    const create = vi.fn();
    const prisma = {
      order: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          order: {
            findUnique: vi.fn().mockResolvedValue(existing),
            create,
          },
        }),
      ),
    };

    const result = await createWinnerOrder(prisma as never, {
      ...baseInput,
      generatePublicId: () => 'publicIdOk1',
    });

    expect(result).toEqual({ status: 'already_exists', order: existing });
    expect(create).not.toHaveBeenCalled();
  });

  it('retries publicId collisions in a new transaction then creates', async () => {
    const created = { id: 'order-2', publicId: 'publicIdOk1' };
    const publicIdError = {
      code: 'P2002',
      meta: { target: ['public_id'] },
    };
    const create = vi.fn();
    let attempt = 0;
    const prisma = {
      order: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
        attempt += 1;
        if (attempt === 1) {
          return callback({
            order: {
              findUnique: vi.fn().mockResolvedValue(null),
              create: create.mockRejectedValueOnce(publicIdError),
            },
          });
        }
        return callback({
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: create.mockResolvedValueOnce(created),
          },
        });
      }),
    };

    const result = await createWinnerOrder(prisma as never, {
      ...baseInput,
      generatePublicId: vi
        .fn()
        .mockReturnValueOnce('takenPubId1')
        .mockReturnValueOnce('publicIdOk1'),
    });

    expect(result).toEqual({ status: 'created', order: created });
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('treats sourceBid unique race as already_exists via root read', async () => {
    const existing = { id: 'order-3', sourceBidId: 'bid-1' };
    const sourceBidError = {
      code: 'P2002',
      meta: { target: ['source_bid_id'] },
    };
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue(existing),
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockRejectedValue(sourceBidError),
          },
        }),
      ),
    };

    const result = await createWinnerOrder(prisma as never, {
      ...baseInput,
      generatePublicId: () => 'publicIdOk2',
    });

    expect(result).toEqual({ status: 'already_exists', order: existing });
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { sourceBidId: 'bid-1' },
    });
  });

  it('throws after exhausting publicId retries across fresh TXs', async () => {
    const publicIdError = {
      code: 'P2002',
      meta: { target: ['orders_public_id_key'] },
    };
    const create = vi.fn().mockRejectedValue(publicIdError);
    const prisma = {
      order: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create,
          },
        }),
      ),
    };

    await expect(
      createWinnerOrder(prisma as never, {
        ...baseInput,
        generatePublicId: () => 'takenPubId1',
      }),
    ).rejects.toBeInstanceOf(WinnerOrderPublicIdExhaustedError);
    expect(prisma.$transaction).toHaveBeenCalledTimes(5);
    expect(create).toHaveBeenCalledTimes(5);
  });

  it('rethrows non-unique create errors', async () => {
    const prisma = {
      order: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockRejectedValue(new Error('db down')),
          },
        }),
      ),
    };

    await expect(
      createWinnerOrder(prisma as never, {
        ...baseInput,
        generatePublicId: () => 'publicIdOk3',
      }),
    ).rejects.toThrow('db down');
  });

  it('calls onCreated only when a new Order is created', async () => {
    const created = { id: 'order-4', status: 'PENDING_CONTACT' };
    const existing = { id: 'order-5', status: 'PENDING_CONTACT' };
    const onCreated = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      order: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(created),
          },
        }),
      ),
    };

    await createWinnerOrder(
      prisma as never,
      { ...baseInput, generatePublicId: () => 'publicIdOk4' },
      { onCreated },
    );

    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({ order: expect.any(Object) }),
      created,
    );

    onCreated.mockClear();
    prisma.$transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        order: {
          findUnique: vi.fn().mockResolvedValue(existing),
          create: vi.fn(),
        },
      }),
    );

    await createWinnerOrder(
      prisma as never,
      { ...baseInput, generatePublicId: () => 'publicIdOk5' },
      { onCreated },
    );

    expect(onCreated).not.toHaveBeenCalled();
  });
});

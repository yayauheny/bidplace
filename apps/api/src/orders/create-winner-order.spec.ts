import { type Prisma } from '@bidplace/database';
import { describe, expect, it, vi } from 'vitest';

import {
  createWinnerOrder,
  WinnerOrderPublicIdExhaustedError,
} from './create-winner-order';
import { orderContactSchedule } from './order-contact-deadline';
import { IncompleteOrderSnapshotError } from './order-snapshot';

const baseInput = {
  listingId: 'listing-1',
  sellerId: 'seller-1',
  buyerId: 'buyer-1',
  sourceBidId: 'bid-1',
  finalAmount: { toString: () => '10' } as Prisma.Decimal,
  now: new Date('2026-08-21T12:00:00.000Z'),
  sellerHandoffType: 'TELEGRAM' as const,
  sellerHandoffValue: '@seller',
  buyerEmailAtClose: 'buyer@example.com',
  handoffInitiator: 'BUYER_CONTACTS_SELLER' as const,
};

const dealListing = {
  currency: 'BYN',
  product: { title: 'Closed work', publicId: 'product0001' },
};

function winnerTx(options: {
  existing?: unknown;
  create?: ReturnType<typeof vi.fn>;
  listing?: unknown;
}) {
  return {
    listing: {
      findUnique: vi.fn().mockResolvedValue(options.listing ?? dealListing),
    },
    order: {
      findUnique: vi.fn().mockResolvedValue(options.existing ?? null),
      create: options.create ?? vi.fn(),
    },
  };
}

describe('createWinnerOrder', () => {
  it('returns already_exists when sourceBid Order is present in a fresh TX', async () => {
    const existing = { id: 'order-1', sourceBidId: 'bid-1' };
    const create = vi.fn();
    const tx = winnerTx({ existing, create });
    const prisma = {
      order: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    const result = await createWinnerOrder(prisma as never, {
      ...baseInput,
      generatePublicId: () => 'publicIdOk1',
    });

    expect(result).toEqual({ status: 'already_exists', order: existing });
    expect(create).not.toHaveBeenCalled();
    expect(tx.listing.findUnique).not.toHaveBeenCalled();
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
          return callback(
            winnerTx({
              create: create.mockRejectedValueOnce(publicIdError),
            }),
          );
        }
        return callback(
          winnerTx({
            create: create.mockResolvedValueOnce(created),
          }),
        );
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
        callback(
          winnerTx({
            create: vi.fn().mockRejectedValue(sourceBidError),
          }),
        ),
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
        callback(winnerTx({ create })),
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
        callback(
          winnerTx({
            create: vi.fn().mockRejectedValue(new Error('db down')),
          }),
        ),
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
        callback(
          winnerTx({
            create: vi.fn().mockResolvedValue(created),
          }),
        ),
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
      callback(winnerTx({ existing })),
    );

    await createWinnerOrder(
      prisma as never,
      { ...baseInput, generatePublicId: () => 'publicIdOk5' },
      { onCreated },
    );

    expect(onCreated).not.toHaveBeenCalled();
  });

  it('writes createdAt, contactDueAt and frozen deal snapshot from the Listing', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'order-6' });
    const prisma = {
      order: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback(winnerTx({ create })),
      ),
    };

    await createWinnerOrder(prisma as never, {
      ...baseInput,
      generatePublicId: () => 'publicIdOk6',
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...orderContactSchedule(baseInput.now),
        snapshotTitle: 'Closed work',
        snapshotCurrency: 'BYN',
        snapshotProductPublicId: 'product0001',
        listingId: 'listing-1',
        finalAmount: baseInput.finalAmount,
      }),
    });
  });

  it('fails closed when the Listing product cannot be snapshotted', async () => {
    const create = vi.fn();
    const prisma = {
      order: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback(
          winnerTx({
            create,
            listing: {
              currency: 'BYN',
              product: { title: null, publicId: 'product0001' },
            },
          }),
        ),
      ),
    };

    await expect(
      createWinnerOrder(prisma as never, {
        ...baseInput,
        generatePublicId: () => 'publicIdOk7',
      }),
    ).rejects.toBeInstanceOf(IncompleteOrderSnapshotError);
    expect(create).not.toHaveBeenCalled();
  });
});

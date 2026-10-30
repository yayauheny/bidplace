import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it, vi } from 'vitest';

import { CommerceGuards } from './commerce-guards';
import { ListingsService } from './listings.service';

const clock = new Date('2020-01-01T00:00:00.000Z');
const ownerId = '33333333-3333-4333-8333-333333333333';
const productId = '11111111-1111-4111-8111-111111111111';
const DAY_MS = 24 * 60 * 60 * 1000;

function saleProduct() {
  return {
    id: productId,
    publicId: 'workpublic000001',
    title: 'Bowl',
    status: 'APPROVED',
    publishedRevisionId: '22222222-2222-4222-8222-222222222222',
    sellerProfile: {
      userId: ownerId,
      status: 'APPROVED',
      user: { status: 'active', emailVerifiedAt: clock },
    },
  };
}

function database(create = vi.fn()) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([
      { now: clock, timeout: '0', id: productId },
    ]),
    product: { findUnique: vi.fn().mockResolvedValue(saleProduct()) },
    order: { findFirst: vi.fn().mockResolvedValue(null) },
    listing: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn(),
      create,
      updateMany: vi.fn(),
    },
    auditEvent: { create: vi.fn() },
  };
  const prisma = {
    $transaction: vi.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
    ),
  };
  return { tx, prisma };
}

function service(prisma: { $transaction: unknown }) {
  return new ListingsService(
    prisma as never,
    {} as CommerceGuards,
    {} as never,
  );
}

describe('listing windows use the database clock', () => {
  it('rejects a start more than 30 days after the database clock', async () => {
    const { tx, prisma } = database();
    const startsAt = new Date(clock.getTime() + 31 * DAY_MS);

    await expect(
      service(prisma).create(ownerId, productId, {
        type: 'AUCTION',
        currency: 'BYN',
        startPriceMinor: 1_000,
        startsAt: startsAt.toISOString(),
        endsAt: new Date(startsAt.getTime() + 2 * DAY_MS).toISOString(),
        contactWindowHours: 24,
      }),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.VALIDATION_ERROR,
      status: 400,
    });
    expect(tx.listing.create).not.toHaveBeenCalled();
  });

  it('rejects a fixed price scheduled after the database clock', async () => {
    const { tx, prisma } = database();
    const startsAt = new Date(clock.getTime() + DAY_MS);

    await expect(
      service(prisma).create(ownerId, productId, {
        type: 'FIXED',
        currency: 'BYN',
        priceMinor: 1_500,
        startsAt: startsAt.toISOString(),
        contactWindowHours: 24,
      }),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.VALIDATION_ERROR,
      status: 400,
    });
    expect(tx.listing.create).not.toHaveBeenCalled();
  });

  it('stores a scheduled auction from the database clock, not the process clock', async () => {
    const startsAt = new Date(clock.getTime() + 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 2 * DAY_MS);
    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: '44444444-4444-4444-8444-444444444444',
      status: data.status,
      type: data.type,
      contactWindowHours: data.contactWindowHours,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
    }));
    const { tx, prisma } = database(create);

    await expect(
      service(prisma).create(ownerId, productId, {
        type: 'AUCTION',
        currency: 'BYN',
        startPriceMinor: 1_000,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        contactWindowHours: 24,
      }),
    ).resolves.toMatchObject({ status: 'SCHEDULED' });
    expect(tx.listing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SCHEDULED',
          startsAt,
        }),
      }),
    );
  });

  it('stamps an immediate fixed listing with the database clock', async () => {
    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: '44444444-4444-4444-8444-444444444444',
      status: data.status,
      type: data.type,
      contactWindowHours: data.contactWindowHours,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
    }));
    const { tx, prisma } = database(create);

    await expect(
      service(prisma).create(ownerId, productId, {
        type: 'FIXED',
        currency: 'BYN',
        priceMinor: 1_500,
        startsAt: new Date(clock.getTime() - 60_000).toISOString(),
        contactWindowHours: 24,
      }),
    ).resolves.toMatchObject({ status: 'LIVE' });
    expect(tx.listing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'LIVE',
          startsAt: clock,
          endsAt: null,
        }),
      }),
    );
  });
});

describe('author cancel', () => {
  it('does not withdraw a listing when the conditional update matches nothing', async () => {
    const listingId = '55555555-5555-4555-8555-555555555555';
    const { tx, prisma } = database();
    tx.listing.findUnique.mockResolvedValue({
      id: listingId,
      productId,
      sellerUserId: ownerId,
      type: 'FIXED',
      status: 'LIVE',
      bidCount: 0,
      startsAt: clock,
      endsAt: null,
    });
    tx.listing.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service(prisma).cancelByAuthor(ownerId, listingId),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.LISTING_CHANGED,
      status: 409,
    });
    expect(tx.listing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: listingId,
          status: { in: ['SCHEDULED', 'LIVE'] },
        }),
      }),
    );
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });
});

describe('listing unique index', () => {
  function fixedInput() {
    return {
      type: 'FIXED' as const,
      currency: 'BYN' as const,
      priceMinor: 1_500,
      startsAt: new Date(clock.getTime() - 60_000).toISOString(),
      contactWindowHours: 24 as const,
    };
  }

  it('maps one_active_listing_per_product to PRODUCT_IN_SALE', async () => {
    const create = vi.fn().mockRejectedValue({
      code: 'P2002',
      meta: { target: 'one_active_listing_per_product' },
    });
    const { prisma } = database(create);

    await expect(
      service(prisma).create(ownerId, productId, fixedInput()),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.PRODUCT_IN_SALE,
      status: 409,
    });
  });

  it('rethrows a different unique constraint', async () => {
    const create = vi.fn().mockRejectedValue({
      code: 'P2002',
      meta: { target: ['seller_user_id'] },
    });
    const { prisma } = database(create);

    await expect(
      service(prisma).create(ownerId, productId, fixedInput()),
    ).rejects.toMatchObject({
      code: 'P2002',
      meta: { target: ['seller_user_id'] },
    });
  });
});

import { describe, expect, it, vi } from 'vitest';

import { ListingsService } from './listings.service';
import {
  sellerProfileAuthSelect,
  sellerProfileHandoffSelect,
} from '../sellers/seller-profile.mapper';

describe('ListingsService', () => {
  it('omits internal auction rules fields from create responses', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'APPROVED',
          sellerProfile: { userId: 'seller-id', status: 'APPROVED' },
        }),
      },
      listing: {
        create: vi.fn().mockResolvedValue({
          id: '11111111-1111-4111-8111-111111111111',
          productId: '22222222-2222-4222-8222-222222222222',
          type: 'AUCTION',
          status: 'DRAFT',
          currency: 'BYN',
          startsAt: now,
          originalEndsAt: now,
          endsAt: now,
          currentPrice: { toNumber: () => 10 },
          bidCount: 0,
          closedAt: null,
          createdAt: now,
          updatedAt: now,
          auctionRules: {
            id: '33333333-3333-4333-8333-333333333333',
            listingId: '11111111-1111-4111-8111-111111111111',
            startPrice: { toNumber: () => 10 },
            incrementPolicyCode: 'MVP_BYN_V1',
            softCloseWindowSeconds: 60,
            softCloseExtensionSeconds: 60,
            softCloseMaxTotalSeconds: 600,
            createdAt: now,
            updatedAt: now,
          },
        }),
      },
    };
    const service = new ListingsService(prisma as never);

    const result = await service.create('seller-id', 'product-id', {
      startsAt: '2026-07-24T01:00:00.000Z',
      endsAt: '2026-07-24T02:00:00.000Z',
      startPrice: 10,
    });

    expect(result.listing.auctionRules).toMatchObject({
      startPrice: 10,
      incrementPolicyCode: 'MVP_BYN_V1',
      softCloseWindowSeconds: 60,
      softCloseExtensionSeconds: 60,
      softCloseMaxTotalSeconds: 600,
    });
    expect(result.listing.auctionRules).not.toHaveProperty('id');
    expect(result.listing.auctionRules).not.toHaveProperty('listingId');
    expect(result.listing.auctionRules).not.toHaveProperty('createdAt');
    expect(result.listing.auctionRules).not.toHaveProperty('updatedAt');
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      select: {
        status: true,
        sellerProfile: { select: sellerProfileAuthSelect },
      },
    });
  });

  it('does not expose an internal Listing to another user', async () => {
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          product: { sellerProfile: { userId: 'seller-id' } },
          auctionRules: null,
        }),
      },
    };
    const service = new ListingsService(prisma as never);

    await expect(service.get('other-user', 'user', 'listing-id'))
      .rejects.toThrow('Listing is not available');
    expect(prisma.listing.findUnique).toHaveBeenCalledWith({
      where: { id: 'listing-id' },
      include: {
        auctionRules: true,
        product: {
          include: {
            sellerProfile: { select: sellerProfileHandoffSelect },
          },
        },
      },
    });
  });

  it('omits nested Product from listing responses', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          id: '11111111-1111-4111-8111-111111111111',
          productId: '22222222-2222-4222-8222-222222222222',
          type: 'AUCTION',
          status: 'DRAFT',
          currency: 'BYN',
          startsAt: now,
          originalEndsAt: now,
          endsAt: now,
          currentPrice: { toNumber: () => 10 },
          bidCount: 0,
          closedAt: null,
          createdAt: now,
          updatedAt: now,
          auctionRules: {
            startPrice: { toNumber: () => 10 },
            incrementPolicyCode: 'MVP_BYN_V1',
            softCloseWindowSeconds: 60,
            softCloseExtensionSeconds: 60,
            softCloseMaxTotalSeconds: 600,
          },
          product: {
            sellerProfile: {
              userId: 'seller-id',
              handoffContactValue: '+375291234567',
            },
          },
        }),
      },
    };
    const service = new ListingsService(prisma as never);

    const result = await service.get('seller-id', 'user', 'listing-id');

    expect(result.listing).not.toHaveProperty('product');
  });

  it('rejects schedule after lock when handoff contact was cleared', async () => {
    const { service, tx } = createSchedulePrisma({
      lockedHandoff: { handoffContactType: null, handoffContactValue: null },
    });

    await expect(
      service.transition(
        'seller-id',
        'listing-id',
        'SCHEDULE',
        new Date('2026-09-01T00:00:00.000Z'),
      ),
    ).rejects.toThrow('Seller handoff contact is required before scheduling');
    expect(tx.listing.update).not.toHaveBeenCalled();
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it('rejects schedule after lock when startsAt is already in the past', async () => {
    const { service, tx } = createSchedulePrisma({
      lockedStartsAt: new Date('2000-01-01T10:00:00.000Z'),
      lockedOriginalEndsAt: new Date('2000-01-01T12:00:00.000Z'),
    });

    await expect(
      service.transition(
        'seller-id',
        'listing-id',
        'SCHEDULE',
        new Date('2026-09-01T00:00:00.000Z'),
      ),
    ).rejects.toThrow('Listing dates are invalid');
    expect(tx.listing.update).not.toHaveBeenCalled();
  });

  it('writes publishedAt from the post-lock clock', async () => {
    const { service, tx } = createSchedulePrisma({});
    const before = Date.now();

    await service.transition(
      'seller-id',
      'listing-id',
      'SCHEDULE',
      new Date('2020-01-01T00:00:00.000Z'),
    );

    const publishedAt = tx.product.update.mock.calls[0]?.[0]?.data?.publishedAt as Date;
    expect(publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(publishedAt.toISOString()).not.toBe('2020-01-01T00:00:00.000Z');
    expect(tx.listing.update).toHaveBeenCalled();
    expect(
      String(tx.$queryRaw.mock.calls[0]?.[0]?.strings?.join(' ') ?? ''),
    ).toContain('FOR UPDATE');
  });
});

function createSchedulePrisma(options: {
  lockedHandoff?: {
    handoffContactType: string | null;
    handoffContactValue: string | null;
  };
  lockedStartsAt?: Date;
  lockedOriginalEndsAt?: Date;
}) {
  const now = new Date('2026-12-01T10:00:00.000Z');
  const ends = new Date('2026-12-01T12:00:00.000Z');
  const sellerProfile = {
    userId: 'seller-id',
    status: 'APPROVED',
    handoffContactType: 'TELEGRAM',
    handoffContactValue: '@owner',
    handoffInitiator: 'BUYER_CONTACTS_SELLER',
  };
  const listing = {
    id: 'listing-id',
    productId: 'product-id',
    type: 'AUCTION' as const,
    status: 'DRAFT' as const,
    currency: 'BYN',
    startsAt: now,
    originalEndsAt: ends,
    endsAt: ends,
    currentPrice: { toNumber: () => 10 },
    bidCount: 0,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
    auctionRules: {
      startPrice: { toNumber: () => 10 },
      incrementPolicyCode: 'MVP_BYN_V1',
      softCloseWindowSeconds: 60,
      softCloseExtensionSeconds: 60,
      softCloseMaxTotalSeconds: 600,
    },
    product: {
      status: 'APPROVED',
      publishedAt: null,
      sellerProfile,
    },
  };
  const lockedListing = {
    ...listing,
    startsAt: options.lockedStartsAt ?? listing.startsAt,
    originalEndsAt: options.lockedOriginalEndsAt ?? listing.originalEndsAt,
    product: {
      ...listing.product,
      sellerProfile: {
        ...sellerProfile,
        ...options.lockedHandoff,
      },
    },
  };
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
    listing: {
      findUnique: vi.fn().mockResolvedValue(lockedListing),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({
        ...lockedListing,
        status: 'SCHEDULED',
        product: undefined,
      }),
    },
    product: {
      update: vi.fn().mockResolvedValue({}),
    },
  };
  const prisma = {
    listing: {
      findUnique: vi.fn().mockResolvedValue(listing),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    ),
  };
  return { service: new ListingsService(prisma as never), tx };
}

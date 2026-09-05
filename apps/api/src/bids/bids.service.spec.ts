import { ApiErrorCode } from '@bidplace/contracts';
import { Decimal } from '@bidplace/database';
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AppException } from '../core/errors';
import { BidsService } from './bids.service';
import { publicProductContentWhere } from '../products/public-visibility';
import { sellerProfileAuthSelect } from '../sellers/seller-profile.mapper';

function createLiveListingTx(overrides: {
  sellerUserId?: string;
  productStatus?: string;
  sellerStatus?: string;
  endsAt?: Date;
  bidCount?: number;
  currentPrice?: Decimal;
  existingBid?: { listingId: string; amount: Decimal } | null;
}) {
  const now = new Date('2026-07-31T12:00:00.000Z');
  const currentPrice = overrides.currentPrice ?? new Decimal(10);

  return {
    now,
    tx: {
      bid: {
        findUnique: vi.fn().mockResolvedValue(overrides.existingBid ?? null),
      },
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'listing-id',
          status: 'LIVE',
          currentPrice,
          bidCount: overrides.bidCount ?? 0,
          startsAt: new Date('2026-07-31T11:00:00.000Z'),
          endsAt: overrides.endsAt ?? new Date('2026-07-31T13:00:00.000Z'),
          originalEndsAt: new Date('2026-07-31T13:00:00.000Z'),
          product: {
            status: overrides.productStatus ?? 'APPROVED',
            sellerProfile: {
              userId: overrides.sellerUserId ?? 'seller-id',
              status: overrides.sellerStatus ?? 'APPROVED',
            },
          },
          auctionRules: {
            startPrice: new Decimal(10),
            softCloseWindowSeconds: 60,
            softCloseExtensionSeconds: 60,
            softCloseMaxTotalSeconds: 600,
          },
        }),
        updateMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          emailVerifiedAt: now,
          termsAcceptances: [
            { rulesVersion: 'MVP_RULES_V1', acceptedAt: now },
          ],
        }),
      },
    },
  };
}

function createService(tx: object, now: Date) {
  const prisma = {
    $transaction: vi.fn(
      async (callback: (client: object) => Promise<unknown>) => callback(tx),
    ),
  };
  return new BidsService(
    prisma as never,
    { now: () => now } as never,
    {} as never,
  );
}

describe('BidsService error contract', () => {
  it('rejects admin accounts with ADMIN_BID_FORBIDDEN', async () => {
    const service = new BidsService({} as never, {} as never, {} as never);

    try {
      await service.place('admin-id', 'admin', 'listing-id', 'request-id', {
        amount: 100,
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).apiCode).toBe(
        ApiErrorCode.ADMIN_BID_FORBIDDEN,
      );
      expect((error as AppException).getStatus()).toBe(HttpStatus.FORBIDDEN);
    }
  });

  it('rejects a bid below minimum with BID_TOO_LOW and minimumBid details', async () => {
    const { tx, now } = createLiveListingTx({ bidCount: 1 });
    const service = createService(tx, now);

    try {
      await service.place('buyer-id', 'user', 'listing-id', 'request-id', {
        amount: 10,
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).apiCode).toBe(ApiErrorCode.BID_TOO_LOW);
      expect((error as AppException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((error as AppException).getResponse()).toMatchObject({
        code: ApiErrorCode.BID_TOO_LOW,
        details: { minimumBid: '10.50' },
      });
    }
    expect(tx.listing.findUnique).toHaveBeenCalledWith({
      where: { id: 'listing-id' },
      include: {
        auctionRules: true,
        product: {
          include: {
            sellerProfile: { select: sellerProfileAuthSelect },
          },
        },
      },
    });
  });

  it('rejects seller self-bids with SELF_BID_FORBIDDEN', async () => {
    const { tx, now } = createLiveListingTx({ sellerUserId: 'seller-id' });
    const service = createService(tx, now);

    await expect(
      service.place('seller-id', 'user', 'listing-id', 'request-id', {
        amount: 10,
      }),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.SELF_BID_FORBIDDEN,
    });
  });

  it('retries LISTING_CHANGED against a fresh Listing snapshot', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const { Decimal } = await import('@bidplace/database');
    const listingSnapshots = [
      {
        id: 'listing-id',
        status: 'LIVE',
        currentPrice: new Decimal(100),
        bidCount: 1,
        startsAt: new Date('2026-07-31T11:00:00.000Z'),
        endsAt: new Date('2026-07-31T13:00:00.000Z'),
        originalEndsAt: new Date('2026-07-31T13:00:00.000Z'),
        product: {
          status: 'APPROVED',
          sellerProfile: { userId: 'seller-id', status: 'APPROVED' },
        },
        auctionRules: {
          startPrice: new Decimal(100),
          softCloseWindowSeconds: 60,
          softCloseExtensionSeconds: 60,
          softCloseMaxTotalSeconds: 600,
        },
      },
      {
        id: 'listing-id',
        status: 'LIVE',
        currentPrice: new Decimal(110),
        bidCount: 2,
        startsAt: new Date('2026-07-31T11:00:00.000Z'),
        endsAt: new Date('2026-07-31T13:00:00.000Z'),
        originalEndsAt: new Date('2026-07-31T13:00:00.000Z'),
        product: {
          status: 'APPROVED',
          sellerProfile: { userId: 'seller-id', status: 'APPROVED' },
        },
        auctionRules: {
          startPrice: new Decimal(100),
          softCloseWindowSeconds: 60,
          softCloseExtensionSeconds: 60,
          softCloseMaxTotalSeconds: 600,
        },
      },
    ];
    const updateCounts = [0, 1];
    const tx = {
      bid: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'bid-id',
          listingId: 'listing-id',
          bidderUserId: 'buyer-id',
          amount: new Decimal(120),
          createdAt: now,
        }),
      },
      listing: {
        findUnique: vi
          .fn()
          .mockImplementation(() =>
            Promise.resolve(listingSnapshots.shift() ?? null),
          ),
        updateMany: vi
          .fn()
          .mockImplementation(() =>
            Promise.resolve({ count: updateCounts.shift() ?? 0 }),
          ),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          emailVerifiedAt: now,
          termsAcceptances: [
            { rulesVersion: 'MVP_RULES_V1', acceptedAt: now },
          ],
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: object) => Promise<unknown>) => callback(tx),
      ),
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'listing-id',
          productId: 'product-id',
          status: 'LIVE',
          currency: 'BYN',
          startsAt: new Date('2026-07-31T11:00:00.000Z'),
          originalEndsAt: new Date('2026-07-31T13:00:00.000Z'),
          endsAt: new Date('2026-07-31T13:00:00.000Z'),
          currentPrice: new Decimal(120),
          bidCount: 3,
          closedAt: null,
          createdAt: now,
          updatedAt: now,
          auctionRules: {
            startPrice: new Decimal(100),
            incrementPolicyCode: 'MVP_BYN_V1',
            softCloseWindowSeconds: 60,
            softCloseExtensionSeconds: 60,
            softCloseMaxTotalSeconds: 600,
          },
        }),
      },
    };
    const service = new BidsService(
      prisma as never,
      { now: () => now } as never,
      { emit: vi.fn() } as never,
    );

    const result = await service.place(
      'buyer-id',
      'user',
      'listing-id',
      'cas-retry',
      { amount: 120 },
    );

    expect(result.bid.amount).toBe(120);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(tx.listing.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.bid.create).toHaveBeenCalledTimes(1);
  });

  it('rejects ended listings with LISTING_NOT_OPEN', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const { tx } = createLiveListingTx({ endsAt: now });
    const service = createService(tx, now);

    await expect(
      service.place('buyer-id', 'user', 'listing-id', 'request-id', {
        amount: 10,
      }),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.LISTING_NOT_OPEN,
    });
  });

  it('rejects idempotency payload mismatch with IDEMPOTENCY_CONFLICT', async () => {
    const { tx, now } = createLiveListingTx({
      existingBid: {
        listingId: 'listing-id',
        amount: new Decimal(10),
      },
    });
    const service = createService(tx, now);

    await expect(
      service.place('buyer-id', 'user', 'listing-id', 'same-key', {
        amount: 11,
      }),
    ).rejects.toMatchObject({
      apiCode: ApiErrorCode.IDEMPOTENCY_CONFLICT,
    });
  });

  it('lists bids only for a publicly visible Listing', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const service = new BidsService(
      { listing: { findFirst } } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.list('listing-id', { page: 1, limit: 20 }),
    ).rejects.toThrow('Listing not found');
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'listing-id',
        status: { in: ['LIVE', 'SCHEDULED', 'ENDED'] },
        product: {
          status: 'APPROVED',
          sellerProfile: { status: 'APPROVED' },
          ...publicProductContentWhere,
        },
      },
      select: { id: true },
    });
  });

  it.each([
    ['CHANGES_REQUESTED', 'APPROVED'],
    ['APPROVED', 'SUSPENDED'],
  ] as const)(
    'rejects a LIVE listing when Product is %s and SellerProfile is %s',
    async (productStatus, sellerStatus) => {
      const { tx, now } = createLiveListingTx({
        productStatus,
        sellerStatus,
      });
      const service = createService(tx, now);

      await expect(
        service.place('buyer-id', 'user', 'listing-id', 'request-id', {
          amount: 11,
        }),
      ).rejects.toMatchObject({
        apiCode: ApiErrorCode.LISTING_NOT_OPEN,
      });
    },
  );
});

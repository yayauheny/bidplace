import { describe, expect, it, vi } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  assertProductWritable,
  lockProductRowForUpdate,
  PRODUCT_EDIT_LOCK_LISTING_STATUSES,
} from './product-write-guard';

function snapshot(overrides: {
  status?: string;
  userId?: string;
  sellerStatus?: string;
  listings?: Array<{ id: string }>;
} = {}) {
  return {
    id: 'product-id',
    status: overrides.status ?? 'DRAFT',
    sellerProfile: {
      userId: overrides.userId ?? 'owner-id',
      status: overrides.sellerStatus ?? 'APPROVED',
    },
    listings: overrides.listings ?? [],
  };
}

describe('product write guard', () => {
  it('locks the Product row with SELECT FOR UPDATE', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
    };

    await lockProductRowForUpdate(tx, 'product-id');

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(String(tx.$queryRaw.mock.calls[0]?.[0]?.strings?.join(' ') ?? '')).toContain(
      'FOR UPDATE',
    );
  });

  it('throws not found when the Product row is missing', async () => {
    await expect(
      lockProductRowForUpdate({ $queryRaw: vi.fn().mockResolvedValue([]) }, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each(['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'] as const)(
    'allows owner writes in %s without a blocking Listing',
    (status) => {
      expect(() =>
        assertProductWritable(snapshot({ status }), 'owner-id', 'edit'),
      ).not.toThrow();
    },
  );

  it.each(['PENDING_REVIEW', 'APPROVED', 'ARCHIVED'] as const)(
    'rejects owner writes in %s',
    (status) => {
      expect(() =>
        assertProductWritable(snapshot({ status }), 'owner-id', 'edit'),
      ).toThrow(ForbiddenException);
      expect(() =>
        assertProductWritable(snapshot({ status }), 'owner-id', 'submit'),
      ).toThrow(ConflictException);
      expect(() =>
        assertProductWritable(snapshot({ status }), 'owner-id', 'images'),
      ).toThrow('Product images are locked');
      expect(() =>
        assertProductWritable(snapshot({ status }), 'owner-id', 'creation-story'),
      ).toThrow('Product creation story is locked');
    },
  );

  it('rejects writes when a SCHEDULED or LIVE Listing exists', () => {
    expect(PRODUCT_EDIT_LOCK_LISTING_STATUSES).toEqual(['SCHEDULED', 'LIVE']);
    expect(() =>
      assertProductWritable(
        snapshot({ listings: [{ id: 'listing-id' }] }),
        'owner-id',
        'edit',
      ),
    ).toThrow('Product is locked by an active Listing');
  });

  it('rejects a missing Product, other owner, and unapproved seller', () => {
    expect(() => assertProductWritable(null, 'owner-id', 'edit')).toThrow(
      NotFoundException,
    );
    expect(() =>
      assertProductWritable(snapshot({ userId: 'owner-id' }), 'other-id', 'edit'),
    ).toThrow('Product is not owned by user');
    expect(() =>
      assertProductWritable(
        snapshot({ sellerStatus: 'PENDING_REVIEW' }),
        'owner-id',
        'edit',
      ),
    ).toThrow('Approved SellerProfile is required');
  });
});

import { Prisma } from '@bidplace/database';
import { describe, expect, it, vi } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  assertProductWritable,
  lockProductRowForUpdate,
} from './product-write-guard';

function snapshot(
  overrides: {
    status?: string;
    userId?: string;
    sellerStatus?: string;
    } = {},
) {
  return {
    id: 'product-id',
    status: overrides.status ?? 'DRAFT',
    sellerProfile: {
      userId: overrides.userId ?? 'owner-id',
      status: overrides.sellerStatus ?? 'APPROVED',
    },
  };
}

function transaction(inSale = false) {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id', timeout: '0' }]),
    listing: {
      findFirst: vi
        .fn()
        .mockResolvedValue(inSale ? { id: 'listing-id' } : null),
    },
  } as unknown as Prisma.TransactionClient;
}

describe('product write guard', () => {
  it('locks the Product row with SELECT FOR UPDATE', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id', timeout: '0' }]),
    };

    await lockProductRowForUpdate(tx, 'product-id');

    expect(tx.$queryRaw).toHaveBeenCalledTimes(3);
    expect(
      String(tx.$queryRaw.mock.calls[1]?.[0]?.strings?.join(' ') ?? ''),
    ).toContain('FOR UPDATE');
  });

  it.each([
    { code: 'P2010', sqlCode: '55P03', conflict: true },
    { code: 'P2010', sqlCode: 'XX000', conflict: false },
    { code: 'P2028', sqlCode: '55P03', conflict: false },
  ])('maps only Product lock contention ($code/$sqlCode)', async ({ code, sqlCode, conflict }) => {
    const error = new Prisma.PrismaClientKnownRequestError('synthetic failure', { code, clientVersion: '6.19.3', meta: { code: sqlCode } });
    const query = vi.fn().mockResolvedValueOnce([{ timeout: '250ms' }]).mockRejectedValueOnce(error);
    const result = lockProductRowForUpdate({ $queryRaw: query }, 'product-id');
    if (conflict) await expect(result).rejects.toMatchObject({ apiCode: 'PRODUCT_STATE_CONFLICT', status: 409 });
    else await expect(result).rejects.toBe(error);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('restores the previous transaction lock timeout after acquiring the Product', async () => {
    const query = vi.fn().mockResolvedValueOnce([{ timeout: '250ms' }]).mockResolvedValueOnce([{ id: 'product-id' }]).mockResolvedValue([]);
    await lockProductRowForUpdate({ $queryRaw: query }, 'product-id');
    expect(query.mock.calls[2]?.[1]).toBe('250ms');
  });

  it('throws not found when the Product row is missing', async () => {
    await expect(
      lockProductRowForUpdate(
        { $queryRaw: vi.fn().mockResolvedValueOnce([{ timeout: '0' }]).mockResolvedValue([]) },
        'missing',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each(['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'] as const)(
    'allows owner writes in %s without a blocking Listing',
    async (status) => {
      await expect(
        assertProductWritable(
          transaction(),
          snapshot({ status }),
          'owner-id',
          'edit',
        ),
      ).resolves.toMatchObject({ status });
    },
  );

  it.each(['PENDING_REVIEW', 'APPROVED', 'ARCHIVED'] as const)(
    'rejects owner writes in %s',
    async (status) => {
      await expect(
        assertProductWritable(
          transaction(),
          snapshot({ status }),
          'owner-id',
          'edit',
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        assertProductWritable(
          transaction(),
          snapshot({ status }),
          'owner-id',
          'submit',
        ),
      ).rejects.toThrow(ConflictException);
      await expect(
        assertProductWritable(
          transaction(),
          snapshot({ status }),
          'owner-id',
          'images',
        ),
      ).rejects.toThrow('Product images are locked');
      await expect(
        assertProductWritable(
          transaction(),
          snapshot({ status }),
          'owner-id',
          'creation-story',
        ),
      ).rejects.toThrow('Product creation story is locked');
    },
  );

  it('rejects writes when a SCHEDULED or LIVE Listing exists', async () => {
    await expect(
      assertProductWritable(
        transaction(true),
        snapshot(),
        'owner-id',
        'edit',
      ),
    ).rejects.toMatchObject({ status: 409, apiCode: 'PRODUCT_IN_SALE' });
  });

  it('rejects a missing Product, other owner, and unapproved seller', async () => {
    await expect(
      assertProductWritable(transaction(), null, 'owner-id', 'edit'),
    ).rejects.toThrow(NotFoundException);
    await expect(
      assertProductWritable(
        transaction(),
        snapshot({ userId: 'owner-id' }),
        'other-id',
        'edit',
      ),
    ).rejects.toThrow('Product is not owned by user');
    await expect(
      assertProductWritable(
        transaction(),
        snapshot({ sellerStatus: 'PENDING_REVIEW' }),
        'owner-id',
        'edit',
      ),
    ).rejects.toThrow('Approved SellerProfile is required');
  });
});

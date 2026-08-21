import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImagesService } from './images.service';
import * as imagePolicy from './image-policy';

vi.mock('./image-policy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./image-policy')>();
  return {
    ...actual,
    validateAndNormalizeProductImageUploads: vi.fn(),
  };
});

const validateAndNormalizeProductImageUploads = vi.mocked(
  imagePolicy.validateAndNormalizeProductImageUploads,
);

function createApprovedProduct(
  images: { position: number; byteLength: number }[],
  sellerStatus: 'APPROVED' | 'PENDING' | 'SUSPENDED' = 'APPROVED',
) {
  return {
    status: 'DRAFT',
    sellerProfile: {
      userId: 'owner-id',
      status: sellerStatus,
    },
    images,
  };
}

function createPrismaForAdd(options: {
  product?: ReturnType<typeof createApprovedProduct> | null;
  ownerUserId?: string;
}) {
  const createMany = vi.fn();
  const productPayload =
    options.product === null
      ? null
      : (options.product ?? createApprovedProduct([]));

  const tx = {
    product: {
      findUnique: vi.fn().mockResolvedValue(productPayload),
    },
    productImage: { createMany },
  };
  const prisma = {
    product: {
      findUnique: vi.fn().mockResolvedValue(productPayload),
    },
    $transaction: vi.fn(
      async (callback: (client: typeof tx) => Promise<unknown>, config?: unknown) =>
        callback(tx),
    ),
  };

  return { prisma, tx, createMany };
}

describe('ImagesService', () => {
  beforeEach(() => {
    validateAndNormalizeProductImageUploads.mockReset();
    validateAndNormalizeProductImageUploads.mockResolvedValue([
      {
        buffer: Buffer.from('normalized'),
        mimeType: 'image/png',
        width: 1,
        height: 1,
      },
    ]);
  });

  it('rejects maxFiles overflow before normalize', async () => {
    const { prisma, createMany } = createPrismaForAdd({
      product: createApprovedProduct(
        Array.from({ length: productImageUploadLimitMax() }, (_, position) => ({
          position,
          byteLength: 1,
        })),
      ),
    });
    const service = new ImagesService(prisma as never);

    await expect(
      service.add('owner-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toThrow(
      `A Product can have at most ${productImageUploadLimitMax()} images`,
    );
    expect(validateAndNormalizeProductImageUploads).not.toHaveBeenCalled();
    expect(createMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not normalize when the seller profile is not approved', async () => {
    const { prisma } = createPrismaForAdd({
      product: createApprovedProduct([], 'PENDING'),
    });
    const service = new ImagesService(prisma as never);

    await expect(
      service.add('owner-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(validateAndNormalizeProductImageUploads).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not normalize when the caller is not the product owner', async () => {
    const { prisma } = createPrismaForAdd({
      product: createApprovedProduct([]),
    });
    const service = new ImagesService(prisma as never);

    await expect(
      service.add('other-user-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(validateAndNormalizeProductImageUploads).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('normalizes outside the transaction and persists inside a short serializable tx', async () => {
    const { prisma, createMany } = createPrismaForAdd({
      product: createApprovedProduct([]),
    });
    const service = new ImagesService(prisma as never);

    await service.add('owner-id', 'product-id', [
      { buffer: Buffer.from([1]), mimetype: 'image/png' },
    ]);

    expect(validateAndNormalizeProductImageUploads).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          mimeType: 'image/png',
          byteLength: Buffer.from('normalized').byteLength,
        }),
      ],
    });
  });

  it('does not expose approved Product media when the seller is suspended', async () => {
    const prisma = {
      productImage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'image-id',
          product: {
            status: 'APPROVED',
            sellerProfile: {
              userId: 'owner-id',
              status: 'SUSPENDED',
            },
            listings: [{ id: 'listing-id', status: 'LIVE' }],
          },
        }),
      },
    };
    const service = new ImagesService(prisma as never);

    await expect(service.get('image-id')).rejects.toThrow('Image not found');
    await expect(
      service.get('image-id', 'owner-id', 'user'),
    ).resolves.toMatchObject({
      id: 'image-id',
      isPublic: false,
    });
  });

  it('reorders images through temporary positions before final positions', async () => {
    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'DRAFT',
          sellerProfile: {
            userId: 'owner-id',
            status: 'APPROVED',
          },
          images: [
            { id: 'image-a', position: 0 },
            { id: 'image-b', position: 1 },
          ],
        }),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          productImage: {
            update,
          },
        } as never),
      ),
    };
    const service = new ImagesService(prisma as never);

    await service.reorder('owner-id', 'product-id', ['image-b', 'image-a']);

    expect(update.mock.calls.map(([args]) => args.data.position)).toEqual([
      2, 3, 0, 1,
    ]);
  });

  it('reindexes remaining images through temporary positions when removing one', async () => {
    const update = vi.fn().mockResolvedValue({});
    const deleteImage = vi.fn().mockResolvedValue({});
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: 'image-b' }, { id: 'image-c' }]);
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'DRAFT',
          sellerProfile: {
            userId: 'owner-id',
            status: 'APPROVED',
          },
          images: [
            { id: 'image-a', position: 0 },
            { id: 'image-b', position: 1 },
            { id: 'image-c', position: 2 },
          ],
        }),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          productImage: {
            findMany,
            delete: deleteImage,
            update,
          },
        } as never),
      ),
    };
    const service = new ImagesService(prisma as never);

    await service.remove('owner-id', 'product-id', 'image-a');

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(deleteImage).toHaveBeenCalledWith({ where: { id: 'image-a' } });
    expect(update.mock.calls.map(([args]) => args.data.position)).toEqual([
      3, 4, 0, 1,
    ]);
  });
});

function productImageUploadLimitMax(): number {
  return imagePolicy.productImageUploadLimits.maxFiles;
}

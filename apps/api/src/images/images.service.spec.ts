import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ImagesService,
  productImageAuthorizationSelect,
} from './images.service';
import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';
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
    id: 'product-id',
    editingRevisionId: 'revision-id',
    publishedRevisionId: null as string | null,
    status: 'DRAFT',
    sellerProfile: {
      userId: 'owner-id',
      status: sellerStatus,
    },
    listings: [] as Array<{ id: string }>,
    images,
    editingRevision: {
      status: 'DRAFT',
      images: images.map((image) => ({ position: image.position, image })),
    },
  };
}

function createPrismaForAdd(options: {
  product?: ReturnType<typeof createApprovedProduct> | null;
  ownerUserId?: string;
}) {
  const create = vi.fn().mockResolvedValue({ id: 'image-id' });
  const productPayload =
    options.product === null
      ? null
      : (options.product ?? createApprovedProduct([]));

  const tx = {
    $queryRaw: vi
      .fn()
      .mockResolvedValue(productPayload ? [{ id: 'product-id' }] : []),
    product: {
      findUnique: vi.fn().mockResolvedValue(productPayload),
    },
    productImage: { create, update: vi.fn() },
    productRevisionImage: { create: vi.fn() },
  };
  const prisma = {
    product: {
      findUnique: vi.fn().mockResolvedValue(productPayload),
    },
    $transaction: vi.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    ),
  };

  return { prisma, tx, create };
}

function projectSelected(
  select: Record<string, unknown>,
  value: unknown,
): unknown {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => projectSelected(select, item));
  }
  const source = value as Record<string, unknown>;
  const projected: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(select)) {
    if (spec === true) {
      projected[key] = source[key];
      continue;
    }
    if (
      spec &&
      typeof spec === 'object' &&
      'select' in spec &&
      spec.select &&
      typeof spec.select === 'object'
    ) {
      projected[key] = projectSelected(
        spec.select as Record<string, unknown>,
        source[key],
      );
    }
  }
  return projected;
}

const baselineProductImageAuthorizationSelect = {
  id: true,
  mimeType: true,
  revisions: { select: { revisionId: true } },
  product: {
    select: {
      status: true,
      publishedRevisionId: true,
      sellerProfile: {
        select: {
          userId: true,
          status: true,
          ...publicSellerProfileSelect,
        },
      },
    },
  },
};

function createImageStoreMock() {
  return {
    get: vi.fn(),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
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
    const { prisma, create } = createPrismaForAdd({
      product: createApprovedProduct(
        Array.from({ length: productImageUploadLimitMax() }, (_, position) => ({
          position,
          byteLength: 1,
        })),
      ),
    });
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await expect(
      service.add('owner-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toThrow(
      `A Product can have at most ${productImageUploadLimitMax()} images`,
    );
    expect(validateAndNormalizeProductImageUploads).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not normalize when the seller profile is not approved', async () => {
    const { prisma } = createPrismaForAdd({
      product: createApprovedProduct([], 'PENDING'),
    });
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

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
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await expect(
      service.add('other-user-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(validateAndNormalizeProductImageUploads).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('locks image writes when the Product is approved', async () => {
    const { prisma } = createPrismaForAdd({
      product: {
        ...createApprovedProduct([]),
        status: 'APPROVED',
        publishedRevisionId: 'revision-id',
        editingRevision: { status: 'APPROVED', images: [] },
      },
    });
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await expect(
      service.add('owner-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toThrow('Product images are locked');
    expect(validateAndNormalizeProductImageUploads).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('writes images only to an editable revision of an approved Product', async () => {
    const product = {
      ...createApprovedProduct([]),
      status: 'APPROVED',
      publishedRevisionId: 'published-revision',
      editingRevisionId: 'editing-revision',
      images: [{ id: 'published-image', position: 0, byteLength: 1 }],
      editingRevision: { status: 'DRAFT', images: [] },
    };
    const { prisma, tx } = createPrismaForAdd({ product });
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await service.add('owner-id', 'product-id', [
      { buffer: Buffer.from([1]), mimetype: 'image/png' },
    ]);

    expect(tx.productImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 1 }),
    });
    expect(tx.productRevisionImage.create).toHaveBeenCalledWith({
      data: {
        revisionId: 'editing-revision',
        imageId: 'image-id',
        position: 0,
      },
    });
  });

  it('allows image writes when the Product is rejected', async () => {
    const { prisma, tx, create } = createPrismaForAdd({
      product: { ...createApprovedProduct([]), status: 'REJECTED' },
    });
    const imageStore = createImageStoreMock();
    const service = new ImagesService(prisma as never, imageStore as never);

    await service.add('owner-id', 'product-id', [
      { buffer: Buffer.from([1]), mimetype: 'image/png' },
    ]);

    expect(validateAndNormalizeProductImageUploads).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.product.findUnique).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });

  it('normalizes outside the transaction and persists inside a short Read Committed tx', async () => {
    const { prisma, tx, create } = createPrismaForAdd({
      product: createApprovedProduct([]),
    });
    const imageStore = createImageStoreMock();
    const service = new ImagesService(prisma as never, imageStore as never);

    await service.add('owner-id', 'product-id', [
      { buffer: Buffer.from([1]), mimetype: 'image/png' },
    ]);

    expect(validateAndNormalizeProductImageUploads).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.product.findUnique).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mimeType: 'image/png',
        byteLength: Buffer.from('normalized').byteLength,
      }),
    });
    expect(tx.productRevisionImage.create).toHaveBeenCalledWith({
      data: {
        revisionId: 'revision-id',
        imageId: 'image-id',
        position: 0,
      },
    });
    expect(imageStore.put).toHaveBeenCalledWith(
      'product-image:image-id',
      {
        bytes: Buffer.from('normalized'),
        mimeType: 'image/png',
      },
      tx,
    );
  });

  it('does not expose approved Product media when the seller is suspended', async () => {
    const imageStore = createImageStoreMock();
    imageStore.get.mockResolvedValue({
      bytes: Uint8Array.from([1]),
      mimeType: 'image/png',
    });
    const prisma = {
      productImage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'image-id',
          mimeType: 'image/png',
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
    const service = new ImagesService(prisma as never, imageStore as never);

    await expect(service.get('image-id')).rejects.toThrow('Image not found');
    expect(imageStore.get).not.toHaveBeenCalled();

    await expect(
      service.get('image-id', 'owner-id', 'user'),
    ).resolves.toMatchObject({
      isPublic: false,
    });
    expect(imageStore.get).toHaveBeenCalledWith('product-image:image-id');
  });

  it('does not expose media that is absent from the published revision', async () => {
    const imageStore = createImageStoreMock();
    imageStore.get.mockResolvedValue({
      bytes: Uint8Array.from([1]),
      mimeType: 'image/png',
    });
    const prisma = {
      productImage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'image-id',
          mimeType: 'image/png',
          revisions: [{ revisionId: 'editing-revision' }],
          product: {
            status: 'APPROVED',
            publishedRevisionId: 'published-revision',
            sellerProfile: {
              userId: 'owner-id',
              status: 'APPROVED',
            },
          },
        }),
      },
    };
    const service = new ImagesService(prisma as never, imageStore as never);

    await expect(service.get('image-id')).rejects.toThrow('Image not found');
    expect(imageStore.get).not.toHaveBeenCalled();
    await expect(
      service.get('image-id', 'owner-id', 'user'),
    ).resolves.toMatchObject({ isPublic: false });
  });

  it('serves media that belongs to the published revision', async () => {
    const imageStore = createImageStoreMock();
    imageStore.get.mockResolvedValue({
      bytes: Uint8Array.from([1]),
      mimeType: 'image/png',
    });
    const prisma = {
      productImage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'image-id',
          mimeType: 'image/png',
          revisions: [{ revisionId: 'published-revision' }],
          product: {
            status: 'APPROVED',
            publishedRevisionId: 'published-revision',
            sellerProfile: {
              userId: 'owner-id',
              status: 'APPROVED',
            },
          },
        }),
      },
    };
    const service = new ImagesService(prisma as never, imageStore as never);

    await expect(service.get('image-id')).resolves.toMatchObject({
      isPublic: true,
    });
    expect(imageStore.get).toHaveBeenCalledWith('product-image:image-id');
  });

  it('authorizes product bytes without reading the public seller profile', async () => {
    const biography = `BIOGRAPHY_MARKER${'б'.repeat(80_000)}`;
    const storedBytes = Uint8Array.from([9, 8, 7]);
    const wideRow = {
      id: 'image-id',
      mimeType: 'image/jpeg',
      revisions: [{ revisionId: 'published-revision' }],
      product: {
        status: 'APPROVED',
        publishedRevisionId: 'published-revision',
        sellerProfile: {
          userId: 'owner-id',
          status: 'APPROVED',
          id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
          slug: 'seller-slug',
          sellerType: 'creator',
          discipline: 'Керамика',
          fullName: 'Seller',
          country: 'BY',
          city: 'Минск',
          practice: null,
          biography,
          socialLink: null,
          telegramUrl: null,
          instagramUrl: null,
          websiteUrl: null,
          publicEmail: null,
          shortDescription: 'Short',
          publishedRevision: {
            achievements: Array.from({ length: 12 }, (_, index) => ({
              id: `achievement-${index}`,
              occurredAt: null,
              occurredAtPrecision: null,
              body: `ACHIEVEMENT_MARKER${'а'.repeat(4_000)}`,
              mimeType: null,
              byteLength: null,
              checksum: null,
              objectKey: null,
            })),
          },
        },
      },
    };
    const narrowPayload = projectSelected(
      productImageAuthorizationSelect,
      wideRow,
    );
    const baselinePayload = projectSelected(
      baselineProductImageAuthorizationSelect,
      wideRow,
    );
    const narrowBytes = Buffer.byteLength(JSON.stringify(narrowPayload));
    const baselineBytes = Buffer.byteLength(JSON.stringify(baselinePayload));
    expect(narrowBytes).toBeLessThan(baselineBytes);
    expect(baselineBytes - narrowBytes).toBeGreaterThan(80_000);
    expect(JSON.stringify(narrowPayload).includes('BIOGRAPHY_MARKER')).toBe(
      false,
    );
    expect(JSON.stringify(narrowPayload).includes('ACHIEVEMENT_MARKER')).toBe(
      false,
    );
    expect(JSON.stringify(baselinePayload).includes('BIOGRAPHY_MARKER')).toBe(
      true,
    );

    const imageStore = createImageStoreMock();
    imageStore.get.mockResolvedValue({
      bytes: storedBytes,
      mimeType: 'image/png',
    });
    const findUnique = vi.fn(async (args: { select: Record<string, unknown> }) =>
      projectSelected(args.select, wideRow),
    );
    const service = new ImagesService(
      { productImage: { findUnique } } as never,
      imageStore as never,
    );

    await expect(service.get('image-id')).resolves.toEqual({
      mimeType: 'image/png',
      data: storedBytes,
      isPublic: true,
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'image-id' },
      select: productImageAuthorizationSelect,
    });
    expect(imageStore.get).toHaveBeenCalledWith('product-image:image-id');

    findUnique.mockClear();
    imageStore.get.mockClear();
    await expect(service.get('image-id', 'stranger-id', 'user')).resolves.toEqual({
      mimeType: 'image/png',
      data: storedBytes,
      isPublic: true,
    });

    const privateRow = {
      ...wideRow,
      revisions: [{ revisionId: 'editing-revision' }],
    };
    findUnique.mockImplementation(async (args: { select: Record<string, unknown> }) =>
      projectSelected(args.select, privateRow),
    );
    imageStore.get.mockClear();
    await expect(service.get('image-id')).rejects.toThrow('Image not found');
    await expect(service.get('image-id', 'stranger-id', 'user')).rejects.toThrow(
      'Image not found',
    );
    expect(imageStore.get).not.toHaveBeenCalled();
    await expect(service.get('image-id', 'owner-id', 'user')).resolves.toMatchObject({
      mimeType: 'image/png',
      data: storedBytes,
      isPublic: false,
    });
    await expect(service.get('image-id', 'admin-id', 'admin')).resolves.toMatchObject({
      isPublic: false,
    });

    const pendingProduct = {
      ...wideRow,
      product: { ...wideRow.product, status: 'PENDING_REVIEW' },
    };
    findUnique.mockImplementation(async (args: { select: Record<string, unknown> }) =>
      projectSelected(args.select, pendingProduct),
    );
    imageStore.get.mockClear();
    await expect(service.get('image-id')).rejects.toThrow('Image not found');
    await expect(service.get('image-id', 'owner-id', 'user')).resolves.toMatchObject({
      isPublic: false,
    });

    findUnique.mockResolvedValue(null);
    imageStore.get.mockClear();
    await expect(service.get('missing-id', 'owner-id', 'user')).rejects.toThrow(
      'Image not found',
    );
    expect(imageStore.get).not.toHaveBeenCalled();

    findUnique.mockImplementation(async (args: { select: Record<string, unknown> }) =>
      projectSelected(args.select, wideRow),
    );
    imageStore.get.mockResolvedValue(null);
    await expect(service.get('image-id', 'owner-id', 'admin')).rejects.toThrow(
      'Image not found',
    );
  });

  it('reorders images through temporary positions before final positions', async () => {
    const update = vi.fn().mockResolvedValue({});
    const productRow = {
      id: 'product-id',
      editingRevisionId: 'revision-id',
      status: 'DRAFT',
      sellerProfile: {
        userId: 'owner-id',
        status: 'APPROVED',
      },
      listings: [],
      images: [
        { id: 'image-a', position: 0 },
        { id: 'image-b', position: 1 },
      ],
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(productRow),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(productRow) },
          productImage: {
            update,
          },
          productRevisionImage: { update: vi.fn() },
        } as never),
      ),
    };
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await service.reorder('owner-id', 'product-id', ['image-b', 'image-a']);

    expect(update.mock.calls.map(([args]) => args.data.position)).toEqual([
      2, 3, 0, 1,
    ]);
  });

  it('reorders an approved Work draft without changing Product image positions', async () => {
    const productImageUpdate = vi.fn().mockResolvedValue({});
    const revisionImageUpdate = vi.fn().mockResolvedValue({});
    const productRow = {
      id: 'product-id',
      editingRevisionId: 'editing-revision',
      publishedRevisionId: 'published-revision',
      status: 'APPROVED',
      sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
      listings: [],
      images: [
        { id: 'published-image', position: 0, byteLength: 1 },
        { id: 'image-a', position: 1, byteLength: 1 },
        { id: 'image-b', position: 2, byteLength: 1 },
      ],
      editingRevision: {
        status: 'DRAFT',
        images: [
          {
            position: 0,
            image: { id: 'image-a', position: 1, byteLength: 1 },
          },
          {
            position: 1,
            image: { id: 'image-b', position: 2, byteLength: 1 },
          },
        ],
      },
    };
    const prisma = {
      product: { findUnique: vi.fn().mockResolvedValue(productRow) },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(productRow) },
          productImage: { update: productImageUpdate },
          productRevisionImage: { update: revisionImageUpdate },
        } as never),
      ),
    };
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await service.reorder('owner-id', 'product-id', ['image-b', 'image-a']);

    expect(productImageUpdate).not.toHaveBeenCalled();
    expect(revisionImageUpdate).toHaveBeenCalledTimes(4);
  });

  it('reindexes remaining images through temporary positions when removing one', async () => {
    const update = vi.fn().mockResolvedValue({});
    const deleteImage = vi.fn().mockResolvedValue({});
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: 'image-b' }, { id: 'image-c' }]);
    const productRow = {
      id: 'product-id',
      editingRevisionId: 'revision-id',
      status: 'DRAFT',
      sellerProfile: {
        userId: 'owner-id',
        status: 'APPROVED',
      },
      listings: [],
      images: [
        { id: 'image-a', position: 0 },
        { id: 'image-b', position: 1 },
        { id: 'image-c', position: 2 },
      ],
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(productRow),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(productRow) },
          productImage: {
            findMany,
            delete: deleteImage,
            update,
          },
          productRevisionImage: {
            deleteMany: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
            findMany: vi
              .fn()
              .mockResolvedValue([
                { imageId: 'image-b' },
                { imageId: 'image-c' },
              ]),
            update: vi.fn(),
          },
        } as never),
      ),
    };
    const imageStore = createImageStoreMock();
    const service = new ImagesService(prisma as never, imageStore as never);

    await service.remove('owner-id', 'product-id', 'image-a');

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(imageStore.delete).toHaveBeenCalledWith(
      'product-image:image-a',
      expect.anything(),
    );
    expect(deleteImage).toHaveBeenCalledWith({ where: { id: 'image-a' } });
    expect(update.mock.calls.map(([args]) => args.data.position)).toEqual([
      3, 4, 0, 1,
    ]);
  });

  it('reindexes remaining images from the locked set after a concurrent add', async () => {
    const update = vi.fn().mockResolvedValue({});
    const deleteImage = vi.fn().mockResolvedValue({});
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: 'image-b' }, { id: 'image-c' }]);
    const outerProduct = {
      id: 'product-id',
      editingRevisionId: 'revision-id',
      status: 'DRAFT',
      sellerProfile: {
        userId: 'owner-id',
        status: 'APPROVED',
      },
      listings: [],
      images: [
        { id: 'image-a', position: 0 },
        { id: 'image-b', position: 1 },
      ],
    };
    const lockedProduct = {
      ...outerProduct,
      images: [
        { id: 'image-a', position: 0 },
        { id: 'image-b', position: 1 },
        { id: 'image-c', position: 2 },
      ],
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(outerProduct),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(lockedProduct) },
          productImage: {
            findMany,
            delete: deleteImage,
            update,
          },
          productRevisionImage: {
            deleteMany: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
            findMany: vi
              .fn()
              .mockResolvedValue([
                { imageId: 'image-b' },
                { imageId: 'image-c' },
              ]),
            update: vi.fn(),
          },
        } as never),
      ),
    };
    const imageStore = createImageStoreMock();
    const service = new ImagesService(prisma as never, imageStore as never);

    await service.remove('owner-id', 'product-id', 'image-a');

    expect(update.mock.calls.map(([args]) => args.data.position)).toEqual([
      3, 4, 0, 1,
    ]);
  });

  it('does not delete when the image is gone after the Product row lock', async () => {
    const deleteImage = vi.fn().mockResolvedValue({});
    const outerProduct = {
      id: 'product-id',
      status: 'DRAFT',
      sellerProfile: {
        userId: 'owner-id',
        status: 'APPROVED',
      },
      listings: [],
      images: [
        { id: 'image-a', position: 0 },
        { id: 'image-b', position: 1 },
      ],
    };
    const lockedProduct = {
      ...outerProduct,
      images: [{ id: 'image-b', position: 0 }],
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(outerProduct),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(lockedProduct) },
          productImage: { delete: deleteImage },
        } as never),
      ),
    };
    const imageStore = createImageStoreMock();
    const service = new ImagesService(prisma as never, imageStore as never);

    await expect(
      service.remove('owner-id', 'product-id', 'image-a'),
    ).rejects.toThrow('Image not found');
    expect(deleteImage).not.toHaveBeenCalled();
    expect(imageStore.delete).not.toHaveBeenCalled();
  });

  it('rejects reorder when the locked image set no longer matches the request', async () => {
    const update = vi.fn().mockResolvedValue({});
    const outerProduct = {
      id: 'product-id',
      status: 'DRAFT',
      sellerProfile: {
        userId: 'owner-id',
        status: 'APPROVED',
      },
      listings: [],
      images: [
        { id: 'image-a', position: 0 },
        { id: 'image-b', position: 1 },
      ],
    };
    const lockedProduct = {
      ...outerProduct,
      images: [
        { id: 'image-a', position: 0 },
        { id: 'image-b', position: 1 },
        { id: 'image-c', position: 2 },
      ],
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(outerProduct),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(lockedProduct) },
          productImage: { update },
        } as never),
      ),
    };
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await expect(
      service.reorder('owner-id', 'product-id', ['image-b', 'image-a']),
    ).rejects.toThrow(
      'Image order must include every Product image exactly once',
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('persists creation step metadata and bytes in one transaction', async () => {
    const stepId = 'step-id';
    const order: string[] = [];
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'product-id',
          status: 'DRAFT',
          sellerProfile: {
            userId: 'owner-id',
            status: 'APPROVED',
          },
          listings: [],
          images: [],
        }),
      },
      productCreationStep: {
        update: vi.fn().mockImplementation(async () => {
          order.push('update');
          return { id: stepId };
        }),
        findFirst: vi.fn().mockResolvedValue({ id: stepId }),
      },
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'product-id',
          status: 'DRAFT',
          sellerProfile: {
            userId: 'owner-id',
            status: 'APPROVED',
          },
          listings: [],
          images: [],
        }),
      },
      productCreationStep: {
        findFirst: vi.fn().mockResolvedValue({ id: stepId }),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const imageStore = createImageStoreMock();
    imageStore.put.mockImplementation(async () => {
      order.push('put');
    });
    const service = new ImagesService(prisma as never, imageStore as never);

    validateAndNormalizeProductImageUploads.mockResolvedValue([
      {
        buffer: Buffer.from('step-image'),
        mimeType: 'image/jpeg',
        width: 100,
        height: 200,
      },
    ]);

    await service.addCreationStepImage('owner-id', 'product-id', stepId, {
      buffer: Buffer.from('raw'),
      mimetype: 'image/jpeg',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['update', 'put']);
    expect(imageStore.put).toHaveBeenCalledWith(
      'creation-step:step-id',
      {
        bytes: Buffer.from('step-image'),
        mimeType: 'image/jpeg',
      },
      tx,
    );
  });

  it('locks image writes when a scheduled or live Listing exists', async () => {
    const { prisma } = createPrismaForAdd({
      product: {
        ...createApprovedProduct([]),
        listings: [{ id: 'listing-id' }],
      },
    });
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await expect(
      service.add('owner-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toThrow('Product is locked by an active Listing');
    expect(validateAndNormalizeProductImageUploads).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('repeats the writable guard inside the persistence transaction', async () => {
    const { prisma, tx, create } = createPrismaForAdd({
      product: createApprovedProduct([]),
    });
    tx.product.findUnique.mockResolvedValue({
      ...createApprovedProduct([]),
      status: 'PENDING_REVIEW',
    });
    const imageStore = createImageStoreMock();
    const service = new ImagesService(prisma as never, imageStore as never);

    await expect(
      service.add('owner-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toThrow('Product images are locked');
    expect(validateAndNormalizeProductImageUploads).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
    expect(imageStore.put).not.toHaveBeenCalled();
  });
});

function productImageUploadLimitMax(): number {
  return imagePolicy.productImageUploadLimits.maxFiles;
}

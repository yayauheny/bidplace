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
  images: { id?: string; position: number; byteLength: number }[],
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
    editingRevision: {
      images: images.map((image, index) => ({
        position: image.position,
        image: {
          id: image.id ?? `image-${index}`,
          byteLength: image.byteLength,
        },
      })),
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
    $queryRaw: vi.fn().mockResolvedValue(
      productPayload ? [{ id: 'product-id' }] : [],
    ),
    product: {
      findUnique: vi.fn().mockResolvedValue(productPayload),
    },
    productImage: {
      create,
      update: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({ _max: { position: null } }),
    },
    productRevisionImage: { create: vi.fn() },
  };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(productPayload),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    return { prisma, tx, create };
}

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
    const service = new ImagesService(prisma as never, createImageStoreMock() as never);

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
    const service = new ImagesService(prisma as never, createImageStoreMock() as never);

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
    const service = new ImagesService(prisma as never, createImageStoreMock() as never);

    await expect(
      service.add('other-user-id', 'product-id', [
        { buffer: Buffer.from([1]), mimetype: 'image/png' },
      ]),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(validateAndNormalizeProductImageUploads).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('forks a published Product before adding images', async () => {
    const published = {
      ...createApprovedProduct([]),
      status: 'APPROVED',
      editingRevisionId: 'published-revision',
      publishedRevisionId: 'published-revision',
    };
    const create = vi.fn().mockResolvedValue({ id: 'image-id' });
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue(published),
        update: vi.fn(),
      },
      productImage: {
        create,
        update: vi.fn(),
        aggregate: vi.fn().mockResolvedValue({ _max: { position: 0 } }),
      },
      productRevision: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          version: 1,
          title: 'Work',
          story: null,
          categoryId: 'category-id',
          technique: null,
          materials: null,
          dimensions: null,
          weight: null,
          year: null,
          condition: null,
          uniqueness: null,
          provenance: null,
          city: null,
          packaging: null,
          deliveryInfo: null,
          creationIntro: null,
          images: [],
        }),
        create: vi.fn().mockResolvedValue({ id: 'editing-revision' }),
      },
      productRevisionImage: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(published),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new ImagesService(
      prisma as never,
      createImageStoreMock() as never,
    );

    await service.add('owner-id', 'product-id', [
      { buffer: Buffer.from([1]), mimetype: 'image/png' },
    ]);

    expect(tx.productRevision.create).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
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

  it('reorders only editing revision images', async () => {
    const update = vi.fn().mockResolvedValue({});
    const productRow = {
      ...createApprovedProduct([
        { id: 'image-a', position: 0, byteLength: 1 },
        { id: 'image-b', position: 1, byteLength: 1 },
      ]),
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(productRow),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(productRow) },
          productRevisionImage: { update },
        } as never),
      ),
    };
    const service = new ImagesService(prisma as never, createImageStoreMock() as never);

    await service.reorder('owner-id', 'product-id', ['image-b', 'image-a']);

    expect(update.mock.calls.map(([args]) => args.data.position)).toEqual([
      3, 4, 0, 1,
    ]);
  });

  it('does not delete an image object while another revision still references it', async () => {
    const deleteImage = vi.fn().mockResolvedValue({});
    const productRow = createApprovedProduct([
      { id: 'image-a', position: 0, byteLength: 1 },
      { id: 'image-b', position: 1, byteLength: 1 },
    ]);
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(productRow),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(productRow) },
          productImage: {
            delete: deleteImage,
          },
          productRevisionImage: {
            deleteMany: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
            findMany: vi.fn().mockResolvedValue([{ imageId: 'image-b' }]),
            update: vi.fn(),
          },
        } as never),
      ),
    };
    const imageStore = createImageStoreMock();
    const service = new ImagesService(prisma as never, imageStore as never);

    await service.remove('owner-id', 'product-id', 'image-a');

    expect(imageStore.delete).not.toHaveBeenCalled();
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it('deletes the image object when no revision references remain', async () => {
    const deleteImage = vi.fn().mockResolvedValue({});
    const productRow = createApprovedProduct([
      { id: 'image-a', position: 0, byteLength: 1 },
      { id: 'image-b', position: 1, byteLength: 1 },
      { id: 'image-c', position: 2, byteLength: 1 },
    ]);
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(productRow),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(productRow) },
          productImage: {
            delete: deleteImage,
          },
          productRevisionImage: {
            deleteMany: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
            findMany: vi.fn().mockResolvedValue([
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

    expect(imageStore.delete).toHaveBeenCalledWith('product-image:image-a');
    expect(deleteImage).toHaveBeenCalledWith({ where: { id: 'image-a' } });
  });

  it('reindexes remaining revision images from the locked set after a concurrent add', async () => {
    const revisionUpdate = vi.fn().mockResolvedValue({});
    const deleteImage = vi.fn().mockResolvedValue({});
    const outerProduct = createApprovedProduct([
      { id: 'image-a', position: 0, byteLength: 1 },
      { id: 'image-b', position: 1, byteLength: 1 },
    ]);
    const lockedProduct = createApprovedProduct([
      { id: 'image-a', position: 0, byteLength: 1 },
      { id: 'image-b', position: 1, byteLength: 1 },
      { id: 'image-c', position: 2, byteLength: 1 },
    ]);
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(outerProduct),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(lockedProduct) },
          productImage: {
            delete: deleteImage,
          },
          productRevisionImage: {
            deleteMany: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
            findMany: vi.fn().mockResolvedValue([
              { imageId: 'image-b' },
              { imageId: 'image-c' },
            ]),
            update: revisionUpdate,
          },
        } as never),
      ),
    };
    const imageStore = createImageStoreMock();
    const service = new ImagesService(prisma as never, imageStore as never);

    await service.remove('owner-id', 'product-id', 'image-a');

    expect(revisionUpdate.mock.calls.map(([args]) => args.data.position)).toEqual(
      [3, 4, 0, 1],
    );
  });

  it('does not delete when the image is gone after the Product row lock', async () => {
    const deleteImage = vi.fn().mockResolvedValue({});
    const outerProduct = createApprovedProduct([
      { id: 'image-a', position: 0, byteLength: 1 },
      { id: 'image-b', position: 1, byteLength: 1 },
    ]);
    const lockedProduct = createApprovedProduct([
      { id: 'image-b', position: 0, byteLength: 1 },
    ]);
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
    const outerProduct = createApprovedProduct([
      { id: 'image-a', position: 0, byteLength: 1 },
      { id: 'image-b', position: 1, byteLength: 1 },
    ]);
    const lockedProduct = createApprovedProduct([
      { id: 'image-a', position: 0, byteLength: 1 },
      { id: 'image-b', position: 1, byteLength: 1 },
      { id: 'image-c', position: 2, byteLength: 1 },
    ]);
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(outerProduct),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
          product: { findUnique: vi.fn().mockResolvedValue(lockedProduct) },
          productRevisionImage: { update },
        } as never),
      ),
    };
    const service = new ImagesService(prisma as never, createImageStoreMock() as never);

    await expect(
      service.reorder('owner-id', 'product-id', ['image-b', 'image-a']),
    ).rejects.toThrow(
      'Image order must include every editing revision image exactly once',
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
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
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

    await service.addCreationStepImage(
      'owner-id',
      'product-id',
      stepId,
      { buffer: Buffer.from('raw'), mimetype: 'image/jpeg' },
    );

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

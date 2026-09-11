import { describe, expect, it, vi } from 'vitest';
import { portfolioWorksQuerySchema } from '@bidplace/contracts';

import { ProductsService } from './products.service';
import {
  publicCatalogProductWhere,
  publicProductContentWhere,
} from './public-visibility';

const product = {
  id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
  publicId: 'publicId001',
  sellerProfileId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
  categoryId: null,
  title: null,
  story: null,
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
  status: 'DRAFT' as const,
  createdAt: new Date('2026-07-18T00:00:00.000Z'),
  updatedAt: new Date('2026-07-18T00:00:00.000Z'),
  images: [],
};

const approvedProduct = {
  ...product,
  categoryId: 'd0d82a10-3170-49eb-904f-a8bc87d311a8',
  title: 'Предмет',
  story: 'Описание предмета',
  condition: 'Новое',
  uniqueness: 'Единственный экземпляр',
  provenance: 'Создан автором',
  city: 'Минск',
  packaging: 'Защитная коробка',
  deliveryInfo: 'Условия передачи согласовываются после покупки',
  images: [
    {
      id: 'b0d82a10-3170-49eb-904f-a8bc87d311a6',
      position: 0,
      mimeType: 'image/png',
      byteLength: 10,
      checksum: 'a'.repeat(64),
      width: 1200,
      height: 1600,
    },
  ],
};

function publishedRevisionGallery() {
  const image = approvedProduct.images[0]!;
  return {
    title: approvedProduct.title,
    story: approvedProduct.story,
    categoryId: approvedProduct.categoryId,
    technique: approvedProduct.technique,
    materials: approvedProduct.materials,
    dimensions: approvedProduct.dimensions,
    year: approvedProduct.year,
    uniqueness: approvedProduct.uniqueness,
    images: [
      {
        position: 0,
        image: {
          id: image.id,
          mimeType: image.mimeType,
          byteLength: image.byteLength,
          checksum: image.checksum,
          width: image.width,
          height: image.height,
        },
      },
    ],
  };
}

function createWritePrisma(options: {
  product: Record<string, unknown> | null;
  responseProduct?: Record<string, unknown>;
  updateManyCount?: number;
  extraTx?: Record<string, unknown>;
}) {
  const tx = {
    $queryRaw: vi
      .fn()
      .mockResolvedValue(options.product ? [{ id: product.id }] : []),
    product: {
      findUnique: vi.fn().mockResolvedValue(options.product),
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValue(options.responseProduct ?? options.product),
      update: vi.fn().mockResolvedValue(options.responseProduct ?? options.product),
      updateMany: vi.fn().mockResolvedValue({
        count: options.updateManyCount ?? 1,
      }),
      create: vi.fn(),
    },
    auditEvent: { create: vi.fn() },
    productCreationStep: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    productRevision: { update: vi.fn() },
    ...options.extraTx,
  };
  const prisma = {
    $transaction: vi.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
    ),
  };
  return { prisma, tx };
}

function ownerProduct(
  status: 'DRAFT' | 'REJECTED' | 'PENDING_REVIEW' | 'APPROVED' | 'ARCHIVED',
  listings: Array<{ id: string }> = [],
) {
  return {
    id: product.id,
    editingRevisionId: 'revision-id',
    status,
    sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
    listings,
    title: approvedProduct.title,
    story: approvedProduct.story,
    categoryId: approvedProduct.categoryId,
    condition: approvedProduct.condition,
    uniqueness: approvedProduct.uniqueness,
    provenance: approvedProduct.provenance,
    city: approvedProduct.city,
    packaging: approvedProduct.packaging,
    deliveryInfo: approvedProduct.deliveryInfo,
    images: approvedProduct.images.map((image) => ({ id: image.id })),
  };
}

describe('ProductsService', () => {
  it('keeps public portfolio visibility independent from listings', () => {
    expect(publicCatalogProductWhere.sellerProfile).toEqual({
      status: 'APPROVED',
      city: { not: '' },
    });
    expect(publicCatalogProductWhere).not.toHaveProperty('listings');
    expect(publicCatalogProductWhere).toEqual(
      expect.objectContaining(publicProductContentWhere),
    );
    expect(publicProductContentWhere).toHaveProperty('publishedRevisionId', {
      not: null,
    });
  });

  it('retries a Product public ID collision without exposing the database error', async () => {
    const productCreate = vi
      .fn()
      .mockRejectedValueOnce({ code: 'P2002' })
      .mockResolvedValue(product);
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: product.sellerProfileId,
          status: 'APPROVED',
        }),
      },
      product: {
        create: productCreate,
        update: vi.fn().mockResolvedValue(product),
      },
      productRevision: { create: vi.fn().mockResolvedValue({ id: 'revision-id' }) },
      $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
        callback({
          product: {
            create: productCreate,
            update: prisma.product.update,
          },
          productRevision: prisma.productRevision,
        }),
      ),
    };
    const publicIds = {
      generate: vi
        .fn()
        .mockReturnValueOnce('collision001')
        .mockReturnValueOnce('publicId001'),
    };
    const service = new ProductsService(prisma as never, publicIds as never);

    const result = await service.create('owner-id', {});

    expect(result.product.publicId).toBe('publicId001');
    expect(publicIds.generate).toHaveBeenCalledTimes(2);
    expect(productCreate).toHaveBeenCalledTimes(2);
  });

  it('allows owner edits when a leftover scheduled Listing row exists', async () => {
    const { prisma, tx } = createWritePrisma({
      product: ownerProduct('DRAFT', [{ id: 'listing-id' }]),
      responseProduct: {
        ...approvedProduct,
        status: 'DRAFT',
        title: 'Unlocked',
      },
    });
    const service = new ProductsService(prisma as never, {} as never);

    await expect(
      service.update('owner-id', product.id, { title: 'Unlocked' }),
    ).resolves.toMatchObject({ product: expect.objectContaining({ title: 'Unlocked' }) });
    expect(tx.product.updateMany).toHaveBeenCalled();
  });

  it('allows the approved owner to edit a rejected Product', async () => {
    const { prisma, tx } = createWritePrisma({
      product: ownerProduct('REJECTED'),
      responseProduct: {
        ...approvedProduct,
        status: 'REJECTED',
        title: 'Corrected title',
      },
    });
    const service = new ProductsService(prisma as never, {} as never);

    const result = await service.update('owner-id', product.id, {
      title: 'Corrected title',
    });

    expect(result.product.id).toBe(product.id);
    expect(tx.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: product.id,
          status: { in: ['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'] },
        }),
        data: { title: 'Corrected title' },
      }),
    );
    expect(tx.productRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-id' },
      data: { title: 'Corrected title' },
    });
  });

  it('keeps pending-review Products locked for owner edits', async () => {
    const { prisma, tx } = createWritePrisma({
      product: ownerProduct('PENDING_REVIEW'),
    });
    const service = new ProductsService(prisma as never, {} as never);

    await expect(
      service.update('owner-id', product.id, { title: 'Locked' }),
    ).rejects.toThrow('Product cannot be edited');
    expect(tx.product.updateMany).not.toHaveBeenCalled();
  });

  it('does not fork an approved Work when the PATCH body is empty', async () => {
    const { prisma, tx } = createWritePrisma({
      product: {
        ...ownerProduct('APPROVED'),
        publishedRevisionId: 'revision-published',
        editingRevisionId: 'revision-published',
      },
      responseProduct: approvedProduct,
      extraTx: {
        productRevision: {
          create: vi.fn(),
          update: vi.fn(),
        },
      },
    });
    const service = new ProductsService(prisma as never, {} as never);

    await service.update('owner-id', product.id, {});

    expect(tx.productRevision.create).not.toHaveBeenCalled();
    expect(tx.productRevision.update).not.toHaveBeenCalled();
    expect(tx.product.updateMany).not.toHaveBeenCalled();
  });

  it('rejects hide and unhide for another user', async () => {
    const { prisma, tx } = createWritePrisma({
      product: {
        ...ownerProduct('APPROVED'),
        publishedRevisionId: 'revision-published',
        sellerProfile: { userId: 'other-id', status: 'APPROVED' },
      },
    });
    const service = new ProductsService(prisma as never, {} as never);

    await expect(service.hide('owner-id', product.id)).rejects.toThrow(
      'Product is not owned by user',
    );
    await expect(service.unhide('owner-id', product.id)).rejects.toThrow(
      'Product is not owned by user',
    );
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it('hides an approved Work from the public catalog without dropping its published revision', async () => {
    const current = {
      ...ownerProduct('APPROVED'),
      publishedRevisionId: 'revision-published',
    };
    const hidden = { ...approvedProduct, status: 'ARCHIVED' as const };
    const { prisma, tx } = createWritePrisma({
      product: current,
      responseProduct: hidden,
    });
    const service = new ProductsService(prisma as never, {} as never);

    const result = await service.hide('owner-id', product.id);

    expect(result.product.status).toBe('ARCHIVED');
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { status: 'ARCHIVED' },
    });
  });

  it('unhides an archived Work only when a published revision exists', async () => {
    const { prisma, tx } = createWritePrisma({
      product: {
        ...ownerProduct('ARCHIVED'),
        publishedRevisionId: null,
      },
    });
    const service = new ProductsService(prisma as never, {} as never);

    await expect(service.unhide('owner-id', product.id)).rejects.toThrow(
      'Product has no published revision',
    );
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it('hides an approved Work only when a published revision exists', async () => {
    const { prisma, tx } = createWritePrisma({
      product: ownerProduct('APPROVED'),
    });
    const service = new ProductsService(prisma as never, {} as never);

    await expect(service.hide('owner-id', product.id)).rejects.toThrow(
      'Product has no published revision',
    );
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it('projects public products from the published gallery even when live images exist', () => {
    const catalogProduct = {
      ...approvedProduct,
      status: 'APPROVED' as const,
      publishedAt: new Date('2026-07-19T00:00:00.000Z'),
      sellerProfileId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      editingRevisionId: null,
      publishedRevisionId: 'revision-published',
      sellerProfile: {
        id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
        slug: 'seller-slug',
        sellerType: 'creator' as const,
        discipline: 'Керамика',
        fullName: 'Seller',
        country: 'BY',
        city: 'Минск',
        practice: null,
        socialLink: 'https://example.com/seller',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Short',
      },
      publishedRevision: null,
    };
    const service = new ProductsService({} as never, {} as never);

    expect(service.toPortfolioItem(catalogProduct as never)).toBeNull();
  });

  it('omits portfolio items whose author city is blank', () => {
    const catalogProduct = {
      ...approvedProduct,
      status: 'APPROVED' as const,
      publishedAt: new Date('2026-07-19T00:00:00.000Z'),
      sellerProfileId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      editingRevisionId: null,
      publishedRevisionId: 'revision-published',
      sellerProfile: {
        id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
        slug: 'seller-slug',
        sellerType: 'creator' as const,
        discipline: 'Керамика',
        fullName: 'Seller',
        country: 'BY',
        city: '   ',
        practice: null,
        socialLink: 'https://example.com/seller',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Short',
      },
      publishedRevision: {
        title: 'Предмет',
        story: null,
        categoryId: approvedProduct.categoryId,
        technique: null,
        materials: null,
        dimensions: null,
        year: null,
        images: [
          {
            position: 0,
            image: {
              id: approvedProduct.images[0]!.id,
              mimeType: 'image/png',
              byteLength: 10,
              checksum: 'a'.repeat(64),
              width: 1200,
              height: 1600,
            },
          },
        ],
      },
    };
    const service = new ProductsService({} as never, {} as never);

    expect(service.toPortfolioItem(catalogProduct as never)).toBeNull();
  });

  it('lists RFC-minimal portfolio works from the published revision without a story', async () => {
    const catalogProduct = {
      ...approvedProduct,
      status: 'APPROVED' as const,
      publishedAt: new Date('2026-07-19T00:00:00.000Z'),
      story: null,
      uniqueness: null,
      provenance: null,
      city: null,
      deliveryInfo: null,
      sellerProfile: {
        id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
        slug: 'seller-slug',
        sellerType: 'creator' as const,
        discipline: 'Керамика',
        fullName: 'Seller',
        country: 'BY',
        city: 'Минск',
        practice: null,
        socialLink: 'https://example.com/seller',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Short',
      },
      publishedRevision: {
        title: 'Предмет',
        story: null,
        categoryId: approvedProduct.categoryId,
        technique: null,
        materials: null,
        dimensions: null,
        year: null,
        images: [
          {
            position: 0,
            image: {
              id: approvedProduct.images[0]!.id,
              mimeType: 'image/png',
              byteLength: 10,
              checksum: 'a'.repeat(64),
              width: 1200,
              height: 1600,
            },
          },
        ],
      },
    };
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValue([{ id: product.id, total: 1 }]),
      product: {
        findMany: vi.fn().mockResolvedValue([catalogProduct]),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);

    const result = await service.listPortfolio(
      portfolioWorksQuerySchema.parse({ sort: 'newest' }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.product.story).toBeNull();
    expect(result.items[0]?.product.images[0]?.id).toBe(
      approvedProduct.images[0]!.id,
    );
  });

  it('copies a published Product into an editing revision without changing its public fields', async () => {
    const publishedRevision = {
      id: 'revision-published',
      version: 1,
      status: 'APPROVED',
      categoryId: approvedProduct.categoryId,
      title: approvedProduct.title,
      story: approvedProduct.story,
      technique: null,
      materials: null,
      dimensions: null,
      weight: null,
      year: null,
      condition: approvedProduct.condition,
      uniqueness: approvedProduct.uniqueness,
      provenance: approvedProduct.provenance,
      city: approvedProduct.city,
      packaging: approvedProduct.packaging,
      deliveryInfo: approvedProduct.deliveryInfo,
      creationIntro: null,
      images: [{ imageId: approvedProduct.images[0]!.id, position: 0 }],
    };
    const published = {
      ...ownerProduct('APPROVED'),
      editingRevisionId: 'revision-published',
      publishedRevisionId: 'revision-published',
    };
    const response = { ...approvedProduct, status: 'APPROVED' as const };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: product.id }]),
      product: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(published)
          .mockResolvedValueOnce(response),
        findUniqueOrThrow: vi.fn().mockResolvedValue(response),
        update: vi.fn().mockResolvedValue(response),
        updateMany: vi.fn(),
      },
      productRevision: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(publishedRevision),
        create: vi.fn().mockResolvedValue({ id: 'revision-editing' }),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
      ),
    };
    const service = new ProductsService(prisma as never, {} as never);

    const result = await service.update('owner-id', product.id, {
      title: 'Исправленное название',
    });

    expect(result.product.title).toBe(approvedProduct.title);
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.productRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: product.id,
          version: 2,
          status: 'DRAFT',
          images: {
            createMany: {
              data: [{ imageId: approvedProduct.images[0]!.id, position: 0 }],
            },
          },
        }),
      }),
    );
    expect(tx.productRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-editing' },
      data: { title: 'Исправленное название' },
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { editingRevisionId: 'revision-editing' },
    });
  });

  it('resubmits a rejected Product to pending review without creating a duplicate', async () => {
    const pending = { ...approvedProduct, status: 'PENDING_REVIEW' as const };
    const { prisma, tx } = createWritePrisma({
      product: ownerProduct('REJECTED'),
      responseProduct: pending,
    });
    const service = new ProductsService(prisma as never, {} as never);

    const result = await service.submit('owner-id', product.id);

    expect(result.product.id).toBe(product.id);
    expect(result.product.status).toBe('PENDING_REVIEW');
    expect(tx.product.create).not.toHaveBeenCalled();
    expect(tx.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: product.id }),
        data: { status: 'PENDING_REVIEW' },
      }),
    );
    expect(tx.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: 'owner-id',
          targetType: 'PRODUCT',
          targetId: product.id,
          oldStatus: 'REJECTED',
          newStatus: 'PENDING_REVIEW',
          reason: null,
        }),
      }),
    );
  });

  it('submits an editing revision without changing an approved public Product', async () => {
    const current = {
      ...ownerProduct('APPROVED'),
      editingRevisionId: 'revision-editing',
      publishedRevisionId: 'revision-published',
    };
    const editingRevision = {
      status: 'DRAFT' as const,
      title: approvedProduct.title,
      story: approvedProduct.story,
      categoryId: approvedProduct.categoryId,
      condition: approvedProduct.condition,
      uniqueness: approvedProduct.uniqueness,
      provenance: approvedProduct.provenance,
      city: approvedProduct.city,
      packaging: approvedProduct.packaging,
      deliveryInfo: approvedProduct.deliveryInfo,
      images: [{ imageId: approvedProduct.images[0]!.id }],
    };
    const response = { ...approvedProduct, status: 'APPROVED' as const };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: product.id }]),
      product: {
        findUnique: vi.fn().mockResolvedValue(current),
        findUniqueOrThrow: vi.fn().mockResolvedValue(response),
        updateMany: vi.fn(),
      },
      productRevision: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(editingRevision),
        update: vi.fn(),
      },
      auditEvent: { create: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
      ),
    };

    const result = await new ProductsService(
      prisma as never,
      {} as never,
    ).submit('owner-id', product.id);

    expect(result.product.status).toBe('APPROVED');
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.productRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-editing' },
      data: expect.objectContaining({ status: 'PENDING_REVIEW' }),
    });
    expect(tx.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        oldStatus: 'DRAFT',
        newStatus: 'PENDING_REVIEW',
      }),
    });
  });

  it('denies submit for approved Products and other owners', async () => {
    const approved = createWritePrisma({
      product: ownerProduct('APPROVED'),
    });
    await expect(
      new ProductsService(approved.prisma as never, {} as never).submit(
        'owner-id',
        product.id,
      ),
    ).rejects.toThrow('Product cannot be submitted for review');

    const otherOwner = createWritePrisma({
      product: {
        ...ownerProduct('REJECTED'),
        sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
      },
    });
    await expect(
      new ProductsService(otherOwner.prisma as never, {} as never).submit(
        'other-id',
        product.id,
      ),
    ).rejects.toThrow('Product is not owned by user');
  });

  it('locks creation-story writes after submit but not because of leftover Listing rows', async () => {
    const pending = createWritePrisma({
      product: ownerProduct('PENDING_REVIEW'),
    });
    await expect(
      new ProductsService(pending.prisma as never, {} as never).replaceCreationStory(
        'owner-id',
        product.id,
        { intro: 'Intro', steps: [] },
      ),
    ).rejects.toThrow('Product creation story is locked');
    expect(pending.tx.product.updateMany).not.toHaveBeenCalled();

    const leftoverListing = createWritePrisma({
      product: ownerProduct('DRAFT', [{ id: 'listing-id' }]),
    });
    leftoverListing.tx.productCreationStep.findMany.mockResolvedValue([]);
    await expect(
      new ProductsService(
        leftoverListing.prisma as never,
        {} as never,
      ).replaceCreationStory('owner-id', product.id, {
        intro: 'Intro',
        steps: [],
      }),
    ).resolves.toBeDefined();
  });

  it('replaces creation story only after the in-transaction writable guard', async () => {
    const { prisma, tx } = createWritePrisma({
      product: ownerProduct('REJECTED'),
    });
    tx.productCreationStep.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const service = new ProductsService(prisma as never, {} as never);

    await service.replaceCreationStory('owner-id', product.id, {
      intro: 'How it was made',
      steps: [],
    });

    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { creationIntro: 'How it was made' },
      }),
    );
  });

  it('paginates portfolio catalog rows before hydrating published images', async () => {
    const publicProduct = {
      ...approvedProduct,
      status: 'APPROVED' as const,
      publishedAt: new Date('2026-07-19T00:00:00.000Z'),
      publishedRevision: publishedRevisionGallery(),
      sellerProfile: {
        id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
        slug: 'seller-slug',
        sellerType: 'creator',
        discipline: 'Керамика',
        fullName: 'Seller',
        country: 'BY',
        city: 'Минск',
        socialLink: 'https://example.com/seller',
        shortDescription: 'Short',
      },
    };
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ id: product.id, total: 2 }]),
      product: {
        findMany: vi.fn().mockResolvedValue([publicProduct]),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.listPortfolio(
      portfolioWorksQuerySchema.parse({ limit: 1, sort: 'newest' }),
    );

    const pageQuery = prisma.$queryRaw.mock.calls[0]?.[0] as { sql: unknown };
    const pageQueryText = String(pageQuery.sql);
    expect(pageQueryText).toContain('LIMIT');
    expect(pageQueryText).not.toContain('status_rank');
    expect(pageQueryText).not.toContain('"listings"');
    expect(pageQueryText).toContain('NULLIF(BTRIM(p."title"), \'\')');
    expect(pageQueryText).toContain('FROM "product_revision_images"');
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [product.id] } },
      }),
    );
  });

  it('orders newest portfolio works by publishedAt in the database query', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      product: { findMany: vi.fn() },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.listPortfolio(
      portfolioWorksQuerySchema.parse({ sort: 'newest' }),
    );

    const pageQuery = prisma.$queryRaw.mock.calls[0]?.[0] as { sql: unknown };
    expect(String(pageQuery.sql)).toContain('p."published_at" DESC NULLS LAST');
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('applies confirmed author filters in SQL', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      product: { findMany: vi.fn() },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.listPortfolio(
      portfolioWorksQuerySchema.parse({
        author: 'marina-k',
      }),
    );

    const pageQuery = prisma.$queryRaw.mock.calls[0]?.[0] as { sql: unknown };
    const pageQueryText = String(pageQuery.sql);
    expect(pageQueryText).toContain('sp."slug"');
    expect(pageQueryText).not.toContain('p."uniqueness"');
  });
});

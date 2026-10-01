import { describe, expect, it, vi } from 'vitest';
import { portfolioWorksQuerySchema } from '@bidplace/contracts';

import { ProductsService } from './products.service';
import {
  portfolioCatalogProductWhere,
  portfolioProductContentWhere,
} from './public-visibility';
import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';
import { portfolioCatalogProductSelect } from './products.mapper';

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

function createWritePrisma(options: {
  product: Record<string, unknown> | null;
  responseProduct?: Record<string, unknown>;
  updateManyCount?: number;
  extraTx?: Record<string, unknown>;
}) {
  const revision = {
    id: 'revision-id',
    version: 1,
    status: (options.product?.status as string | undefined) ?? 'DRAFT',
    categoryId: options.product?.categoryId ?? null,
    title: options.product?.title ?? null,
    story: options.product?.story ?? null,
    technique: null,
    materials: null,
    dimensions: null,
    weight: null,
    year: null,
    condition: options.product?.condition ?? null,
    uniqueness: options.product?.uniqueness ?? null,
    provenance: options.product?.provenance ?? null,
    city: options.product?.city ?? null,
    packaging: options.product?.packaging ?? null,
    deliveryInfo: options.product?.deliveryInfo ?? null,
    images: [],
    updatedAt: new Date('2026-07-18T00:00:00.000Z'),
  };
  const revisionForApproval = {
    ...revision,
    images:
      (options.product?.images as Array<{ id: string }> | undefined)
        ?.slice(0, 1)
        .map(({ id }) => ({ imageId: id })) ?? [],
  };
  const tx = {
    $queryRaw: vi
      .fn()
      .mockResolvedValue(options.product ? [{ id: product.id }] : []),
    product: {
      findUnique: vi.fn().mockResolvedValue(options.product),
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValue(options.responseProduct ?? options.product),
      update: vi
        .fn()
        .mockResolvedValue(options.responseProduct ?? options.product),
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
    productRevision: {
      findUniqueOrThrow: vi
        .fn()
        .mockImplementation((args) =>
          args.select?.images?.take === 1 ? revisionForApproval : revision,
        ),
      update: vi.fn().mockResolvedValue(revision),
    },
    ...options.extraTx,
  };
  const prisma = {
    $transaction: vi.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
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

function portfolioReadRow(input: {
  id: string;
  publicId: string;
  publishedAt: Date;
}) {
  return {
    id: input.id,
    publicId: input.publicId,
    publishedAt: input.publishedAt,
    sellerProfile: {
      id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      slug: 'seller-slug',
      sellerType: 'creator' as const,
      discipline: 'Керамика',
      fullName: 'Seller',
      country: 'BY',
      city: 'Минск',
      practice: null,
      biography: null,
      socialLink: null,
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      publicEmail: null,
      shortDescription: 'Short',
      publishedRevision: { achievements: [] },
    },
    publishedRevision: {
      title: input.publicId,
      story: null,
      categoryId: 'd0d82a10-3170-49eb-904f-a8bc87d311a8',
      technique: null,
      materials: null,
      dimensions: null,
      year: null,
      uniqueness: null,
      images: [
        {
          position: 0,
          image: {
            id: 'b0d82a10-3170-49eb-904f-a8bc87d311a6',
            mimeType: 'image/png',
            byteLength: 10,
            checksum: 'a'.repeat(64),
            width: null,
            height: null,
          },
        },
      ],
    },
  };
}

describe('ProductsService', () => {
  it('keeps public portfolio visibility independent from listings', () => {
    expect(portfolioCatalogProductWhere.sellerProfile).toEqual({
      status: 'APPROVED',
      city: { not: '' },
    });
    expect(portfolioCatalogProductWhere).not.toHaveProperty('listings');
    expect(portfolioCatalogProductWhere).toEqual(
      expect.objectContaining(portfolioProductContentWhere),
    );
    expect(portfolioProductContentWhere).toHaveProperty('publishedRevisionId', {
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
      productRevision: {
        create: vi.fn().mockResolvedValue({ id: 'revision-id' }),
      },
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

  it('rejects owner edits when a Product has a scheduled or live Listing', async () => {
    const { prisma, tx } = createWritePrisma({
      product: ownerProduct('DRAFT', [{ id: 'listing-id' }]),
    });
    const service = new ProductsService(prisma as never, {} as never);

    await expect(
      service.update('owner-id', product.id, { title: 'Locked' }),
    ).rejects.toThrow('Product is locked by an active Listing');
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'ReadCommitted' }),
    );
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
      select: expect.any(Object),
    });
  });

  it('keeps approved and pending-review Products locked for owner edits', async () => {
    for (const status of ['APPROVED', 'PENDING_REVIEW', 'ARCHIVED'] as const) {
      const { prisma, tx } = createWritePrisma({
        product: ownerProduct(status),
      });
      const service = new ProductsService(prisma as never, {} as never);

      await expect(
        service.update('owner-id', product.id, { title: 'Locked' }),
      ).rejects.toThrow('Product cannot be edited');
      expect(tx.product.updateMany).not.toHaveBeenCalled();
    }
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
        findUniqueOrThrow: vi
          .fn()
          .mockResolvedValueOnce(publishedRevision)
          .mockResolvedValueOnce({
            ...publishedRevision,
            id: 'revision-editing',
            status: 'DRAFT',
            images: [
              {
                position: 0,
                image: approvedProduct.images[0],
              },
            ],
          }),
        create: vi.fn().mockResolvedValue({ id: 'revision-editing' }),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new ProductsService(prisma as never, {} as never);

    const result = await service.update('owner-id', product.id, {
      title: 'Исправленное название',
    });

    expect(result.product.title).toBe(approvedProduct.title);
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.productRevision.create).toHaveBeenCalledWith({
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
    });
    expect(tx.productRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-editing' },
      data: { title: 'Исправленное название' },
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { editingRevisionId: 'revision-editing' },
    });
  });

  it('rejects edits to a submitted revision while keeping the published Work visible', async () => {
    const current = {
      ...ownerProduct('APPROVED'),
      editingRevisionId: 'revision-editing',
      publishedRevisionId: 'revision-published',
    };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: product.id }]),
      product: {
        findUnique: vi.fn().mockResolvedValue(current),
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      productRevision: {
        findUniqueOrThrow: vi
          .fn()
          .mockResolvedValue({ status: 'PENDING_REVIEW' }),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    await expect(
      new ProductsService(prisma as never, {} as never).update(
        'owner-id',
        product.id,
        { title: 'Too late' },
      ),
    ).rejects.toThrow('Product revision cannot be edited');
    expect(tx.productRevision.update).not.toHaveBeenCalled();
    expect(tx.product.updateMany).not.toHaveBeenCalled();
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
      title: 'Draft title',
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
    const submittedRevision = {
      id: 'revision-editing',
      version: 2,
      ...editingRevision,
      status: 'PENDING_REVIEW' as const,
      technique: null,
      materials: null,
      dimensions: null,
      weight: null,
      year: null,
      images: [
        {
          position: 0,
          image: approvedProduct.images[0],
        },
      ],
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
        findUniqueOrThrow: vi
          .fn()
          .mockResolvedValueOnce(editingRevision)
          .mockResolvedValueOnce(submittedRevision),
        update: vi.fn(),
      },
      auditEvent: { create: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    const result = await new ProductsService(
      prisma as never,
      {} as never,
    ).submit('owner-id', product.id);

    expect(result.product.status).toBe('APPROVED');
    expect(result.product.title).toBe('Draft title');
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

  it('keeps an approved Work revision locked by an active Listing', async () => {
    const current = {
      ...ownerProduct('APPROVED'),
      editingRevisionId: 'revision-editing',
      publishedRevisionId: 'revision-published',
      listings: [{ id: 'listing-id' }],
    };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: product.id }]),
      product: { findUnique: vi.fn().mockResolvedValue(current) },
      productRevision: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    await expect(
      new ProductsService(prisma as never, {} as never).submit(
        'owner-id',
        product.id,
      ),
    ).rejects.toThrow('Product is locked by an active Listing');
    expect(tx.productRevision.update).not.toHaveBeenCalled();
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

  it('locks creation-story writes after submit and when a Listing is live', async () => {
    const pending = createWritePrisma({
      product: ownerProduct('PENDING_REVIEW'),
    });
    await expect(
      new ProductsService(
        pending.prisma as never,
        {} as never,
      ).replaceCreationStory('owner-id', product.id, {
        intro: 'Intro',
        steps: [],
      }),
    ).rejects.toThrow('Product creation story is locked');
    expect(pending.tx.product.updateMany).not.toHaveBeenCalled();

    const listed = createWritePrisma({
      product: ownerProduct('DRAFT', [{ id: 'listing-id' }]),
    });
    await expect(
      new ProductsService(
        listed.prisma as never,
        {} as never,
      ).reorderCreationSteps('owner-id', product.id, []),
    ).rejects.toThrow('Product is locked by an active Listing');
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

  it('uses a narrow seller select for public portfolio queries', async () => {
    const publicProduct = {
      ...approvedProduct,
      status: 'APPROVED' as const,
      publishedAt: new Date('2026-07-19T00:00:00.000Z'),
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
      publishedRevision: {
        title: approvedProduct.title,
        story: approvedProduct.story,
        categoryId: approvedProduct.categoryId,
        technique: null,
        materials: null,
        dimensions: null,
        year: null,
        uniqueness: approvedProduct.uniqueness,
        images: [
          {
            position: 0,
            image: approvedProduct.images[0],
          },
        ],
      },
    };
    const prisma = {
      product: {
        findFirst: vi.fn().mockResolvedValue(publicProduct),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.getPortfolio('public-id');

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: portfolioCatalogProductSelect,
      }),
    );
    expect(portfolioCatalogProductSelect).not.toHaveProperty('images');
    expect(portfolioCatalogProductSelect).not.toHaveProperty('story');
    expect(portfolioCatalogProductSelect.sellerProfile.select).toBe(
      publicSellerProfileSelect,
    );
    expect(portfolioCatalogProductSelect.publishedRevision.select).not.toHaveProperty(
      'weight',
    );
  });

  it('paginates public catalog rows before hydrating narrow image metadata', async () => {
    const publicProduct = {
      ...approvedProduct,
      status: 'APPROVED' as const,
      publishedAt: new Date('2026-07-19T00:00:00.000Z'),
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
      publishedRevision: {
        title: approvedProduct.title,
        story: approvedProduct.story,
        categoryId: approvedProduct.categoryId,
        technique: null,
        materials: null,
        dimensions: null,
        year: null,
        uniqueness: approvedProduct.uniqueness,
        images: [
          {
            position: 0,
            image: approvedProduct.images[0],
          },
        ],
      },
    };
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValue([])
        .mockResolvedValueOnce([{ id: product.id, total: 2 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
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
    expect(pageQueryText).toContain('p."published_revision_id" IS NOT NULL');
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [product.id] } },
        select: portfolioCatalogProductSelect,
      }),
    );
    expect(
      portfolioCatalogProductSelect.publishedRevision.select.images.select.image
        .select,
    ).not.toHaveProperty('data');
  });

  it('orders newest public works by publishedAt in the database query', async () => {
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

  it('applies confirmed author and materials discovery filters in SQL', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      product: { findMany: vi.fn() },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.listPortfolio(
      portfolioWorksQuerySchema.parse({
        author: 'marina-k',
        materials: 'Clay',
      }),
    );

    const pageQuery = prisma.$queryRaw.mock.calls[0]?.[0] as { sql: unknown };
    const pageQueryText = String(pageQuery.sql);
    expect(pageQueryText).toContain('sp."slug"');
    expect(pageQueryText).toContain('published."materials"');
  });

  it('keeps published Work JSON and drops unread parent data', async () => {
    const parentStory = `PARENT_STORY_MARKER${'п'.repeat(60_000)}`;
    const publishedStory = 'Published story';
    const publishedImage = {
      id: 'b0d82a10-3170-49eb-904f-a8bc87d311a6',
      mimeType: 'image/png',
      byteLength: 10,
      checksum: 'a'.repeat(64),
      width: 1200,
      height: 1600,
    };
    const parentOnlyImage = {
      id: 'c0d82a10-3170-49eb-904f-a8bc87d311a7',
      mimeType: 'image/jpeg',
      byteLength: 99,
      checksum: 'b'.repeat(64),
      width: 10,
      height: 10,
    };
    const sellerProfile = {
      id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      slug: 'seller-slug',
      sellerType: 'creator' as const,
      discipline: 'Керамика',
      fullName: 'Seller',
      country: 'BY',
      city: 'Минск',
      practice: 'Студия',
      biography: `BIOGRAPHY_MARKER${'б'.repeat(40_000)}`,
      socialLink: 'https://example.com/seller',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      publicEmail: null,
      shortDescription: 'Short',
      publishedRevision: {
        achievements: [
          {
            id: 'f0d82a10-3170-49eb-904f-a8bc87d311a9',
            occurredAt: new Date('2020-05-01T00:00:00.000Z'),
            occurredAtPrecision: 'MONTH' as const,
            body: `ACHIEVEMENT_MARKER${'а'.repeat(8_000)}`,
            mimeType: null,
            byteLength: null,
            checksum: null,
            objectKey: null,
          },
        ],
      },
    };
    const publishedRevision = {
      title: 'Published title',
      story: publishedStory,
      categoryId: 'd0d82a10-3170-49eb-904f-a8bc87d311a8',
      technique: 'Published technique',
      materials: 'Published material',
      dimensions: '10 cm',
      year: 2024,
      uniqueness: ' published-unique ',
      images: [{ position: 0, image: publishedImage }],
    };
    const wideRow = {
      id: product.id,
      publicId: 'publicId001',
      sellerProfileId: product.sellerProfileId,
      categoryId: null,
      title: 'Parent title',
      story: parentStory,
      technique: 'Parent technique',
      materials: 'Parent material',
      dimensions: '99 cm',
      weight: '9 kg',
      year: 1999,
      condition: 'Parent condition',
      uniqueness: 'parent-unique',
      provenance: `PARENT_PROVENANCE_MARKER${'п'.repeat(20_000)}`,
      city: 'Parent city',
      packaging: 'Parent packaging',
      deliveryInfo: 'Parent delivery',
      creationIntro: `PARENT_INTRO_MARKER${'и'.repeat(20_000)}`,
      publishedAt: new Date('2026-07-19T00:00:00.000Z'),
      status: 'APPROVED' as const,
      editingRevisionId: 'editing-revision',
      publishedRevisionId: 'published-revision',
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      sellerProfile,
      images: [
        { ...parentOnlyImage, position: 0 },
        { ...publishedImage, position: 1 },
      ],
      publishedRevision,
    };
    const baselineSelect = {
      id: true,
      publicId: true,
      sellerProfileId: true,
      categoryId: true,
      title: true,
      story: true,
      technique: true,
      materials: true,
      dimensions: true,
      weight: true,
      year: true,
      condition: true,
      uniqueness: true,
      provenance: true,
      city: true,
      packaging: true,
      deliveryInfo: true,
      creationIntro: true,
      publishedAt: true,
      status: true,
      editingRevisionId: true,
      publishedRevisionId: true,
      createdAt: true,
      updatedAt: true,
      sellerProfile: { select: publicSellerProfileSelect },
      images: {
        orderBy: { position: 'asc' as const },
        select: {
          id: true,
          mimeType: true,
          byteLength: true,
          checksum: true,
          width: true,
          height: true,
          position: true,
        },
      },
      publishedRevision: {
        select: portfolioCatalogProductSelect.publishedRevision.select,
      },
    };
    const narrowPayload = projectSelected(
      portfolioCatalogProductSelect,
      wideRow,
    );
    const baselinePayload = projectSelected(baselineSelect, wideRow);
    const narrowBytes = Buffer.byteLength(JSON.stringify(narrowPayload));
    const baselineBytes = Buffer.byteLength(JSON.stringify(baselinePayload));
    expect(narrowBytes).toBeLessThan(baselineBytes);
    expect(baselineBytes - narrowBytes).toBeGreaterThan(90_000);
    expect(JSON.stringify(narrowPayload).includes('PARENT_STORY_MARKER')).toBe(
      false,
    );
    expect(JSON.stringify(narrowPayload).includes(parentOnlyImage.id)).toBe(
      false,
    );
    expect(JSON.stringify(baselinePayload).includes('PARENT_STORY_MARKER')).toBe(
      true,
    );

    const prisma = {
      product: {
        findFirst: vi.fn(async () => narrowPayload),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);
    const item = await service.getPortfolio('publicId001');
    const fromWide = service.toPortfolioItem(
      wideRow as unknown as Parameters<ProductsService['toPortfolioItem']>[0],
    );

    expect(item).toEqual(fromWide);
    expect(item?.product).toMatchObject({
      id: product.id,
      publicId: 'publicId001',
      title: 'Published title',
      story: publishedStory,
      categoryId: publishedRevision.categoryId,
      technique: 'Published technique',
      materials: 'Published material',
      dimensions: '10 cm',
      year: 2024,
      uniqueness: 'published-unique',
      publishedAt: '2026-07-19T00:00:00.000Z',
      images: [
        {
          id: publishedImage.id,
          position: 0,
          url: `/api/images/${publishedImage.id}`,
          mimeType: 'image/png',
          byteLength: 10,
          checksum: publishedImage.checksum,
          width: 1200,
          height: 1600,
        },
      ],
    });
    expect(item?.sellerProfile.biography).toContain('BIOGRAPHY_MARKER');
    expect(item?.sellerProfile.achievements).toHaveLength(1);
    expect(item?.sellerProfile.city).toBe('Минск');

    const incomplete = {
      ...wideRow,
      publishedRevision: { ...publishedRevision, images: [] },
    };
    expect(
      service.toPortfolioItem(
        projectSelected(
          portfolioCatalogProductSelect,
          incomplete,
        ) as unknown as Parameters<ProductsService['toPortfolioItem']>[0],
      ),
    ).toBeNull();
    expect(
      service.toPortfolioItem(
        projectSelected(portfolioCatalogProductSelect, {
          ...wideRow,
          publishedRevision: null,
        }) as unknown as Parameters<ProductsService['toPortfolioItem']>[0],
      ),
    ).toBeNull();
    expect(
      service.toPortfolioItem(
        projectSelected(portfolioCatalogProductSelect, {
          ...wideRow,
          sellerProfile: { ...sellerProfile, city: '   ' },
        }) as unknown as Parameters<ProductsService['toPortfolioItem']>[0],
      ),
    ).toBeNull();
  });

  it('keeps portfolio page order from the catalog query', async () => {
    const older = portfolioReadRow({
      id: 'a0d82a10-3170-49eb-904f-a8bc87d311a1',
      publicId: 'olderWork01',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = portfolioReadRow({
      id: 'a0d82a10-3170-49eb-904f-a8bc87d311a2',
      publicId: 'newerWork01',
      publishedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        { id: newer.id, total: 2 },
        { id: older.id, total: 2 },
      ]),
      product: {
        findMany: vi.fn().mockResolvedValue([older, newer]),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);

    const page = await service.listPortfolio(
      portfolioWorksQuerySchema.parse({ sort: 'newest', limit: 2 }),
    );

    expect(page.items.map((item) => item.product.publicId)).toEqual([
      'newerWork01',
      'olderWork01',
    ]);
    expect(page.pagination).toEqual({ page: 1, limit: 2, total: 2 });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: portfolioCatalogProductSelect }),
    );
  });

  it('refuses hide when a scheduled or live listing exists', async () => {
    const { prisma, tx } = createWritePrisma({
      product: {
        ...ownerProduct('APPROVED', [{ id: 'listing-id' }]),
        publishedRevisionId: 'published-revision-id',
      },
    });
    const service = new ProductsService(prisma as never, {} as never);

    await expect(service.hide('owner-id', product.id)).rejects.toThrow(
      'Work cannot be hidden while a scheduled or live listing exists',
    );
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });

  it('allows hide when no scheduled or live listing is locked', async () => {
    const { prisma, tx } = createWritePrisma({
      product: {
        ...ownerProduct('APPROVED'),
        publishedRevisionId: 'published-revision-id',
      },
      responseProduct: {
        ...approvedProduct,
        status: 'ARCHIVED',
        publicId: 'publicId001',
        sellerProfileId: product.sellerProfileId,
        publishedAt: new Date('2026-07-19T00:00:00.000Z'),
        editingRevisionId: 'revision-id',
        publishedRevisionId: 'published-revision-id',
      },
    });
    const service = new ProductsService(prisma as never, {} as never);

    await expect(service.hide('owner-id', product.id)).resolves.toMatchObject({
      product: { status: 'ARCHIVED' },
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { status: 'ARCHIVED' },
    });
    expect(tx.auditEvent.create).toHaveBeenCalled();
  });

  it('reads distinct published materials without collapsing case in SQL', async () => {
    const queryRaw = vi.fn().mockResolvedValue([
      { materials: 'Холст' },
      { materials: ' холст ' },
      { materials: '\t' },
    ]);
    const service = new ProductsService(
      { $queryRaw: queryRaw } as never,
      {} as never,
    );

    await expect(service.listPortfolioMaterialFacets()).resolves.toEqual([
      'Холст',
      ' холст ',
      '\t',
    ]);

    const sql = String(queryRaw.mock.calls[0]?.[0]?.sql);
    expect(sql).toContain('SELECT DISTINCT "materials"');
    expect(sql).toContain(`p."status" = 'APPROVED'`);
    expect(sql).toContain(`sp."status" = 'APPROVED'`);
    expect(sql).toContain('p."published_revision_id" IS NOT NULL');
    expect(sql).toContain('published."id" = p."published_revision_id"');
    expect(sql).toContain(`NULLIF(BTRIM(sp."city"), '') IS NOT NULL`);
    expect(sql).toContain(`NULLIF(BTRIM("materials"), '') IS NOT NULL`);
    expect(sql).not.toContain('LOWER(');
    expect(sql).not.toContain('unnest');
    expect(sql).not.toContain('SELECT "id"');
  });
});

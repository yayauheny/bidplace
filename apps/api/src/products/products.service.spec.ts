import { describe, expect, it, vi } from 'vitest';
import { publicDiscoveryQuerySchema } from '@bidplace/contracts';

import { ProductsService } from './products.service';
import {
  publicCatalogProductWhere,
  publicProductContentWhere,
  selectPublicListing,
} from './public-visibility';
import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';
import { productImageMetadataSelect } from './products.mapper';

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

describe('ProductsService', () => {
  it('keeps ended listings in the public catalog predicate', () => {
    expect(publicCatalogProductWhere.sellerProfile).toEqual({
      status: 'APPROVED',
    });
    expect(publicCatalogProductWhere.listings?.some?.status).toEqual({
      in: ['LIVE', 'SCHEDULED', 'ENDED'],
    });
    expect(publicCatalogProductWhere).toEqual(
      expect.objectContaining(publicProductContentWhere),
    );
  });

  it('selects a live listing over an older ended listing', () => {
    const ended = {
      id: 'ended',
      status: 'ENDED' as const,
      createdAt: new Date('2026-07-01'),
    };
    const live = {
      id: 'live',
      status: 'LIVE' as const,
      createdAt: new Date('2026-07-02'),
    };

    expect(selectPublicListing([ended, live])?.id).toBe('live');
  });

  it('retries a Product public ID collision without exposing the database error', async () => {
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: product.sellerProfileId,
          status: 'APPROVED',
        }),
      },
      product: {
        create: vi
          .fn()
          .mockRejectedValueOnce({ code: 'P2002' })
          .mockResolvedValue(product),
      },
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
    expect(prisma.product.create).toHaveBeenCalledTimes(2);
  });

  it('rejects owner edits when a Product has a scheduled or live Listing', async () => {
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'DRAFT',
          sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
          listings: [{ id: 'listing-id' }],
        }),
        update: vi.fn(),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await expect(
      service.update('owner-id', product.id, { title: 'Locked' }),
    ).rejects.toThrow('Product is locked by an active Listing');
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('allows the approved owner to edit a rejected Product', async () => {
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'REJECTED',
          sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
          listings: [],
        }),
        update: vi.fn().mockResolvedValue({
          ...approvedProduct,
          status: 'REJECTED',
          title: 'Corrected title',
        }),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);

    const result = await service.update('owner-id', product.id, {
      title: 'Corrected title',
    });

    expect(result.product.id).toBe(product.id);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: product.id },
        data: { title: 'Corrected title' },
      }),
    );
  });

  it('keeps approved and pending-review Products locked for owner edits', async () => {
    for (const status of ['APPROVED', 'PENDING_REVIEW', 'ARCHIVED'] as const) {
      const prisma = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            status,
            sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
            listings: [],
          }),
          update: vi.fn(),
        },
      };
      const service = new ProductsService(prisma as never, {} as never);

      await expect(
        service.update('owner-id', product.id, { title: 'Locked' }),
      ).rejects.toThrow('Product cannot be edited');
      expect(prisma.product.update).not.toHaveBeenCalled();
    }
  });

  it('resubmits a rejected Product to pending review without creating a duplicate', async () => {
    const rejected = {
      ...approvedProduct,
      status: 'REJECTED' as const,
      sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
    };
    const pending = { ...approvedProduct, status: 'PENDING_REVIEW' as const };
    const tx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: product.id,
          status: 'REJECTED',
        }),
        update: vi.fn().mockResolvedValue(pending),
      },
      auditEvent: { create: vi.fn() },
    };
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue(rejected),
        create: vi.fn(),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new ProductsService(prisma as never, {} as never);

    const result = await service.submit('owner-id', product.id);

    expect(result.product.id).toBe(product.id);
    expect(result.product.status).toBe('PENDING_REVIEW');
    expect(prisma.product.create).not.toHaveBeenCalled();
    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: product.id },
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

  it('denies submit for approved Products and other owners', async () => {
    const serviceForApproved = new ProductsService(
      {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            ...approvedProduct,
            status: 'APPROVED',
            sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
          }),
        },
      } as never,
      {} as never,
    );
    await expect(
      serviceForApproved.submit('owner-id', product.id),
    ).rejects.toThrow('Product cannot be submitted for review');

    const serviceForOtherOwner = new ProductsService(
      {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            ...approvedProduct,
            status: 'REJECTED',
            sellerProfile: { userId: 'owner-id', status: 'APPROVED' },
          }),
        },
      } as never,
      {} as never,
    );
    await expect(
      serviceForOtherOwner.submit('other-id', product.id),
    ).rejects.toThrow('Product is not owned by user');
  });

  it('uses a narrow seller select for public Product queries', async () => {
    const publicProduct = {
      ...approvedProduct,
      status: 'APPROVED' as const,
      publishedAt: null,
    };
    const prisma = {
      product: {
        findFirst: vi.fn().mockResolvedValue({
          ...publicProduct,
          sellerProfile: {
            id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
            slug: 'seller-slug',
            sellerType: 'creator',
            discipline: 'Керамика',
            fullName: 'Seller',
            country: 'BY',
            socialLink: 'https://example.com/seller',
            shortDescription: 'Short',
          },
          creationSteps: [],
          listings: [],
        }),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.getPublic('public-id');

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          sellerProfile: {
            select: publicSellerProfileSelect,
          },
          images: {
            orderBy: { position: 'asc' },
            select: productImageMetadataSelect,
          },
        }),
      }),
    );
    expect(productImageMetadataSelect).not.toHaveProperty('data');
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
        socialLink: 'https://example.com/seller',
        shortDescription: 'Short',
      },
      listings: [
        {
          id: 'c0d82a10-3170-49eb-904f-a8bc87d311a7',
          productId: product.id,
          status: 'LIVE' as const,
          startsAt: new Date('2026-07-19T00:00:00.000Z'),
          originalEndsAt: new Date('2026-07-20T00:00:00.000Z'),
          endsAt: new Date('2026-07-20T00:00:00.000Z'),
          currentPrice: { toNumber: () => 10 },
          bidCount: 1,
          closedAt: null,
          createdAt: new Date('2026-07-19T00:00:00.000Z'),
          updatedAt: new Date('2026-07-19T00:00:00.000Z'),
          auctionRules: { startPrice: { toNumber: () => 5 } },
        },
      ],
    };
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValue([])
        .mockResolvedValueOnce([{ id: product.id, total: 2 }])
        .mockResolvedValueOnce([{ status: 'LIVE', count: 1 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
      product: {
        findMany: vi.fn().mockResolvedValue([publicProduct]),
      },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.listPublic(
      publicDiscoveryQuerySchema.parse({ limit: 1, sort: 'endingSoon' }),
    );

    const pageQuery = prisma.$queryRaw.mock.calls[0]?.[0] as { sql: unknown };
    const pageQueryText = String(pageQuery.sql);
    expect(pageQueryText).toContain('LIMIT');
    expect(pageQueryText).toContain('p.status_rank ASC');
    expect(pageQueryText).toContain('status_rank');
    expect(pageQueryText).toContain('NULLIF(BTRIM(p."title"), \'\')');
    expect(pageQueryText).toContain('FROM "product_images"');
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [product.id] } },
        select: expect.objectContaining({
          images: expect.objectContaining({
            select: expect.not.objectContaining({ data: expect.anything() }),
          }),
        }),
      }),
    );
  });

  it('orders newest public works by publishedAt in the database query', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      product: { findMany: vi.fn() },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.listPublic(
      publicDiscoveryQuerySchema.parse({ sort: 'newest' }),
    );

    const pageQuery = prisma.$queryRaw.mock.calls[0]?.[0] as { sql: unknown };
    expect(String(pageQuery.sql)).toContain('p.published_at DESC NULLS LAST');
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('applies confirmed author and uniqueness discovery filters in SQL', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      product: { findMany: vi.fn() },
    };
    const service = new ProductsService(prisma as never, {} as never);

    await service.listPublic(
      publicDiscoveryQuerySchema.parse({
        author: 'marina-k',
        uniqueness: 'One',
      }),
    );

    const pageQuery = prisma.$queryRaw.mock.calls[0]?.[0] as { sql: unknown };
    const pageQueryText = String(pageQuery.sql);
    expect(pageQueryText).toContain('sp."slug"');
    expect(pageQueryText).toContain('p."uniqueness"');
  });
});

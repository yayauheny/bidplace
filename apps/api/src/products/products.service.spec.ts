import { describe, expect, it, vi } from 'vitest';

import { ProductsService } from './products.service';
import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';

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
  deliveryInfo: null,
  status: 'DRAFT' as const,
  createdAt: new Date('2026-07-18T00:00:00.000Z'),
  updatedAt: new Date('2026-07-18T00:00:00.000Z'),
  images: [],
};

describe('ProductsService', () => {
  it('retries a Product public ID collision without exposing the database error', async () => {
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: product.sellerProfileId,
          status: 'APPROVED',
        }),
      },
      product: {
        create: vi.fn()
          .mockRejectedValueOnce({ code: 'P2002' })
          .mockResolvedValue(product),
      },
    };
    const publicIds = { generate: vi.fn().mockReturnValueOnce('collision001').mockReturnValueOnce('publicId001') };
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

    await expect(service.update('owner-id', product.id, { title: 'Locked' }))
      .rejects.toThrow('Product is locked by an active Listing');
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('uses a narrow seller select for public Product queries', async () => {
    const publicProduct = {
      ...product,
      status: 'APPROVED' as const,
      publishedAt: null,
    };
    const prisma = {
      product: {
        findFirst: vi.fn().mockResolvedValue({
          ...publicProduct,
          sellerProfile: {
            slug: 'seller-slug',
            sellerType: 'creator',
            fullName: 'Seller',
            country: 'BY',
            socialLink: 'https://example.com/seller',
            shortDescription: 'Short',
          },
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
        }),
      }),
    );
  });
});

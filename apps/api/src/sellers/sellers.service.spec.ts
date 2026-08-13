import { describe, expect, it, vi } from 'vitest';

import { countPublicSellerStatuses, SellersService } from './sellers.service';
import { publicSellerProfileSelect } from './seller-profile.mapper';

describe('SellersService', () => {
  it('counts one public listing state per visible creator work', () => {
    expect(
      countPublicSellerStatuses([
        { listings: [{ status: 'LIVE' }] },
        { listings: [{ status: 'SCHEDULED' }] },
        { listings: [{ status: 'ENDED' }] },
        { listings: [] },
      ]),
    ).toEqual({ SCHEDULED: 1, LIVE: 1, ENDED: 1 });
  });

  it('maps a concurrent duplicate SellerProfile or slug to a conflict', async () => {
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
      },
    };
    const service = new SellersService(prisma as never, {} as never);

    await expect(
      service.create(
        'user-id',
        {
          slug: 'taken-slug',
          sellerType: 'creator',
          discipline: 'Керамика',
          fullName: 'Seller',
          country: 'BY',
          socialLink: 'https://example.com/seller',
          shortDescription: 'Description',
          handoffContactType: 'TELEGRAM',
          handoffContactValue: '@seller',
          handoffInitiator: 'BUYER_CONTACTS_SELLER',
        },
        { buffer: Buffer.from([1]), mimeType: 'image/png' },
      ),
    ).rejects.toThrow('Seller profile already exists or slug is already taken');
  });

  it.each(['PENDING_REVIEW', 'SUSPENDED'] as const)(
    'rejects edits while a SellerProfile is %s',
    async (status) => {
      const prisma = {
        sellerProfile: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'seller-profile-id',
            status,
            slug: 'seller-slug',
          }),
          update: vi.fn(),
        },
      };
      const service = new SellersService(prisma as never, {} as never);

      await expect(
        service.update('user-id', { fullName: 'Updated seller' }),
      ).rejects.toThrow('Seller profile cannot be edited');
      expect(prisma.sellerProfile.update).not.toHaveBeenCalled();
    },
  );

  it('allows edits only when SellerProfile is CHANGES_REQUESTED', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          status: 'CHANGES_REQUESTED',
          slug: 'seller-slug',
        }),
        update: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
          slug: 'seller-slug',
          fullName: 'Updated seller',
          sellerType: 'creator',
          discipline: 'Керамика',
          country: 'BY',
          socialLink: 'https://example.com/seller',
          shortDescription: 'Updated description',
          handoffContactType: 'TELEGRAM',
          handoffContactValue: '@seller',
          handoffInitiator: 'BUYER_CONTACTS_SELLER',
          status: 'CHANGES_REQUESTED',
          createdAt: now,
          updatedAt: now,
        }),
      },
    };
    const service = new SellersService(prisma as never, {} as never);

    const result = await service.update('user-id', {
      fullName: 'Updated seller',
    });

    expect(prisma.sellerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5' },
        data: expect.objectContaining({ fullName: 'Updated seller' }),
      }),
    );
    expect(result.sellerProfile.fullName).toBe('Updated seller');
  });

  it('uses a narrow seller select for public SellerProfile pages', async () => {
    const prisma = {
      sellerProfile: {
        findFirst: vi.fn().mockResolvedValue({
          slug: 'seller-slug',
          sellerType: 'creator',
          discipline: 'Керамика',
          fullName: 'Seller',
          country: 'BY',
          socialLink: 'https://example.com/seller',
          shortDescription: 'Short',
        }),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
      product: { findMany: vi.fn() },
    };
    const service = new SellersService(
      prisma as never,
      {
        toPublicProduct: vi.fn(),
      } as never,
    );

    const result = await service.getPublic('seller-slug');

    expect(result.statusCounts).toEqual({ SCHEDULED: 0, LIVE: 0, ENDED: 0 });

    expect(prisma.sellerProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: publicSellerProfileSelect,
      }),
    );
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
  });

  it('hydrates the owner product detail with persisted creation history', async () => {
    const prisma = {
      product: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          publicId: 'publicId001',
          sellerProfileId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
          categoryId: null,
          title: 'Work',
          story: 'Story',
          technique: null,
          materials: null,
          dimensions: null,
          weight: null,
          year: null,
          condition: 'New',
          uniqueness: 'One',
          provenance: 'Studio',
          city: 'Minsk',
          packaging: 'Protective box',
          deliveryInfo: 'Pickup',
          publishedAt: null,
          status: 'DRAFT',
          createdAt: new Date('2026-07-18T00:00:00.000Z'),
          updatedAt: new Date('2026-07-18T00:00:00.000Z'),
          images: [],
          creationIntro: 'Persisted intro',
          creationSteps: [
            {
              id: '2f8fc6d7-4c7a-4f9e-9f75-b8eafed0c2b1',
              position: 0,
              title: 'Sketch',
              body: 'First sketch',
              mimeType: 'image/png',
              byteLength: 4,
              checksum: '1'.repeat(64),
              width: 2,
              height: 2,
            },
          ],
        }),
      },
    };
    const service = new SellersService(prisma as never, {} as never);

    const result = await service.getProduct(
      'owner-id',
      'a0d82a10-3170-49eb-904f-a8bc87d311a5',
    );

    expect(result.creationIntro).toBe('Persisted intro');
    expect(result.creationSteps[0]?.image?.url).toBe(
      '/api/creation-steps/2f8fc6d7-4c7a-4f9e-9f75-b8eafed0c2b1/image',
    );
    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          sellerProfile: { userId: 'owner-id' },
        },
      }),
    );
  });
});

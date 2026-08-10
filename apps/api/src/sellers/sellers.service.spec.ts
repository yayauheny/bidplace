import { describe, expect, it, vi } from 'vitest';

import { SellersService } from './sellers.service';
import { publicSellerProfileSelect } from './seller-profile.mapper';

describe('SellersService', () => {
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
          fullName: 'Seller',
          country: 'BY',
          socialLink: 'https://example.com/seller',
          shortDescription: 'Short',
          products: [],
        }),
      },
    };
    const service = new SellersService(
      prisma as never,
      {
        toPublicProduct: vi.fn(),
      } as never,
    );

    await service.getPublic('seller-slug');

    expect(prisma.sellerProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          products: expect.objectContaining({
            include: expect.objectContaining({
              listings: expect.objectContaining({
                where: {
                  status: { in: ['LIVE', 'SCHEDULED', 'ENDED'] },
                },
              }),
            }),
          }),
        }),
      }),
    );
    expect(prisma.sellerProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          products: expect.objectContaining({
            include: expect.objectContaining({
              sellerProfile: {
                select: publicSellerProfileSelect,
              },
            }),
          }),
        }),
      }),
    );
  });
});

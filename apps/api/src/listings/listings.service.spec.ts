import { describe, expect, it, vi } from 'vitest';

import { ListingsService } from './listings.service';
import {
  sellerProfileAuthSelect,
  sellerProfileHandoffSelect,
} from '../sellers/seller-profile.mapper';

describe('ListingsService', () => {
  it('omits internal auction rules fields from create responses', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'APPROVED',
          sellerProfile: { userId: 'seller-id', status: 'APPROVED' },
        }),
      },
      listing: {
        create: vi.fn().mockResolvedValue({
          id: '11111111-1111-4111-8111-111111111111',
          productId: '22222222-2222-4222-8222-222222222222',
          type: 'AUCTION',
          status: 'DRAFT',
          currency: 'BYN',
          startsAt: now,
          originalEndsAt: now,
          endsAt: now,
          currentPrice: { toNumber: () => 10 },
          bidCount: 0,
          closedAt: null,
          createdAt: now,
          updatedAt: now,
          auctionRules: {
            id: '33333333-3333-4333-8333-333333333333',
            listingId: '11111111-1111-4111-8111-111111111111',
            startPrice: { toNumber: () => 10 },
            incrementPolicyCode: 'MVP_BYN_V1',
            softCloseWindowSeconds: 60,
            softCloseExtensionSeconds: 60,
            softCloseMaxTotalSeconds: 600,
            createdAt: now,
            updatedAt: now,
          },
        }),
      },
    };
    const service = new ListingsService(prisma as never);

    const result = await service.create('seller-id', 'product-id', {
      startsAt: '2026-07-24T01:00:00.000Z',
      endsAt: '2026-07-24T02:00:00.000Z',
      startPrice: 10,
    });

    expect(result.listing.auctionRules).toMatchObject({
      startPrice: 10,
      incrementPolicyCode: 'MVP_BYN_V1',
      softCloseWindowSeconds: 60,
      softCloseExtensionSeconds: 60,
      softCloseMaxTotalSeconds: 600,
    });
    expect(result.listing.auctionRules).not.toHaveProperty('id');
    expect(result.listing.auctionRules).not.toHaveProperty('listingId');
    expect(result.listing.auctionRules).not.toHaveProperty('createdAt');
    expect(result.listing.auctionRules).not.toHaveProperty('updatedAt');
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      select: {
        status: true,
        sellerProfile: { select: sellerProfileAuthSelect },
      },
    });
  });

  it('does not expose an internal Listing to another user', async () => {
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          product: { sellerProfile: { userId: 'seller-id' } },
          auctionRules: null,
        }),
      },
    };
    const service = new ListingsService(prisma as never);

    await expect(service.get('other-user', 'user', 'listing-id'))
      .rejects.toThrow('Listing is not available');
    expect(prisma.listing.findUnique).toHaveBeenCalledWith({
      where: { id: 'listing-id' },
      include: {
        auctionRules: true,
        product: {
          include: {
            sellerProfile: { select: sellerProfileHandoffSelect },
          },
        },
      },
    });
  });

  it('omits nested Product from listing responses', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          id: '11111111-1111-4111-8111-111111111111',
          productId: '22222222-2222-4222-8222-222222222222',
          type: 'AUCTION',
          status: 'DRAFT',
          currency: 'BYN',
          startsAt: now,
          originalEndsAt: now,
          endsAt: now,
          currentPrice: { toNumber: () => 10 },
          bidCount: 0,
          closedAt: null,
          createdAt: now,
          updatedAt: now,
          auctionRules: {
            startPrice: { toNumber: () => 10 },
            incrementPolicyCode: 'MVP_BYN_V1',
            softCloseWindowSeconds: 60,
            softCloseExtensionSeconds: 60,
            softCloseMaxTotalSeconds: 600,
          },
          product: {
            sellerProfile: {
              userId: 'seller-id',
              handoffContactValue: '+375291234567',
            },
          },
        }),
      },
    };
    const service = new ListingsService(prisma as never);

    const result = await service.get('seller-id', 'user', 'listing-id');

    expect(result.listing).not.toHaveProperty('product');
  });
});

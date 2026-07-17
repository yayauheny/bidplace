import { ConflictException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@bidplace/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sellerProfileContractSelect } from './seller-profile.mapper';
import { SellersService, type SellersRepository } from './sellers.service';

type SellerProfileRecord = {
  id: string;
  userId: string;
  slug: string;
  sellerType: 'creator' | 'influencer';
  storeName: string;
  country: string;
  contactPreference: string;
  socialLink: string | null;
  shortDescription: string | null;
  status: 'draft' | 'active' | 'restricted' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
};

type PublicAuctionRecord = {
  id: string;
  lotId: string;
  sellerProfileId: string;
  slug: string;
  startPrice: Decimal;
  reservePrice: Decimal;
  currentPrice: Decimal;
  currency: string;
  bidStep: Decimal;
  startsAt: Date;
  endsAt: Date;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  lot: {
    id: string;
    sellerProfileId: string;
    categoryId: string;
    title: string;
    description: string;
    condition: string;
    lotImages: Array<{ id: string; position: number }>;
    status: 'draft' | 'published' | 'sold' | 'hidden' | 'archived';
    createdAt: Date;
    updatedAt: Date;
  };
  sellerProfile: SellerProfileRecord;
};

function createSellerProfileRecord(
  overrides: Partial<SellerProfileRecord> = {},
): SellerProfileRecord {
  return {
    id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
    userId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    slug: 'demo-seller',
    sellerType: 'creator',
    storeName: 'Demo Store',
    country: 'BY',
    contactPreference: 'telegram',
    socialLink: 'https://example.com',
    shortDescription: 'Short bio',
    status: 'active',
    createdAt: new Date('2026-07-13T12:00:00.000Z'),
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

function createPublicAuctionRecord(
  overrides: Partial<PublicAuctionRecord> = {},
): PublicAuctionRecord {
  const decimal = (value: number | string) => new Decimal(value);

  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a3333',
    sellerProfileId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
    slug: 'demo-auction',
    startPrice: decimal(100),
    reservePrice: decimal(150),
    currentPrice: decimal(120),
    currency: 'USD',
    bidStep: decimal(5),
    startsAt: new Date('2026-07-17T13:00:00.000Z'),
    endsAt: new Date('2026-07-18T13:00:00.000Z'),
    status: 'active',
    bidCount: 1,
    winnerBidId: null,
    buyNowPrice: null,
    createdAt: new Date('2026-07-17T12:00:00.000Z'),
    updatedAt: new Date('2026-07-17T12:00:00.000Z'),
    lot: {
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a3333',
      sellerProfileId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
      title: 'Signed Ceramic Vase',
      description: 'Handmade ceramic vase.',
      condition: 'excellent',
      lotImages: [{ id: '9cb88056-f0dc-4309-84e4-090af8ace1e2', position: 0 }],
      status: 'published',
      createdAt: new Date('2026-07-17T12:00:00.000Z'),
      updatedAt: new Date('2026-07-17T12:00:00.000Z'),
    },
    sellerProfile: createSellerProfileRecord(),
    ...overrides,
  };
}

describe('SellersService', () => {
  const prisma = {
    sellerProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auction: {
      findMany: vi.fn(),
    },
  } satisfies SellersRepository;

  const service = new SellersService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a seller profile and activates it', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(null);
    prisma.sellerProfile.create.mockResolvedValue(
      createSellerProfileRecord({
        slug: 'new-seller',
      }),
    );

    const result = await service.createProfile(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      {
        slug: 'new-seller',
        sellerType: 'creator',
        storeName: 'New Seller',
        country: 'BY',
        contactPreference: 'telegram',
        socialLink: 'https://example.com',
        shortDescription: 'Short bio',
      },
    );

    expect(prisma.sellerProfile.create).toHaveBeenCalledWith({
      data: {
        userId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        slug: 'new-seller',
        sellerType: 'creator',
        storeName: 'New Seller',
        country: 'BY',
        contactPreference: 'telegram',
        socialLink: 'https://example.com',
        shortDescription: 'Short bio',
        status: 'active',
      },
      select: sellerProfileContractSelect,
    });
    expect(result.sellerProfile.slug).toBe('new-seller');
    expect(result.sellerProfile.status).toBe('active');
  });

  it('rejects duplicate seller profiles for the same user', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(createSellerProfileRecord());

    await expect(
      service.createProfile('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', {
        slug: 'new-seller',
        sellerType: 'creator',
        storeName: 'New Seller',
        country: 'BY',
        contactPreference: 'telegram',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates an existing seller profile', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(
      createSellerProfileRecord(),
    );
    prisma.sellerProfile.update.mockResolvedValue(
      createSellerProfileRecord({
        slug: 'updated-seller',
        storeName: 'Updated Store',
      }),
    );

    const result = await service.updateProfile(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      {
        slug: 'updated-seller',
        storeName: 'Updated Store',
      },
    );

    expect(prisma.sellerProfile.update).toHaveBeenCalledWith({
      where: {
        userId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
      data: {
        slug: 'updated-seller',
        storeName: 'Updated Store',
      },
      select: sellerProfileContractSelect,
    });
    expect(result.sellerProfile.slug).toBe('updated-seller');
  });

  it('rejects updates when the seller profile does not exist', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.updateProfile('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', {
        slug: 'updated-seller',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the current seller profile even when it is not public', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(
      createSellerProfileRecord({
        status: 'draft',
      }),
    );

    const result = await service.getMyProfile(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    );

    expect(result.sellerProfile.status).toBe('draft');
  });

  it('returns public active seller profiles by slug', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(
      createSellerProfileRecord(),
    );

    const result = await service.getPublicProfile('demo-seller');

    expect(result.sellerProfile.slug).toBe('demo-seller');
  });

  it('returns public seller detail with public auctions', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(createSellerProfileRecord());
    prisma.auction.findMany.mockResolvedValue([createPublicAuctionRecord()]);

    const result = await service.getPublicDetail('demo-seller');

    expect(prisma.auction.findMany).toHaveBeenCalledWith({
      where: {
        sellerProfileId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        status: {
          in: ['scheduled', 'active'],
        },
        lot: {
          status: 'published',
        },
      },
      select: expect.any(Object),
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
    });
    expect(result.sellerProfile.slug).toBe('demo-seller');
    expect(result.auctions).toHaveLength(1);
    expect(result.auctions[0]?.sellerProfile.slug).toBe('demo-seller');
  });

  it('hides non-active seller profiles from public access', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(
      createSellerProfileRecord({
        status: 'draft',
      }),
    );

    await expect(service.getPublicProfile('demo-seller')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

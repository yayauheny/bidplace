import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../core/database';
import { SellersService } from './sellers.service';

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

describe('SellersService', () => {
  const prisma = {
    sellerProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const service = new SellersService(prisma as unknown as PrismaService);

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
        sellerType: undefined,
        storeName: 'Updated Store',
        country: undefined,
        contactPreference: undefined,
        socialLink: undefined,
        shortDescription: undefined,
      },
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

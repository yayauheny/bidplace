import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../core/database';
import { LotsService } from './lots.service';

type LotRecord = {
  id: string;
  sellerProfileId: string;
  categoryId: string;
  title: string;
  description: string;
  condition: string;
  images: string[];
  status: 'draft' | 'published' | 'sold' | 'hidden' | 'archived';
  createdAt: Date;
  updatedAt: Date;
};

function createLotRecord(overrides: Partial<LotRecord> = {}): LotRecord {
  return {
    id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a2222',
    sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
    categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
    title: 'Signed Ceramic Vase',
    description: 'Handmade ceramic vase.',
    condition: 'excellent',
    images: ['/uploads/lots/vase.jpg'],
    status: 'draft',
    createdAt: new Date('2026-07-13T12:00:00.000Z'),
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

describe('LotsService', () => {
  const prisma = {
    sellerProfile: {
      findUnique: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    lot: {
      create: vi.fn(),
    },
  };

  const service = new LotsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a draft lot for an active seller', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.category.findUnique.mockResolvedValue({
      id: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
    });
    prisma.lot.create.mockResolvedValue(createLotRecord());

    const result = await service.createLot(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      {
        categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
        title: 'Signed Ceramic Vase',
        description: 'Handmade ceramic vase.',
        condition: 'excellent',
      },
      ['/uploads/lots/vase.jpg'],
    );

    expect(prisma.lot.create).toHaveBeenCalledWith({
      data: {
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
        title: 'Signed Ceramic Vase',
        description: 'Handmade ceramic vase.',
        condition: 'excellent',
        images: ['/uploads/lots/vase.jpg'],
        status: 'draft',
      },
    });
    expect(result.lot.status).toBe('draft');
    expect(result.lot.images).toHaveLength(1);
  });

  it('rejects lot creation when the seller profile is missing', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.createLot(
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        {
          categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
          title: 'Signed Ceramic Vase',
          description: 'Handmade ceramic vase.',
          condition: 'excellent',
        },
        [],
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects lot creation when the seller profile is not active', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'draft',
    });

    await expect(
      service.createLot(
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        {
          categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
          title: 'Signed Ceramic Vase',
          description: 'Handmade ceramic vase.',
          condition: 'excellent',
        },
        [],
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects lot creation when the category is missing', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(
      service.createLot(
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        {
          categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
          title: 'Signed Ceramic Vase',
          description: 'Handmade ceramic vase.',
          condition: 'excellent',
        },
        [],
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

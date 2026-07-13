import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../core/database';
import { AuctionsService, calculateBidStep } from './auctions.service';

type AuctionRecord = {
  id: string;
  lotId: string;
  sellerProfileId: string;
  slug: string;
  startPrice: number;
  reservePrice: number;
  currentPrice: number;
  currency: string;
  bidStep: number;
  startsAt: Date;
  endsAt: Date;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
};

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

type PublicAuctionRecord = AuctionRecord & {
  lot: LotRecord;
  sellerProfile: SellerProfileRecord;
};

type PublicAuctionDetailRecord = PublicAuctionRecord & {
  bids: Array<{
    id: string;
    auctionId: string;
    bidderUserId: string;
    amount: number;
    status: 'active' | 'winning' | 'outbid' | 'won' | 'lost' | 'cancelled' | 'invalid';
    createdAt: Date;
    updatedAt: Date;
  }>;
};

function createAuctionRecord(
  overrides: Partial<AuctionRecord> = {},
): AuctionRecord {
  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
    sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
    slug: 'demo-auction',
    startPrice: 100,
    reservePrice: 150,
    currentPrice: 100,
    currency: 'USD',
    bidStep: 5,
    startsAt: new Date('2026-07-13T13:00:00.000Z'),
    endsAt: new Date('2026-07-14T13:00:00.000Z'),
    status: 'draft',
    bidCount: 0,
    winnerBidId: null,
    buyNowPrice: null,
    createdAt: new Date('2026-07-13T12:00:00.000Z'),
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

function createLotRecord(overrides: Partial<LotRecord> = {}): LotRecord {
  return {
    id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
    sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
    categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
    title: 'Signed Ceramic Vase',
    description: 'Handmade ceramic vase.',
    condition: 'excellent',
    images: ['/uploads/lots/vase.jpg'],
    status: 'published',
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
    updatedAt: new Date('2026-07-13T10:00:00.000Z'),
    ...overrides,
  };
}

function createSellerProfileRecord(
  overrides: Partial<SellerProfileRecord> = {},
): SellerProfileRecord {
  return {
    id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
    userId: '9d5e8f46-5f7d-4c1a-9f7c-3d4c8d7a1111',
    slug: 'demo-store',
    sellerType: 'creator',
    storeName: 'Demo Store',
    country: 'BY',
    contactPreference: 'telegram',
    socialLink: 'https://example.com',
    shortDescription: 'Short bio',
    status: 'active',
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
    updatedAt: new Date('2026-07-13T10:00:00.000Z'),
    ...overrides,
  };
}

function createPublicAuctionRecord(
  overrides: Partial<PublicAuctionRecord> = {},
): PublicAuctionRecord {
  return {
    ...createAuctionRecord(),
    lot: createLotRecord(),
    sellerProfile: createSellerProfileRecord(),
    ...overrides,
  };
}

function createPublicAuctionDetailRecord(
  overrides: Partial<PublicAuctionDetailRecord> = {},
): PublicAuctionDetailRecord {
  return {
    ...createPublicAuctionRecord(),
    bids: [
      {
        id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        amount: 125,
        status: 'winning',
        createdAt: new Date('2026-07-13T12:10:00.000Z'),
        updatedAt: new Date('2026-07-13T12:10:00.000Z'),
      },
    ],
    ...overrides,
  };
}

describe('calculateBidStep', () => {
  it.each([
    [0, 0.5],
    [24.99, 0.5],
    [25, 1],
    [99.99, 1],
    [100, 5],
    [499.99, 5],
    [500, 10],
    [999.99, 10],
    [1000, 25],
  ])('maps %s to %s', (amount, step) => {
    expect(calculateBidStep(amount)).toBe(step);
  });
});

describe('AuctionsService', () => {
  const prisma = {
    sellerProfile: {
      findUnique: vi.fn(),
    },
    lot: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  const realtimeEventsService = {
    publishAuctionUpdated: vi.fn(),
  };

  const service = new AuctionsService(
    prisma as unknown as PrismaService,
    realtimeEventsService as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:30:00.000Z'));
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: typeof prisma) => Promise<unknown>)(prisma),
    );
  });

  it('lists public auctions in ending order', async () => {
    prisma.auction.findMany.mockResolvedValue([
      createPublicAuctionRecord({
        id: '22222222-2222-2222-2222-222222222222',
        endsAt: new Date('2026-07-14T12:00:00.000Z'),
      }),
      createPublicAuctionRecord({
        id: '11111111-1111-1111-1111-111111111111',
        endsAt: new Date('2026-07-14T13:00:00.000Z'),
      }),
    ]);

    const result = await service.listPublicAuctions({ page: 2, limit: 10 });

    expect(prisma.auction.findMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: ['scheduled', 'active'],
        },
        lot: {
          status: 'published',
        },
        sellerProfile: {
          status: 'active',
        },
      },
      include: {
        lot: true,
        sellerProfile: true,
      },
      skip: 10,
      take: 10,
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
    });
    expect(result.auctions).toHaveLength(2);
    expect(result.auctions[0].auction.id).toBe(
      '22222222-2222-2222-2222-222222222222',
    );
    expect(result.auctions[1].auction.id).toBe(
      '11111111-1111-1111-1111-111111111111',
    );
  });

  it('returns a public auction detail with bid history', async () => {
    prisma.auction.findFirst.mockResolvedValue(
      createPublicAuctionDetailRecord({
        bids: [
          {
            id: 'c1e3d3a3-4d91-4c9e-8d5f-8ebd8c10c001',
            auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
            bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
            amount: 140,
            status: 'winning',
            createdAt: new Date('2026-07-13T12:20:00.000Z'),
            updatedAt: new Date('2026-07-13T12:20:00.000Z'),
          },
          {
            id: 'c1e3d3a3-4d91-4c9e-8d5f-8ebd8c10c002',
            auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
            bidderUserId: '7f0e0d11-3e3c-4ec0-9d7d-6de9a91a2222',
            amount: 120,
            status: 'outbid',
            createdAt: new Date('2026-07-13T12:10:00.000Z'),
            updatedAt: new Date('2026-07-13T12:10:00.000Z'),
          },
        ],
      }),
    );

    const result = await service.getPublicAuction('demo-auction', {
      page: 3,
      limit: 5,
    });

    expect(prisma.auction.findFirst).toHaveBeenCalledWith({
      where: {
        slug: 'demo-auction',
        status: {
          in: ['scheduled', 'active', 'ended', 'sold', 'failed'],
        },
        lot: {
          status: 'published',
        },
        sellerProfile: {
          status: 'active',
        },
      },
      include: {
        lot: true,
        sellerProfile: true,
        bids: {
          skip: 10,
          take: 5,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        },
      },
    });
    expect(result.bids).toHaveLength(2);
    expect(result.bids[0].id).toBe('c1e3d3a3-4d91-4c9e-8d5f-8ebd8c10c001');
    expect(result.bids[1].id).toBe('c1e3d3a3-4d91-4c9e-8d5f-8ebd8c10c002');
    expect(result.lot.title).toBe('Signed Ceramic Vase');
    expect(result.sellerProfile.slug).toBe('demo-store');
  });

  it('rejects missing public auctions', async () => {
    prisma.auction.findFirst.mockResolvedValue(null);

    await expect(service.getPublicAuction('missing-auction')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates an auction draft for an active seller with a draft lot', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'draft',
    });
    prisma.auction.findFirst.mockResolvedValue(null);
    prisma.auction.create.mockResolvedValue(createAuctionRecord());

    const result = await service.createAuction(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      {
        lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currency: 'USD',
        startsAt: '2026-07-13T13:00:00.000Z',
        endsAt: '2026-07-14T13:00:00.000Z',
      },
    );

    expect(prisma.auction.create).toHaveBeenCalledWith({
      data: {
        lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currentPrice: 100,
        currency: 'USD',
        bidStep: 5,
        startsAt: new Date('2026-07-13T13:00:00.000Z'),
        endsAt: new Date('2026-07-14T13:00:00.000Z'),
        status: 'draft',
        bidCount: 0,
        winnerBidId: null,
        buyNowPrice: null,
      },
    });
    expect(result.auction.status).toBe('draft');
    expect(result.auction.bidStep).toBe(5);
    expect(realtimeEventsService.publishAuctionUpdated).not.toHaveBeenCalled();
  });

  it('rejects auction creation when the lot already has an auction', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'draft',
    });
    prisma.auction.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.createAuction('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', {
        lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currency: 'USD',
        startsAt: '2026-07-13T13:00:00.000Z',
        endsAt: '2026-07-14T13:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('publishes a draft auction as scheduled when it starts in the future', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.auction.findUnique.mockResolvedValue(
      createAuctionRecord({
        startsAt: new Date('2026-07-13T13:00:00.000Z'),
        status: 'draft',
      }),
    );
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'draft',
    });
    prisma.auction.update.mockResolvedValue(
      createAuctionRecord({
        status: 'scheduled',
      }),
    );
    prisma.lot.update.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'published',
    });

    const result = await service.publishAuction(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    );

    expect(prisma.lot.update).toHaveBeenCalledWith({
      where: {
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      },
      data: {
        status: 'published',
      },
    });
    expect(result.auction.status).toBe('scheduled');
    expect(realtimeEventsService.publishAuctionUpdated).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 100,
      bidCount: 0,
      status: 'scheduled',
      endsAt: '2026-07-14T13:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });
  });

  it('publishes a draft auction as active when it already started', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.auction.findUnique.mockResolvedValue(
      createAuctionRecord({
        startsAt: new Date('2026-07-13T11:00:00.000Z'),
        status: 'draft',
      }),
    );
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'draft',
    });
    prisma.auction.update.mockResolvedValue(
      createAuctionRecord({
        status: 'active',
      }),
    );
    prisma.lot.update.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'published',
    });

    const result = await service.publishAuction(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    );

    expect(result.auction.status).toBe('active');
    expect(realtimeEventsService.publishAuctionUpdated).toHaveBeenCalledWith({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 100,
      bidCount: 0,
      status: 'active',
      endsAt: '2026-07-14T13:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });
  });

  it('rejects publishing an auction that is not draft', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue({
      id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      status: 'active',
    });
    prisma.auction.findUnique.mockResolvedValue(
      createAuctionRecord({
        status: 'scheduled',
      }),
    );

    await expect(
      service.publishAuction(
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects publishing when the seller profile is missing', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.publishAuction(
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

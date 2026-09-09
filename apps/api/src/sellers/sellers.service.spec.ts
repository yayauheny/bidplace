import { describe, expect, it, vi } from 'vitest';

import { countPublicSellerStatuses, SellersService } from './sellers.service';
import { publicSellerProfileSelect } from './seller-profile.mapper';

const imageStore = {
  get: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
};

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

  it('adds an achievement after locking the editable profile revision', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'revision-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          editingRevision: { id: 'revision-id', status: 'DRAFT' },
        }),
      },
      sellerProfileRevisionAchievement: {
        count: vi.fn().mockResolvedValue(2),
        create: vi.fn().mockResolvedValue({
          id: 'dc6c9612-cf38-48aa-b328-011f1b093b6c',
          occurredAt: null,
          body: 'First exhibition',
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    await expect(
      service.addAchievement('user-id', { body: 'First exhibition' }),
    ).resolves.toEqual({
      achievement: {
        id: 'dc6c9612-cf38-48aa-b328-011f1b093b6c',
        occurredAt: null,
        body: 'First exhibition',
        image: null,
      },
    });

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.sellerProfileRevisionAchievement.count).toHaveBeenCalledWith({
      where: { revisionId: 'revision-id' },
    });
    expect(tx.sellerProfileRevisionAchievement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ revisionId: 'revision-id', position: 2 }),
    });
  });

  it('maps a concurrent duplicate SellerProfile or slug to a conflict', async () => {
    const tx = {
      sellerProfile: {
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
      },
    };
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    await expect(
      service.create(
        'user-id',
        {
          slug: 'taken-slug',
          sellerType: 'creator',
          discipline: 'Керамика',
          fullName: 'Seller',
          country: 'BY',
          city: 'Minsk',
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

  it('persists seller photo metadata and bytes in one transaction', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const order: string[] = [];
    const createdProfile = {
      id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
      userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      slug: 'seller-slug',
      fullName: 'Seller',
      sellerType: 'creator',
      discipline: 'Керамика',
      country: 'BY',
      socialLink: 'https://example.com/seller',
      shortDescription: 'Description',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'PENDING_REVIEW',
      createdAt: now,
      updatedAt: now,
    };
    const tx = {
      sellerProfile: {
        create: vi.fn().mockImplementation(async () => {
          order.push('create');
          return createdProfile;
        }),
        update: vi.fn().mockImplementation(async () => {
          order.push('object-key');
          return createdProfile;
        }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          ...createdProfile,
          city: 'Minsk',
          practice: null,
          telegramUrl: null,
          instagramUrl: null,
          websiteUrl: null,
          editingRevision: {
            id: 'c0d82a10-3170-49eb-904f-a8bc87d311a5',
            version: 1,
            status: 'PENDING_REVIEW',
            slug: 'seller-slug',
            discipline: 'Керамика',
            fullName: 'Seller',
            country: 'BY',
            city: 'Minsk',
            practice: null,
            socialLink: 'https://example.com/seller',
            telegramUrl: null,
            instagramUrl: null,
            websiteUrl: null,
            shortDescription: 'Description',
          },
        }),
      },
      sellerProfileRevision: {
        create: vi.fn().mockResolvedValue({ id: 'revision-id' }),
      },
    };
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const put = vi.fn().mockImplementation(async () => {
      order.push('put');
    });
    const service = new SellersService(
      prisma as never,
      {} as never,
      { ...imageStore, put } as never,
    );

    await service.create(
      'user-id',
      {
        slug: 'seller-slug',
        sellerType: 'creator',
        discipline: 'Керамика',
        fullName: 'Seller',
        country: 'BY',
        city: 'Minsk',
        socialLink: 'https://example.com/seller',
        shortDescription: 'Description',
        handoffContactType: 'TELEGRAM',
        handoffContactValue: '@seller',
        handoffInitiator: 'BUYER_CONTACTS_SELLER',
      },
      { buffer: Buffer.from([1, 2, 3]), mimeType: 'image/png' },
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['create', 'put', 'object-key', 'object-key']);
    expect(tx.sellerProfileRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sellerProfileId: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
        status: 'PENDING_REVIEW',
      }),
    });
    expect(put).toHaveBeenCalledWith(
      'seller-photo:a0d82a10-3170-49eb-904f-a8bc87d311a5',
      {
        bytes: Buffer.from([1, 2, 3]),
        mimeType: 'image/png',
      },
      tx,
    );
  });

  it('fails seller create when image put rejects inside the transaction', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const tx = {
      sellerProfile: {
        create: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
          slug: 'seller-slug',
          fullName: 'Seller',
          sellerType: 'creator',
          discipline: 'Керамика',
          country: 'BY',
          city: 'Minsk',
          socialLink: 'https://example.com/seller',
          shortDescription: 'Description',
          handoffContactType: 'TELEGRAM',
          handoffContactValue: '@seller',
          handoffInitiator: 'BUYER_CONTACTS_SELLER',
          status: 'PENDING_REVIEW',
          createdAt: now,
          updatedAt: now,
        }),
      },
    };
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const put = vi.fn().mockRejectedValue(new Error('store down'));
    const service = new SellersService(
      prisma as never,
      {} as never,
      { ...imageStore, put } as never,
    );

    await expect(
      service.create(
        'user-id',
        {
          slug: 'seller-slug',
          sellerType: 'creator',
          discipline: 'Керамика',
          fullName: 'Seller',
          country: 'BY',
          city: 'Minsk',
          socialLink: 'https://example.com/seller',
          shortDescription: 'Description',
          handoffContactType: 'TELEGRAM',
          handoffContactValue: '@seller',
          handoffInitiator: 'BUYER_CONTACTS_SELLER',
        },
        { buffer: Buffer.from([1, 2, 3]), mimeType: 'image/png' },
      ),
    ).rejects.toThrow('store down');

    expect(tx.sellerProfile.create).toHaveBeenCalled();
    expect(put).toHaveBeenCalled();
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
      const service = new SellersService(
        prisma as never,
        {} as never,
        imageStore as never,
      );

      await expect(
        service.update('user-id', { fullName: 'Updated seller' }),
      ).rejects.toThrow('Seller profile cannot be edited');
      expect(prisma.sellerProfile.update).not.toHaveBeenCalled();
    },
  );

  it('allows a rejected first application to be patched', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const updated = {
      id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
      userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      slug: 'seller-slug',
      fullName: 'Updated seller',
      sellerType: 'creator',
      discipline: 'Керамика',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      socialLink: 'https://example.com/seller',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Updated description',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'REJECTED' as const,
      createdAt: now,
      updatedAt: now,
    };
    const tx = {
      sellerProfile: {
        update: vi.fn().mockResolvedValue(updated),
      },
      sellerProfileRevision: { update: vi.fn() },
    };
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: updated.id,
          status: 'REJECTED',
          slug: 'seller-slug',
          editingRevisionId: 'revision-id',
        }),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    await expect(
      service.update('user-id', { fullName: 'Updated seller' }),
    ).resolves.toMatchObject({
      sellerProfile: { fullName: 'Updated seller', status: 'REJECTED' },
    });
  });

  it('rejects achievement writes while a SellerProfile is SUSPENDED', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'SUSPENDED',
          editingRevision: { id: 'revision-id', status: 'DRAFT' },
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    await expect(
      service.addAchievement('user-id', { body: 'First exhibition' }),
    ).rejects.toThrow('Seller profile is suspended');
  });

  it('copies approved achievements into a new profile editing revision', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const publishedRevision = {
      id: 'published-revision-id',
      version: 1,
      slug: 'seller-slug',
      discipline: 'Керамика',
      fullName: 'Seller',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      socialLink: 'https://example.com/seller',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Description',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: 3,
      profilePhotoChecksum: 'b'.repeat(64),
      profilePhotoObjectKey: 'seller-photo:seller-profile-id',
      achievements: [
        {
          position: 0,
          occurredAt: new Date('2025-01-02T00:00:00.000Z'),
          body: 'First exhibition',
          mimeType: 'image/png',
          byteLength: 12,
          checksum: 'a'.repeat(64),
          objectKey: 'achievement:one',
        },
      ],
    };
    const response = {
      id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
      userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      slug: 'seller-slug',
      fullName: 'Seller',
      sellerType: 'creator',
      discipline: 'Керамика',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      socialLink: 'https://example.com/seller',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Description',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
      createdAt: now,
      updatedAt: now,
    };
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'APPROVED',
          editingRevisionId: 'published-revision-id',
          publishedRevisionId: 'published-revision-id',
          editingRevision: { id: 'published-revision-id' },
          publishedRevision,
        }),
        update: vi.fn(),
        findUniqueOrThrow: vi.fn().mockResolvedValue(response),
      },
      sellerProfileRevision: {
        create: vi.fn().mockResolvedValue({ id: 'editing-revision-id' }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ status: 'DRAFT' }),
        update: vi.fn(),
      },
    };
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'APPROVED',
          slug: 'seller-slug',
        }),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    await service.update('user-id', { fullName: 'Updated seller' });

    expect(tx.sellerProfileRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        profilePhotoObjectKey: 'seller-photo:seller-profile-id',
        achievements: {
          create: [
            expect.objectContaining({
              position: 0,
              body: 'First exhibition',
              objectKey: 'achievement:one',
            }),
          ],
        },
      }),
    });
  });

  it('allows edits only when SellerProfile is CHANGES_REQUESTED', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const updated = {
      id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
      userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      slug: 'seller-slug',
      fullName: 'Updated seller',
      sellerType: 'creator',
      discipline: 'Керамика',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      socialLink: 'https://example.com/seller',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Updated description',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'CHANGES_REQUESTED',
      createdAt: now,
      updatedAt: now,
    };
    const tx = {
      sellerProfile: {
        update: vi.fn().mockResolvedValue(updated),
      },
      sellerProfileRevision: { update: vi.fn() },
    };
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: updated.id,
          status: 'CHANGES_REQUESTED',
          slug: 'seller-slug',
          editingRevisionId: 'revision-id',
        }),
        update: vi.fn(),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    const result = await service.update('user-id', {
      fullName: 'Updated seller',
    });

    expect(tx.sellerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5' },
        data: expect.objectContaining({ fullName: 'Updated seller' }),
      }),
    );
    expect(result.sellerProfile.fullName).toBe('Updated seller');
  });

  it('updates seller photo metadata and bytes in one transaction', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const tx = {
      sellerProfile: {
        update: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
          slug: 'seller-slug',
          fullName: 'Updated seller',
          sellerType: 'creator',
          discipline: 'Керамика',
          country: 'BY',
          city: 'Minsk',
          practice: null,
          socialLink: 'https://example.com/seller',
          telegramUrl: null,
          instagramUrl: null,
          websiteUrl: null,
          shortDescription: 'Updated description',
          handoffContactType: 'TELEGRAM',
          handoffContactValue: '@seller',
          handoffInitiator: 'BUYER_CONTACTS_SELLER',
          status: 'CHANGES_REQUESTED',
          createdAt: now,
          updatedAt: now,
        }),
      },
      sellerProfileRevision: { update: vi.fn() },
    };
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          status: 'CHANGES_REQUESTED',
          slug: 'seller-slug',
          editingRevisionId: 'revision-id',
        }),
        update: vi.fn(),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const put = vi.fn().mockResolvedValue(undefined);
    const service = new SellersService(
      prisma as never,
      {} as never,
      { ...imageStore, put } as never,
    );

    await service.update(
      'user-id',
      { fullName: 'Updated seller' },
      { buffer: Buffer.from([9, 8, 7]), mimeType: 'image/png' },
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.sellerProfile.update).toHaveBeenCalled();
    expect(prisma.sellerProfile.update).not.toHaveBeenCalled();
    expect(put).toHaveBeenCalledWith(
      'seller-photo:a0d82a10-3170-49eb-904f-a8bc87d311a5',
      {
        bytes: Buffer.from([9, 8, 7]),
        mimeType: 'image/png',
      },
      tx,
    );
  });

  it('uses a narrow seller select for public SellerProfile pages', async () => {
    const prisma = {
      sellerProfile: {
        findFirst: vi.fn().mockResolvedValue({
          id: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
          slug: 'seller-slug',
          sellerType: 'creator',
          discipline: 'Керамика',
          fullName: 'Seller',
          country: 'BY',
          city: 'Minsk',
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
      imageStore as never,
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
      auditEvent: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    const result = await service.getProduct(
      'owner-id',
      'a0d82a10-3170-49eb-904f-a8bc87d311a5',
    );

    expect(result.creationIntro).toBe('Persisted intro');
    expect(result.lastModerationReason).toBeNull();
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
    expect(prisma.auditEvent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          targetType: 'PRODUCT',
          targetId: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          reason: { not: null },
        },
      }),
    );
  });

  it('exposes the latest rejection reason without rewriting audit history', async () => {
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
          status: 'REJECTED',
          createdAt: new Date('2026-07-18T00:00:00.000Z'),
          updatedAt: new Date('2026-07-18T00:00:00.000Z'),
          images: [],
          creationIntro: null,
          creationSteps: [],
        }),
      },
      auditEvent: {
        findFirst: vi.fn().mockResolvedValue({
          reason: 'Provenance could not be confirmed',
        }),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    const result = await service.getProduct(
      'owner-id',
      'a0d82a10-3170-49eb-904f-a8bc87d311a5',
    );

    expect(result.product.status).toBe('REJECTED');
    expect(result.lastModerationReason).toBe(
      'Provenance could not be confirmed',
    );
    expect(prisma.auditEvent.update).not.toHaveBeenCalled();
    expect(prisma.auditEvent.delete).not.toHaveBeenCalled();
  });

  it('hides unpublished achievement images from visitors', async () => {
    const prisma = {
      sellerProfileRevisionAchievement: {
        findUnique: vi.fn().mockResolvedValue({
          mimeType: 'image/png',
          objectKey: 'seller-achievement:achievement-id',
          revisionId: 'editing-revision-id',
          revision: {
            sellerProfile: {
              userId: 'owner-id',
              status: 'APPROVED',
              publishedRevisionId: 'published-revision-id',
            },
          },
        }),
      },
    };
    const get = vi.fn();
    const service = new SellersService(
      prisma as never,
      {} as never,
      { ...imageStore, get } as never,
    );

    await expect(
      service.getAchievementImage('achievement-id'),
    ).rejects.toThrow('Achievement image not found');
    expect(get).not.toHaveBeenCalled();
  });

  it('returns the editing revision photo to the owner', async () => {
    const bytes = Uint8Array.from([9, 8, 7]);
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          editingRevision: {
            profilePhotoObjectKey: 'seller-profile-revision:revision-id',
          },
        }),
      },
    };
    const get = vi.fn().mockResolvedValue({
      bytes,
      mimeType: 'image/png',
    });
    const service = new SellersService(
      prisma as never,
      {} as never,
      { ...imageStore, get } as never,
    );

    await expect(service.getEditingPhoto('owner-id')).resolves.toEqual({
      mimeType: 'image/png',
      data: bytes,
    });
    expect(get).toHaveBeenCalledWith('seller-profile-revision:revision-id');
  });

  it('rejects submitting a profile revision without a photo', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'APPROVED',
          editingRevision: {
            id: 'revision-id',
            status: 'DRAFT',
            slug: 'seller-slug',
            discipline: 'Керамика',
            fullName: 'Seller',
            country: 'BY',
            city: 'Minsk',
            shortDescription: 'Description',
            profilePhotoMimeType: null,
            profilePhotoByteLength: null,
            profilePhotoChecksum: null,
            profilePhotoObjectKey: null,
          },
        }),
      },
      sellerProfileRevision: { update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    await expect(service.submitProfileRevision('owner-id')).rejects.toThrow(
      'Author profile is missing required fields',
    );
    expect(tx.sellerProfileRevision.update).not.toHaveBeenCalled();
  });

  it('rejects submitting a profile revision without a public social link', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'APPROVED',
          editingRevision: {
            id: 'revision-id',
            status: 'DRAFT',
            slug: 'seller-slug',
            discipline: 'Керамика',
            fullName: 'Seller',
            country: 'BY',
            city: 'Minsk',
            socialLink: null,
            shortDescription: 'Description',
            profilePhotoMimeType: 'image/png',
            profilePhotoByteLength: 12,
            profilePhotoChecksum: 'a'.repeat(64),
            profilePhotoObjectKey: 'seller-photo:profile-id',
          },
        }),
      },
      sellerProfileRevision: { update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    await expect(service.submitProfileRevision('owner-id')).rejects.toThrow(
      'Author profile is missing required fields',
    );
    expect(tx.sellerProfileRevision.update).not.toHaveBeenCalled();
  });

  it('does not delete an achievement object still referenced by another revision', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'revision-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          editingRevision: { id: 'revision-id', status: 'DRAFT' },
        }),
      },
      sellerProfileRevisionAchievement: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'achievement-id',
          objectKey: 'seller-achievement:achievement-id',
        }),
        delete: vi.fn(),
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const remove = vi.fn();
    const service = new SellersService(
      prisma as never,
      {} as never,
      { ...imageStore, delete: remove } as never,
    );

    await expect(
      service.deleteAchievement('owner-id', 'achievement-id'),
    ).resolves.toEqual({ ok: true });
    expect(tx.sellerProfileRevisionAchievement.delete).toHaveBeenCalledWith({
      where: { id: 'achievement-id' },
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it('rolls back achievement creation when object storage fails', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'revision-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          editingRevision: { id: 'revision-id', status: 'DRAFT' },
        }),
      },
      sellerProfileRevisionAchievement: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({
          id: 'dc6c9612-cf38-48aa-b328-011f1b093b6c',
          occurredAt: null,
          body: 'Exhibition',
        }),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const put = vi.fn().mockRejectedValue(new Error('store down'));
    const service = new SellersService(
      prisma as never,
      {} as never,
      { ...imageStore, put } as never,
    );

    await expect(
      service.addAchievement(
        'owner-id',
        { body: 'Exhibition' },
        { buffer: Buffer.from([1]), mimeType: 'image/png' },
      ),
    ).rejects.toThrow('store down');
    expect(tx.sellerProfileRevisionAchievement.create).toHaveBeenCalled();
    expect(put).toHaveBeenCalled();
  });

  it('lists cabinet works from one product query and one moderation-reason query', async () => {
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: 'profile-id' }),
      },
      product: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'product-id',
            publicId: 'abcdefghijk',
            title: 'Published title',
            status: 'CHANGES_REQUESTED',
            updatedAt: new Date('2026-09-09T00:00:00.000Z'),
            editingRevision: { title: 'Editing title' },
          },
        ]),
        findFirst: vi.fn(),
      },
      auditEvent: {
        findMany: vi.fn().mockResolvedValue([
          { targetId: 'product-id', reason: 'Need a clearer photo' },
        ]),
      },
    };
    const service = new SellersService(
      prisma as never,
      {} as never,
      imageStore as never,
    );

    await expect(service.listCabinetWorks('user-id')).resolves.toEqual([
      {
        id: 'product-id',
        publicId: 'abcdefghijk',
        title: 'Editing title',
        status: 'CHANGES_REQUESTED',
        updatedAt: '2026-09-09T00:00:00.000Z',
        moderationMessage: 'Need a clearer photo',
      },
    ]);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.auditEvent.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
  });
});

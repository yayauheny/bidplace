import { describe, expect, it, vi } from 'vitest';

import { SellersService } from './sellers.service';
import { publicSellerProfileSelect } from './seller-profile.mapper';

const imageStore = {
  get: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
};

describe('SellersService', () => {
  it('adds an achievement after locking the editable profile revision', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'seller-profile-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'CHANGES_REQUESTED',
          editingRevisionId: 'revision-id',
          publishedRevisionId: null,
          editingRevision: { id: 'revision-id', status: 'DRAFT' },
          publishedRevision: null,
        }),
      },
      sellerProfileRevision: {
        create: vi.fn(),
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

    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
    expect(tx.sellerProfileRevision.create).not.toHaveBeenCalled();
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
        imageStore as never,
      );

      await expect(
        service.update('user-id', { fullName: 'Updated seller' }),
      ).rejects.toThrow('Seller profile cannot be edited');
      expect(prisma.sellerProfile.update).not.toHaveBeenCalled();
    },
  );

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
      profilePhotoMimeType: 'image/jpeg',
      profilePhotoByteLength: 8,
      profilePhotoChecksum: 'b'.repeat(64),
      profilePhotoObjectKey: 'seller-photo:seller-profile-id',
      achievements: [
        {
          id: 'published-achievement-id',
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
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'seller-profile-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'APPROVED',
          editingRevisionId: 'published-revision-id',
          publishedRevisionId: 'published-revision-id',
          editingRevision: { id: 'published-revision-id', status: 'APPROVED' },
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
      sellerProfileRevisionAchievement: {
        create: vi.fn().mockResolvedValue({ id: 'draft-achievement-id' }),
        findMany: vi.fn().mockResolvedValue([]),
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
      imageStore as never,
    );

    await service.update('user-id', { fullName: 'Updated seller' });

    expect(tx.sellerProfileRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        profilePhotoObjectKey: 'seller-photo:seller-profile-id',
        profilePhotoMimeType: 'image/jpeg',
      }),
    });
    expect(
      tx.sellerProfileRevision.create.mock.calls[0]?.[0]?.data?.achievements,
    ).toBeUndefined();
    expect(tx.sellerProfileRevisionAchievement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        revisionId: 'editing-revision-id',
        position: 0,
        body: 'First exhibition',
        objectKey: 'achievement:one',
      }),
    });
  });

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
    const service = new SellersService(
      prisma as never,
      imageStore as never,
    );

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
    const prisma = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          status: 'CHANGES_REQUESTED',
          slug: 'seller-slug',
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

  it('uses a narrow seller select for public author pages', async () => {
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
          practice: null,
          socialLink: 'https://example.com/seller',
          telegramUrl: null,
          instagramUrl: null,
          websiteUrl: null,
          shortDescription: 'Short',
          publishedRevision: { achievements: [] },
        }),
      },
    };
    const service = new SellersService(prisma as never, imageStore as never);

    const result = await service.getApprovedPublicAuthor('seller-slug');

    expect(result?.sellerProfile.slug).toBe('seller-slug');
    expect(prisma.sellerProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: publicSellerProfileSelect,
      }),
    );
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

  it('hides unpublished achievement images from strangers', async () => {
    const prisma = {
      sellerProfileRevisionAchievement: {
        findUnique: vi.fn().mockResolvedValue({
          mimeType: 'image/png',
          objectKey: 'seller-achievement:achievement-id',
          revisionId: 'draft-revision-id',
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
      { ...imageStore, get } as never,
    );

    await expect(
      service.getAchievementImage('achievement-id', 'stranger-id'),
    ).rejects.toThrow('Achievement image not found');
    expect(get).not.toHaveBeenCalled();
  });
});

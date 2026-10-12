import { describe, expect, it, vi } from 'vitest';

import { SellersService } from './sellers.service';
import { publicSellerProfileSelect } from './seller-profile.mapper';

const imageStore = {
  get: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
};

function ownerRecord(now: Date) {
  return {
    id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
    userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61', slug: 'seller-slug',
    fullName: 'Updated seller', sellerType: 'creator', discipline: 'Керамика', country: 'BY', city: 'Minsk',
    practice: null, biography: null, socialLink: 'https://example.com/seller', telegramUrl: null, instagramUrl: null, websiteUrl: null,
    shortDescription: 'Updated description', handoffContactType: null, handoffContactValue: null, handoffInitiator: null,
    status: 'CHANGES_REQUESTED', createdAt: now, updatedAt: now,
    editingRevision: { id: 'f3e4cc9c-d42a-4fda-8c2e-7ed73a4ef05a', version: 1, status: 'CHANGES_REQUESTED', updatedAt: now, slug: 'seller-slug', discipline: 'Керамика', fullName: 'Updated seller', country: 'BY', city: 'Minsk', practice: null, biography: null, socialLink: 'https://example.com/seller', telegramUrl: null, instagramUrl: null, websiteUrl: null, shortDescription: 'Updated description' },
  };
}

describe('SellersService', () => {
  it('advances an active draft only through its server-owned onboarding stage', async () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'seller-profile-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'DRAFT',
          applicationStage: 'CONTACTS',
          editingRevision: { id: 'revision-id', status: 'DRAFT', discipline: null, shortDescription: null },
        }),
        update: vi.fn(),
        findUniqueOrThrow: vi
          .fn()
          .mockResolvedValueOnce({
            id: 'seller-profile-id',
            status: 'DRAFT',
            applicationStage: 'CONTACTS',
            editingRevision: { id: 'revision-id', status: 'DRAFT' },
          })
          .mockResolvedValueOnce(ownerRecord(now)),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const service = new SellersService(prisma as never, imageStore as never);

    await expect(service.advanceApplicationStage('user-id')).resolves.toMatchObject({
      sellerProfile: { status: 'CHANGES_REQUESTED' },
    });
    expect(tx.sellerProfile.update).toHaveBeenCalledWith({
      where: { id: 'seller-profile-id' },
      data: { applicationStage: 'ABOUT' },
    });
  });

  it('does not advance About until server-side required fields exist', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'seller-profile-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id', status: 'DRAFT', applicationStage: 'ABOUT',
          editingRevision: { id: 'revision-id', status: 'DRAFT', discipline: null, shortDescription: null },
        }),
        update: vi.fn(),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'DRAFT',
          applicationStage: 'ABOUT',
          editingRevision: { id: 'revision-id', status: 'DRAFT', discipline: null, shortDescription: null },
        }),
      },
      sellerProfileRevisionDirection: {
        count: vi.fn().mockResolvedValue(0),
      },
    };
    const prisma = { $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) };
    const service = new SellersService(prisma as never, imageStore as never);

    await expect(service.advanceApplicationStage('user-id')).rejects.toThrow(
      'Author profile is missing required fields',
    );
    expect(tx.sellerProfile.update).not.toHaveBeenCalled();
  });

  it.each([
    {
      occurredDate: { year: 2025, month: 3, day: null },
      storedDate: new Date('2025-03-01T00:00:00.000Z'),
    },
    {
      occurredDate: { year: 4, month: 2, day: 29 },
      storedDate: new Date('0004-02-29T00:00:00.000Z'),
    },
  ])(
    'adds an achievement for year $occurredDate.year after locking the revision',
    async ({ occurredDate, storedDate }) => {
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
        findFirst: vi.fn().mockResolvedValue({ position: 4 }),
        create: vi.fn().mockResolvedValue({
          id: 'dc6c9612-cf38-48aa-b328-011f1b093b6c',
          occurredAt: storedDate,
          occurredAtPrecision: occurredDate.day === null ? 'MONTH' : 'DAY',
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
    const service = new SellersService(prisma as never, imageStore as never);

    await expect(
      service.addAchievement('user-id', {
        body: 'First exhibition',
        occurredDate,
      }),
    ).resolves.toEqual({
      achievement: {
        id: 'dc6c9612-cf38-48aa-b328-011f1b093b6c',
        occurredDate,
        body: 'First exhibition',
        image: null,
      },
    });

    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
    expect(tx.sellerProfileRevision.create).not.toHaveBeenCalled();
    expect(tx.sellerProfileRevisionAchievement.findFirst).toHaveBeenCalledWith({
      where: { revisionId: 'revision-id' },
      select: { position: true },
      orderBy: { position: 'desc' },
    });
    expect(tx.sellerProfileRevisionAchievement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        revisionId: 'revision-id',
        position: 5,
        occurredAt: storedDate,
      }),
    });
    },
  );

  it('does not create a profile when the account has no slug', async () => {
    const tx = {
      user: { findUnique: vi.fn().mockResolvedValue({ slug: null }) },
      sellerProfile: { create: vi.fn() },
    };
    const prisma = {
      sellerProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const service = new SellersService(prisma as never, imageStore as never);

    await expect(
      service.create(
        'user-id',
        {
          fullName: 'Seller',
          country: 'BY',
          city: 'Minsk',
        },
        { buffer: Buffer.from([1]), mimeType: 'image/png' },
      ),
    ).rejects.toThrow('Account nickname is required before an author profile');
    expect(tx.sellerProfile.create).not.toHaveBeenCalled();
  });

  it('maps a concurrent duplicate SellerProfile or slug to a conflict', async () => {
    const tx = {
      user: { findUnique: vi.fn().mockResolvedValue({ slug: 'taken-slug' }) },
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
    const service = new SellersService(prisma as never, imageStore as never);

    await expect(
      service.create(
        'user-id',
        {
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

  it('reports an existing profile and a taken slug as different conflicts', async () => {
    const input = {
      slug: 'taken-slug',
      fullName: 'Seller',
      country: 'BY',
      city: 'Minsk',
    };
    const photo = { buffer: Buffer.from([1]), mimeType: 'image/png' as const };
    const existing = new SellersService(
      {
        sellerProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'profile' }) },
      } as never,
      imageStore as never,
    );
    await expect(existing.create('user-id', input, photo)).rejects.toMatchObject({
      response: {
        message: 'Seller profile already exists',
        details: { reason: 'profile_exists' },
      },
    });

    const tx = {
      user: { findUnique: vi.fn().mockResolvedValue({ slug: 'taken-slug' }) },
      sellerProfile: {
        create: vi.fn().mockRejectedValue({ code: 'P2002', meta: { target: ['slug'] } }),
      },
    };
    const taken = new SellersService(
      {
        sellerProfile: { findUnique: vi.fn().mockResolvedValue(null) },
        $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
      } as never,
      imageStore as never,
    );
    await expect(taken.create('user-id', input, photo)).rejects.toMatchObject({
      response: {
        message: 'Seller profile slug is already taken',
        details: { reason: 'slug_taken' },
      },
    });
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
      user: { findUnique: vi.fn().mockResolvedValue({ slug: 'seller-slug' }) },
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
          biography: null,
          telegramUrl: null,
          instagramUrl: null,
          websiteUrl: null,
          editingRevision: {
            id: 'c0d82a10-3170-49eb-904f-a8bc87d311a5',
            version: 1,
            status: 'DRAFT',
            updatedAt: now,
            slug: 'seller-slug',
            discipline: 'Керамика',
            fullName: 'Seller',
            country: 'BY',
            city: 'Minsk',
            practice: null,
            biography: null,
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
        discipline: 'Керамика',
        fullName: 'Seller',
        country: 'BY',
        city: 'Minsk',
        socialLink: 'https://example.com/seller',
        shortDescription: 'Description',
      },
      { buffer: Buffer.from([1, 2, 3]), mimeType: 'image/png' },
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['create', 'put', 'object-key', 'object-key']);
    expect(tx.sellerProfileRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sellerProfileId: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
        status: 'DRAFT',
        slug: 'seller-slug',
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
      user: { findUnique: vi.fn().mockResolvedValue({ slug: 'seller-slug' }) },
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
      const service = new SellersService(prisma as never, imageStore as never);

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
      biography: null,
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
      biography: null,
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
      user: { findUnique: vi.fn().mockResolvedValue({ slug: 'account-slug' }) },
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
      sellerProfileRevisionDirection: {
        findMany: vi.fn().mockResolvedValue([]),
        createMany: vi.fn(),
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
    const service = new SellersService(prisma as never, imageStore as never);

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
    const record = ownerRecord(now);
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: record.id }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: record.id, status: 'CHANGES_REQUESTED', editingRevisionId: 'f3e4cc9c-d42a-4fda-8c2e-7ed73a4ef05a', publishedRevisionId: null, editingRevision: { id: 'f3e4cc9c-d42a-4fda-8c2e-7ed73a4ef05a', status: 'CHANGES_REQUESTED' }, publishedRevision: null }),
        update: vi.fn(), findUniqueOrThrow: vi.fn().mockResolvedValue(record),
      },
      sellerProfileRevision: { update: vi.fn() },
    };
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
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const service = new SellersService(prisma as never, imageStore as never);

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
    const record = ownerRecord(now);
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: record.id }]),
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
        findUnique: vi.fn().mockResolvedValue({ id: record.id, status: 'CHANGES_REQUESTED', editingRevisionId: 'f3e4cc9c-d42a-4fda-8c2e-7ed73a4ef05a', publishedRevisionId: null, editingRevision: { id: 'f3e4cc9c-d42a-4fda-8c2e-7ed73a4ef05a', status: 'CHANGES_REQUESTED' }, publishedRevision: null }),
        findUniqueOrThrow: vi.fn().mockResolvedValue(record),
      },
      sellerProfileRevision: { update: vi.fn() },
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
          biography: null,
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
        where: {
          status: 'APPROVED',
          user: { status: 'active' },
          OR: [
            { user: { slug: 'seller-slug' } },
            { slug: 'seller-slug', user: { slug: null } },
          ],
        },
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
          mediaOperations: [],
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
    const service = new SellersService(prisma as never, imageStore as never);

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

  it('returns the editable revision fields and gallery to the owner', async () => {
    const draftImage = {
      id: '2f8fc6d7-4c7a-4f9e-9f75-b8eafed0c2b1',
      mimeType: 'image/png',
      byteLength: 4,
      checksum: '1'.repeat(64),
      width: 2,
      height: 2,
    };
    const prisma = {
      product: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          publicId: 'publicId001',
          mediaOperations: [],
          sellerProfileId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
          categoryId: null,
          title: 'Published title',
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
          packaging: null,
          deliveryInfo: null,
          publishedAt: new Date('2026-07-18T00:00:00.000Z'),
          status: 'APPROVED',
          editingRevisionId: 'editing-revision-id',
          publishedRevisionId: 'published-revision-id',
          createdAt: new Date('2026-07-18T00:00:00.000Z'),
          updatedAt: new Date('2026-07-18T00:00:00.000Z'),
          images: [],
          editingRevision: {
            id: '5db1f3d4-45f2-4f85-80ad-ad29b23b896a',
            version: 2,
            status: 'DRAFT',
            updatedAt: new Date('2026-07-18T01:00:00.000Z'),
            categoryId: null,
            title: 'Draft title',
            story: 'Draft story',
            technique: null,
            materials: null,
            dimensions: null,
            weight: null,
            year: null,
            condition: null,
            uniqueness: null,
            provenance: null,
            city: null,
            packaging: null,
            deliveryInfo: null,
            images: [{ position: 0, image: draftImage }],
          },
          creationIntro: null,
          creationSteps: [],
        }),
      },
      auditEvent: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const service = new SellersService(prisma as never, imageStore as never);

    const result = await service.getProduct(
      'owner-id',
      'a0d82a10-3170-49eb-904f-a8bc87d311a5',
    );

    expect(result.product).toMatchObject({
      status: 'APPROVED',
      title: 'Draft title',
      story: 'Draft story',
      images: [
        {
          id: draftImage.id,
          position: 0,
          url: `/api/images/${draftImage.id}`,
        },
      ],
    });
    expect(result.editingRevision).toEqual({
      id: '5db1f3d4-45f2-4f85-80ad-ad29b23b896a',
      version: 2,
      status: 'DRAFT',
      updatedAt: '2026-07-18T01:00:00.000Z',
    });
  });

  it('exposes the latest rejection reason without rewriting audit history', async () => {
    const prisma = {
      product: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
          publicId: 'publicId001',
          mediaOperations: [],
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
    const service = new SellersService(prisma as never, imageStore as never);

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

  it('serves a published historical achievement image without author credentials', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const readPreview = vi.fn().mockResolvedValue({
      bytes,
      mimeType: 'image/webp',
    });
    const prisma = {
      sellerProfileRevisionAchievement: {
        findUnique: vi.fn().mockResolvedValue({
          mimeType: 'image/webp',
          objectKey: null,
          mediaAssetId: '11111111-1111-4111-8111-111111111111',
          revisionId: 'published-revision-id',
          revision: {
            sellerProfile: {
              userId: 'owner-id',
              status: 'APPROVED',
              user: { status: 'active' },
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
      { enabled: true, readPreview } as never,
    );

    await expect(
      service.getAchievementImage('achievement-id'),
    ).resolves.toEqual({
      mimeType: 'image/webp',
      data: bytes,
      isPublic: true,
    });
    expect(readPreview).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
    );
    expect(get).not.toHaveBeenCalled();
  });

  it('reads legacy bytes without an object key only for the owner', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const get = vi.fn().mockResolvedValue(null);
    const service = new SellersService(
      {
        sellerProfileRevisionAchievement: {
          findUnique: vi.fn().mockResolvedValue({
            mimeType: 'image/png',
            objectKey: null,
            mediaAssetId: null,
            data: bytes,
            revisionId: 'draft-revision-id',
            revision: {
              sellerProfile: {
                userId: 'owner-id',
                status: 'APPROVED',
                user: { status: 'active' },
                publishedRevisionId: 'published-revision-id',
              },
            },
          }),
        },
      } as never,
      { ...imageStore, get } as never,
    );

    await expect(
      service.getAchievementImage('achievement-id', 'stranger-id'),
    ).rejects.toThrow('Achievement image not found');
    expect(get).not.toHaveBeenCalled();

    await expect(
      service.getAchievementImage('achievement-id', 'owner-id'),
    ).resolves.toEqual({
      mimeType: 'image/png',
      data: bytes,
      isPublic: false,
    });
    expect(get).toHaveBeenCalledOnce();
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
              user: { status: 'active' },
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

  it('reads distinct public cities and disciplines as separate sets', async () => {
    const queryRaw = vi
      .fn()
      .mockResolvedValueOnce([{ city: 'Минск' }, { city: ' Минск ' }])
      .mockResolvedValueOnce([
        { tag: '00000000-0000-4000-8000-000000000001' },
        { tag: '00000000-0000-4000-8000-000000000002' },
      ]);
    const service = new SellersService(
      { $queryRaw: queryRaw } as never,
      imageStore as never,
    );

    await expect(service.listPublicFacets()).resolves.toEqual({
      cities: ['Минск', ' Минск '],
      tags: [
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
      ],
    });

    expect(queryRaw).toHaveBeenCalledTimes(2);
    const citySql = String(queryRaw.mock.calls[0]?.[0]?.sql);
    const tagSql = String(queryRaw.mock.calls[1]?.[0]?.sql);
    expect(citySql).toContain('SELECT DISTINCT "city"');
    expect(tagSql).toContain('seller_profile_revision_directions');
    expect(tagSql).toContain('category_id');
    expect(citySql).not.toContain('SELECT "city", "discipline"');
    expect(tagSql).not.toContain('SELECT DISTINCT "discipline"');
    for (const sql of [citySql, tagSql]) {
      expect(sql).toContain(`author."status" = 'APPROVED'`);
      expect(sql).not.toContain(`NULLIF(BTRIM(author."city"), '') IS NOT NULL`);
      expect(sql).not.toContain('LOWER(');
      expect(sql).not.toContain('unnest');
    }
  });

  it('keeps the achievement deletion when image removal fails', async () => {
    const marker = 'object-secret-marker';
    const objectKey = `seller-achievement:${marker}`;
    const failure = new Error(`delete ${marker}`);
    failure.stack = [
      failure.toString(),
      `    at ImageStore.delete (/tmp/${marker}.js:2:2)`,
      '    at ImageStore.delete (/app/dist/core/image-store/image-store.js:18:4)',
    ].join('\n');
    const remove = vi.fn().mockRejectedValue(failure);
    const tx = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ id: 'profile-id' }])
        .mockResolvedValueOnce([{ id: 'revision-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'profile-id',
          status: 'DRAFT',
          editingRevision: { id: 'revision-id', status: 'DRAFT' },
        }),
      },
      sellerProfileRevisionAchievement: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: 'achievement-id' })
          .mockResolvedValueOnce({
            id: 'achievement-id',
            objectKey,
            mediaAssetId: null,
          }),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
    };
    const service = new SellersService(
      {
        $transaction: vi.fn(
          async (callback: (client: typeof tx) => Promise<unknown>) =>
            callback(tx),
        ),
      } as never,
      { ...imageStore, delete: remove } as never,
    );
    const loggerWarn = vi
      .spyOn(
        (service as unknown as { logger: { warn: (...args: unknown[]) => void } })
          .logger,
        'warn',
      )
      .mockImplementation(() => undefined);

    await expect(
      service.deleteAchievement('user-id', 'achievement-id'),
    ).resolves.toEqual({ ok: true });

    expect(remove).toHaveBeenCalledWith(objectKey);
    expect(loggerWarn).toHaveBeenCalledOnce();
    expect(loggerWarn.mock.calls[0]).toHaveLength(1);
    const logged = JSON.stringify(loggerWarn.mock.calls);
    expect(logged).toContain('Failed to delete unreferenced achievement image');
    expect(logged).toContain('at=dist/core/image-store/image-store.js:18');
    expect(logged).not.toContain(marker);
    loggerWarn.mockRestore();
  });

  it.each([0, 1])(
    'compacts remaining achievements after deleting legacy media with %i other references',
    async (remainingReferences) => {
      const assetId = '11111111-1111-4111-8111-111111111111';
      const update = vi.fn().mockResolvedValue({});
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'profile-id' }]),
        sellerProfile: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'profile-id',
            status: 'DRAFT',
            editingRevision: { id: 'revision-id', status: 'DRAFT' },
            publishedRevision: null,
          }),
        },
        sellerProfileRevisionAchievement: {
          findFirst: vi
            .fn()
            .mockResolvedValueOnce({ id: 'achievement-id' })
            .mockResolvedValueOnce({
              id: 'achievement-id',
              objectKey: 'legacy:image',
              mediaAssetId: assetId,
            }),
          delete: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([
            { id: 'other-a', position: 0 },
            { id: 'other-b', position: 4 },
          ]),
          update,
          count: vi.fn().mockResolvedValue(remainingReferences),
        },
      };
      const media = { enabled: true, enqueueCleanup: vi.fn() };
      const remove = vi.fn();
      const service = new SellersService(
        {
          $transaction: vi.fn(
            async (run: (client: typeof tx) => Promise<unknown>) => run(tx),
          ),
        } as never,
        { ...imageStore, delete: remove } as never,
        media as never,
      );

      await expect(
        service.deleteAchievement('user-id', 'achievement-id'),
      ).resolves.toEqual({ ok: true });

      expect(
        update.mock.calls.map(([arg]) => [arg.where.id, arg.data.position]),
      ).toEqual([
        ['other-a', 5],
        ['other-b', 6],
        ['other-a', 0],
        ['other-b', 1],
      ]);
      expect(tx.sellerProfileRevisionAchievement.count).toHaveBeenCalledWith({
        where: { mediaAssetId: assetId },
      });
      if (remainingReferences === 0) {
        expect(media.enqueueCleanup).toHaveBeenCalledWith(tx, [assetId]);
      } else {
        expect(media.enqueueCleanup).not.toHaveBeenCalled();
      }
      expect(remove).not.toHaveBeenCalled();
    },
  );
});

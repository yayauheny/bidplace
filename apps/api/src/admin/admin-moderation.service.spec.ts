import { describe, expect, it, vi } from 'vitest';

import { adminModerationListQuerySchema } from '@bidplace/contracts';
import { BadRequestException, ConflictException } from '@nestjs/common';

import {
  moderationListOrderBy,
  productModerationWhere,
  sellerModerationWhere,
} from './admin-moderation-list';
import { AdminModerationService } from './admin-moderation.service';
import {
  sellerProfileAuthSelect,
  sellerProfileResponseSelect,
} from '../sellers/seller-profile.mapper';

function sqlText(query: { strings?: readonly string[] } | undefined) {
  return query?.strings?.join(' ') ?? '';
}

function moderationService(prisma: object) {
  return new AdminModerationService(prisma as never, { get: vi.fn() } as never);
}

function transactionPrisma(tx: object) {
  return {
    $transaction: vi.fn(
      async (callback: (client: object) => Promise<unknown>) => callback(tx),
    ),
  };
}

const sellerId = '00000000-0000-4000-8000-000000000001';
const productId = '00000000-0000-4000-8000-000000000002';
const listQuery = adminModerationListQuerySchema.parse({});
const stepId = '00000000-0000-4000-8000-000000000003';
const now = new Date('2026-09-26T12:00:00.000Z');
const revisionTarget = {
  kind: 'revision' as const,
  id: 'revision-id',
  updatedAt: now.toISOString(),
};

function parentModerationTarget<Status extends string>(status: Status) {
  return {
    kind: 'parent' as const,
    status,
    updatedAt: now.toISOString(),
  };
}

function sellerProfileRecord() {
  return {
    id: sellerId,
    userId: '00000000-0000-4000-8000-000000000004',
    slug: 'author-name',
    fullName: 'Author Name',
    sellerType: 'creator',
    discipline: 'Painting',
    country: 'BY',
    city: 'Minsk',
    practice: null,
    biography: null,
    socialLink: null,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    publicEmail: null,
    shortDescription: 'Author description',
    handoffContactType: null,
    handoffContactValue: null,
    handoffInitiator: null,
    status: 'PENDING_REVIEW',
    applicationStage: null,
    createdAt: now,
    updatedAt: now,
  };
}

function productRecord() {
  return {
    id: productId,
    publicId: 'abcdefghijk',
    sellerProfileId: sellerId,
    categoryId: null,
    title: 'Moderated work',
    story: 'Work story',
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
    publishedAt: null,
    status: 'PENDING_REVIEW',
    editingRevisionId: null,
    publishedRevisionId: null,
    createdAt: now,
    updatedAt: now,
    images: [],
  };
}

describe('AdminModerationService', () => {
  it('projects non-draft sellers with the latest non-null reason and blocking listing state', async () => {
    const sellerProfile = sellerProfileRecord();
    const prisma = {
      sellerProfile: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([sellerProfile])
          .mockResolvedValueOnce([{ id: sellerId }]),
      },
      $queryRaw: vi
        .fn()
        .mockResolvedValue([{ target_id: sellerId, reason: 'Newest reason' }]),
    };
    const service = moderationService(prisma);

    await expect(service.listSellerProfiles(listQuery)).resolves.toMatchObject({
      sellerProfiles: [
        {
          id: sellerId,
          parentStatus: 'PENDING_REVIEW',
          reviewTarget: null,
          lastModerationReason: 'Newest reason',
          hasBlockingListing: true,
        },
      ],
      nextCursor: null,
    });
    expect(prisma.sellerProfile.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: sellerModerationWhere(listQuery, null),
        orderBy: moderationListOrderBy,
        take: listQuery.limit + 1,
      }),
    );
    expect(sqlText(prisma.$queryRaw.mock.calls[0]?.[0])).toContain(
      'DISTINCT ON ("target_id")',
    );
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('hydrates a searched seller page in SQL order without reading the extra row', async () => {
    const sellerProfile = sellerProfileRecord();
    const laterId = '00000000-0000-4000-8000-000000000099';
    const extraId = '00000000-0000-4000-8000-000000000098';
    const prisma = {
      sellerProfile: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            { ...sellerProfile, id: laterId },
            sellerProfile,
          ])
          .mockResolvedValueOnce([]),
      },
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([
          { id: sellerId, created_at: now },
          { id: laterId, created_at: new Date('2026-09-26T12:00:01.000Z') },
          { id: extraId, created_at: new Date('2026-09-26T12:00:02.000Z') },
        ])
        .mockResolvedValueOnce([
          { target_id: sellerId, reason: 'Newest reason' },
        ]),
    };
    const service = moderationService(prisma);
    const query = adminModerationListQuerySchema.parse({
      search: 'Alpha parent',
      limit: 2,
    });

    await expect(service.listSellerProfiles(query)).resolves.toMatchObject({
      sellerProfiles: [{ id: sellerId }, { id: laterId }],
      nextCursor: expect.any(String),
    });
    expect(prisma.sellerProfile.findMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [sellerId, laterId] } },
      select: expect.any(Object),
    });
    expect(sqlText(prisma.$queryRaw.mock.calls[0]?.[0])).toContain('ILIKE');
    expect(sqlText(prisma.$queryRaw.mock.calls[1]?.[0])).toContain(
      'DISTINCT ON ("target_id")',
    );
    expect(JSON.stringify(prisma.$queryRaw.mock.calls[1]?.[0])).toContain(
      sellerId,
    );
    expect(JSON.stringify(prisma.$queryRaw.mock.calls[1]?.[0])).not.toContain(
      extraId,
    );
  });

  it('projects product moderation context without per-product reads', async () => {
    const product = {
      ...productRecord(),
      sellerProfile: {
        slug: 'author-name',
        fullName: 'Author Name',
        status: 'APPROVED',
      },
      creationIntro: 'Creation introduction',
      creationSteps: [
        {
          id: stepId,
          position: 0,
          title: 'First step',
          body: 'Step body',
          mimeType: 'image/jpeg',
          byteLength: 120,
          checksum: 'a'.repeat(64),
          width: 100,
          height: 200,
        },
      ],
      listings: [{ status: 'LIVE' }],
    };
    const prisma = {
      product: { findMany: vi.fn().mockResolvedValue([product]) },
      $queryRaw: vi
        .fn()
        .mockResolvedValue([
          { target_id: productId, reason: 'Newest product reason' },
        ]),
    };
    const service = moderationService(prisma);

    await expect(service.listProducts(listQuery)).resolves.toMatchObject({
      products: [
        {
          id: productId,
          sellerProfile: product.sellerProfile,
          parentStatus: 'PENDING_REVIEW',
          reviewTarget: null,
          parent: expect.objectContaining({
            creationIntro: 'Creation introduction',
            title: 'Moderated work',
          }),
          creationSteps: [
            {
              id: stepId,
              image: expect.objectContaining({
                url: `/api/creation-steps/${stepId}/image`,
              }),
            },
          ],
          lastModerationReason: 'Newest product reason',
          hasBlockingListing: true,
        },
      ],
      nextCursor: null,
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: productModerationWhere(listQuery, null),
        orderBy: moderationListOrderBy,
        take: listQuery.limit + 1,
      }),
    );
    expect(sqlText(prisma.$queryRaw.mock.calls[0]?.[0])).toContain(
      '"reason" <> \'\'',
    );
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('pages sellers by createdAt and id and keeps one reason row per page target', async () => {
    const sameTime = new Date('2026-09-26T12:00:00.000Z');
    const later = new Date('2026-09-26T12:00:01.000Z');
    const ids = [
      '00000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000012',
      '00000000-0000-4000-8000-000000000013',
    ];
    const rows = ids.map((id, index) => ({
      ...sellerProfileRecord(),
      id,
      createdAt: index === 2 ? later : sameTime,
    }));
    const prisma = {
      sellerProfile: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce(rows.slice(0, 2))
          .mockResolvedValueOnce([]),
      },
      $queryRaw: vi
        .fn()
        .mockResolvedValue([{ target_id: ids[0], reason: 'Latest for first' }]),
    };
    const service = moderationService(prisma);
    const query = adminModerationListQuerySchema.parse({ limit: 1 });

    const page = await service.listSellerProfiles(query);

    expect(prisma.sellerProfile.findMany.mock.calls[0]?.[0]).toMatchObject({
      take: 2,
    });
    expect(page.sellerProfiles).toHaveLength(1);
    expect(page.sellerProfiles[0]?.id).toBe(ids[0]);
    expect(page.sellerProfiles[0]?.lastModerationReason).toBe(
      'Latest for first',
    );
    expect(page.nextCursor).toEqual(expect.any(String));
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const auditQuery = JSON.stringify(prisma.$queryRaw.mock.calls[0]?.[0]);
    expect(auditQuery).toContain(ids[0]);
    expect(auditQuery).not.toContain(ids[1]);
    expect(auditQuery).not.toContain(ids[2]);
    expect(sqlText(prisma.$queryRaw.mock.calls[0]?.[0])).toContain(
      'ORDER BY "target_id", "created_at" DESC, "id" DESC',
    );

    prisma.sellerProfile.findMany
      .mockResolvedValueOnce([rows[1], rows[2]])
      .mockResolvedValueOnce([]);
    prisma.$queryRaw.mockResolvedValueOnce([{ target_id: ids[1], reason: '' }]);
    const next = await service.listSellerProfiles({
      ...query,
      cursor: page.nextCursor ?? undefined,
    });
    expect(next.sellerProfiles.map((seller) => seller.id)).toEqual([ids[1]]);
    expect(next.sellerProfiles[0]?.lastModerationReason).toBeNull();
    expect(prisma.sellerProfile.findMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: sellerModerationWhere(query, {
          createdAt: sameTime.toISOString(),
          id: ids[0],
        }),
        take: 2,
      }),
    );
  });

  it('rejects an invalid cursor before reading moderation rows', async () => {
    const prisma = {
      sellerProfile: { findMany: vi.fn() },
      product: { findMany: vi.fn() },
      $queryRaw: vi.fn(),
    };
    const service = moderationService(prisma);

    await expect(
      service.listSellerProfiles({ ...listQuery, cursor: 'not-a-cursor' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.listProducts({ ...listQuery, cursor: 'not-a-cursor' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sellerProfile.findMany).not.toHaveBeenCalled();
    expect(prisma.product.findMany).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('does not query audit rows for an empty page', async () => {
    const prisma = {
      sellerProfile: { findMany: vi.fn().mockResolvedValue([]) },
      product: { findMany: vi.fn().mockResolvedValue([]) },
      $queryRaw: vi.fn(),
    };
    const service = moderationService(prisma);

    await expect(service.listSellerProfiles(listQuery)).resolves.toEqual({
      sellerProfiles: [],
      nextCursor: null,
    });
    await expect(service.listProducts(listQuery)).resolves.toEqual({
      products: [],
      nextCursor: null,
    });
    expect(prisma.sellerProfile.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns the canonical product response after a committed status update', async () => {
    const persisted = { ...productRecord(), status: 'ARCHIVED' };
    const txProduct = {
      id: productId,
      status: 'APPROVED',
      updatedAt: now,
      sellerProfile: { status: 'APPROVED' },
      images: [],
      editingRevision: null,
      listings: [],
    };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: productId }]),
      product: {
        findUnique: vi.fn().mockResolvedValue(txProduct),
        update: vi.fn().mockResolvedValue({ id: productId }),
      },
      auditEvent: { create: vi.fn() },
    };
    const prisma = {
      ...transactionPrisma(tx),
      product: { findUniqueOrThrow: vi.fn().mockResolvedValue(persisted) },
    };
    const service = moderationService(prisma);

    await expect(
      service.updateProductStatusAndReadback('admin-id', productId, {
        status: 'ARCHIVED',
        reason: 'Archive the published work',
        target: parentModerationTarget('APPROVED'),
      }),
    ).resolves.toMatchObject({
      product: { id: productId, status: 'ARCHIVED' },
    });
    expect(prisma.product.findUniqueOrThrow).toHaveBeenCalledOnce();
  });

  it('approves a pending profile revision without exposing it before moderation', async () => {
    const revision = {
      id: 'revision-id',
      status: 'PENDING_REVIEW',
      slug: 'updated-author',
      discipline: 'Painting',
      fullName: 'Updated author',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      biography: null,
      socialLink: 'https://example.com',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Updated description',
      updatedAt: now,
    };
    const sellerProfile = {
      id: 'seller-id',
      status: 'APPROVED',
      updatedAt: now,
      profilePhotoData: new Uint8Array([1]),
      editingRevision: revision,
    };
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue(sellerProfile),
        update: vi.fn().mockResolvedValue({ ...sellerProfile }),
      },
      sellerProfileRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = moderationService(transactionPrisma(tx));

    await service.updateSellerStatus('admin-id', 'seller-id', {
      status: 'APPROVED',
      target: revisionTarget,
    });

    expect(tx.sellerProfileRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-id' },
      data: expect.objectContaining({ status: 'APPROVED' }),
    });
    expect(tx.sellerProfile.update).toHaveBeenCalledWith({
      where: { id: 'seller-id' },
      data: expect.objectContaining({
        publishedRevisionId: 'revision-id',
        fullName: 'Updated author',
      }),
      select: sellerProfileResponseSelect,
    });
  });

  it('requests changes for an editing revision without hiding the published product', async () => {
    const product = {
      id: 'product-id',
      status: 'APPROVED',
      updatedAt: now,
      sellerProfile: { status: 'APPROVED' },
      images: [{ id: 'image-id' }],
      listings: [],
      editingRevision: {
        id: 'revision-editing',
        status: 'PENDING_REVIEW',
        updatedAt: now,
        images: [{ imageId: 'image-id' }],
      },
    };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue(product),
        update: vi.fn().mockResolvedValue(product),
      },
      productRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = moderationService(transactionPrisma(tx));

    await service.updateProductStatus('admin-id', 'product-id', {
      status: 'CHANGES_REQUESTED',
      reason: 'Добавьте подтверждение происхождения',
      target: {
        kind: 'revision',
        id: 'revision-editing',
        updatedAt: now.toISOString(),
      },
    });

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.productRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-editing' },
      data: expect.objectContaining({ status: 'CHANGES_REQUESTED' }),
    });
    expect(tx.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      include: {
        sellerProfile: { select: sellerProfileAuthSelect },
        images: { select: { id: true } },
        editingRevision: {
          include: { images: { select: { imageId: true } } },
        },
        listings: {
          where: { status: { in: ['SCHEDULED', 'LIVE'] } },
          select: { id: true },
        },
      },
    });
    expect(tx.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: 'Добавьте подтверждение происхождения',
          newStatus: 'CHANGES_REQUESTED',
        }),
      }),
    );
  });

  it('publishes an approved revision as the new public work', async () => {
    const editingRevision = {
      id: 'revision-editing',
      status: 'PENDING_REVIEW',
      categoryId: 'category-id',
      title: 'Approved title',
      story: 'Approved story',
      technique: null,
      materials: null,
      dimensions: null,
      weight: null,
      year: null,
      condition: 'New',
      uniqueness: 'Unique',
      provenance: 'Created by author',
      city: 'Minsk',
      packaging: 'Box',
      deliveryInfo: 'Contact author',
      creationIntro: null,
      updatedAt: now,
      images: [{ imageId: 'image-id' }],
    };
    const product = {
      id: 'product-id',
      status: 'PENDING_REVIEW',
      updatedAt: now,
      sellerProfile: { status: 'APPROVED' },
      images: [{ id: 'image-id' }],
      listings: [],
      editingRevision,
    };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue(product),
        update: vi.fn().mockResolvedValue({ ...product, status: 'APPROVED' }),
      },
      productRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = moderationService(transactionPrisma(tx));

    await service.updateProductStatus('admin-id', 'product-id', {
      status: 'APPROVED',
      target: {
        kind: 'revision',
        id: 'revision-editing',
        updatedAt: now.toISOString(),
      },
    });

    expect(tx.productRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-editing' },
      data: expect.objectContaining({ status: 'APPROVED' }),
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      data: expect.objectContaining({
        status: 'APPROVED',
        publishedRevisionId: 'revision-editing',
        title: 'Approved title',
      }),
    });
  });

  it('blocks admin from reopening a REJECTED product', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'product-id',
          status: 'REJECTED',
          updatedAt: now,
          sellerProfile: { status: 'APPROVED' },
          images: [{ id: 'image-id' }],
          listings: [],
          editingRevision: null,
        }),
        update: vi.fn(),
      },
      auditEvent: { create: vi.fn() },
    };
    const service = moderationService(transactionPrisma(tx));

    await expect(
      service.updateProductStatus('admin-id', 'product-id', {
        status: 'APPROVED',
        target: parentModerationTarget('REJECTED'),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });

  it('blocks a limiting product action while its listing is scheduled or LIVE', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'product-id',
          status: 'APPROVED',
          updatedAt: now,
          sellerProfile: { status: 'APPROVED' },
          images: [{ id: 'image-id' }],
          listings: [{ id: 'listing-id', status: 'SCHEDULED' }],
          editingRevision: null,
        }),
      },
    };
    const service = moderationService(transactionPrisma(tx));

    await expect(
      service.updateProductStatus('admin-id', 'product-id', {
        status: 'CHANGES_REQUESTED',
        reason: 'Нужна правка',
        target: parentModerationTarget('APPROVED'),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks seller suspension while one of its listings is LIVE', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-id',
          status: 'APPROVED',
          updatedAt: now,
          editingRevision: null,
        }),
      },
      listing: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'listing-id', status: 'SCHEDULED' }),
      },
    };
    const service = moderationService(transactionPrisma(tx));

    await expect(
      service.updateSellerStatus('admin-id', 'seller-id', {
        status: 'SUSPENDED',
        reason: 'Нужна проверка',
        target: parentModerationTarget('APPROVED'),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a stale seller revision without writes or audit', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-id',
          status: 'APPROVED',
          updatedAt: now,
          editingRevision: {
            id: 'revision-id',
            status: 'PENDING_REVIEW',
            updatedAt: new Date('2026-09-26T13:00:00.000Z'),
          },
        }),
        update: vi.fn(),
      },
      sellerProfileRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = moderationService(transactionPrisma(tx));

    await expect(
      service.updateSellerStatus('admin-id', 'seller-id', {
        status: 'APPROVED',
        target: revisionTarget,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.sellerProfile.update).not.toHaveBeenCalled();
    expect(tx.sellerProfileRevision.update).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });

  it('restores a suspended parent without publishing its pending revision', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-id',
          status: 'SUSPENDED',
          updatedAt: now,
          fullName: 'Published name',
          city: 'Minsk',
          shortDescription: 'Published description',
          profilePhotoData: new Uint8Array([1]),
          editingRevision: {
            id: 'revision-id',
            status: 'PENDING_REVIEW',
            updatedAt: now,
            fullName: 'Pending name',
          },
        }),
        update: vi.fn().mockResolvedValue({ id: 'seller-id' }),
      },
      sellerProfileRevision: { update: vi.fn() },
      listing: { findFirst: vi.fn().mockResolvedValue(null) },
      auditEvent: { create: vi.fn() },
    };
    const service = moderationService(transactionPrisma(tx));

    await service.updateSellerStatus('admin-id', 'seller-id', {
      status: 'APPROVED',
      target: parentModerationTarget('SUSPENDED'),
    });

    expect(tx.sellerProfileRevision.update).not.toHaveBeenCalled();
    expect(tx.sellerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'APPROVED' },
      }),
    );
  });

  it('approves a legacy parent and refuses to treat it as a revision', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-id',
          status: 'PENDING_REVIEW',
          updatedAt: now,
          fullName: 'Legacy author',
          city: 'Minsk',
          shortDescription: 'Legacy description',
          profilePhotoData: new Uint8Array([1]),
          editingRevision: null,
        }),
        update: vi.fn().mockResolvedValue({ id: 'seller-id' }),
      },
      sellerProfileRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = moderationService(transactionPrisma(tx));

    await service.updateSellerStatus('admin-id', 'seller-id', {
      status: 'APPROVED',
      target: parentModerationTarget('PENDING_REVIEW'),
    });

    expect(tx.sellerProfileRevision.update).not.toHaveBeenCalled();
    expect(tx.sellerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'APPROVED' },
      }),
    );
  });

  it('does not let a parent target approve a pending seller revision', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-id',
          status: 'APPROVED',
          updatedAt: now,
          editingRevision: {
            id: 'revision-id',
            status: 'PENDING_REVIEW',
            updatedAt: now,
          },
        }),
        update: vi.fn(),
      },
      sellerProfileRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = moderationService(transactionPrisma(tx));

    await expect(
      service.updateSellerStatus('admin-id', 'seller-id', {
        status: 'APPROVED',
        target: parentModerationTarget('APPROVED'),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.sellerProfile.update).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });
});

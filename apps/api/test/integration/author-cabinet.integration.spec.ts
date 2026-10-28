import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';
import { portfolioCabinetWorksResponseSchema } from '@bidplace/contracts';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let prisma: PrismaClient;

type CabinetWorkInput = {
  sellerProfileId: string;
  categoryId: string;
  publicId: string;
  parentStatus: 'DRAFT' | 'APPROVED' | 'ARCHIVED' | 'CHANGES_REQUESTED';
  parentTitle: string;
  parentUpdatedAt: Date;
  editingStatus: 'DRAFT' | 'CHANGES_REQUESTED';
  editingTitle: string | null;
  editingUpdatedAt: Date;
  hasPublishedImage?: boolean;
};

async function createCabinetWork(input: CabinetWorkInput) {
  const product = await prisma.product.create({
    data: {
      publicId: input.publicId,
      sellerProfileId: input.sellerProfileId,
      categoryId: input.categoryId,
      title: input.parentTitle,
      story: 'Cabinet integration fixture story.',
      status: input.parentStatus,
      publishedAt:
        input.parentStatus === 'APPROVED' || input.parentStatus === 'ARCHIVED'
          ? input.parentUpdatedAt
          : null,
      images: input.hasPublishedImage
        ? {
            create: {
              position: 0,
              mimeType: 'image/png',
              byteLength: 4,
              data: Buffer.from([1, 2, 3, 4]),
              checksum: '1'.repeat(64),
            },
          }
        : undefined,
    },
    include: { images: { select: { id: true } } },
  });
  const publishedRevision =
    input.parentStatus === 'APPROVED' || input.parentStatus === 'ARCHIVED'
      ? await prisma.productRevision.create({
          data: {
            productId: product.id,
            version: 1,
            status: 'APPROVED',
            categoryId: input.categoryId,
            title: input.parentTitle,
            story: 'Published cabinet fixture story.',
            images: product.images[0]
              ? { create: { imageId: product.images[0].id, position: 0 } }
              : undefined,
          },
        })
      : null;
  const editingRevision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: publishedRevision ? 2 : 1,
      status: input.editingStatus,
      categoryId: input.categoryId,
      title: input.editingTitle,
      story: 'Editing cabinet fixture story.',
    },
  });
  await prisma.productRevision.update({
    where: { id: editingRevision.id },
    data: { updatedAt: input.editingUpdatedAt },
  });
  return prisma.product.update({
    where: { id: product.id },
    data: {
      editingRevisionId: editingRevision.id,
      publishedRevisionId: publishedRevision?.id,
      updatedAt: input.parentUpdatedAt,
    },
    select: { id: true, publicId: true },
  });
}

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl);
});

afterEach(async () => resetPermissionFixture(prisma));

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function login(
  client: HttpTestClient,
  credentials: {
    email: string;
    password: string;
  },
) {
  expect(
    await client.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    }),
  ).toMatchObject({
    status: 201,
  });
}

describe('author cabinet HTTP contract', () => {
  it('returns paginated owner work projections and preserves public visibility', async () => {
    const fixture = await createPermissionFixture(prisma);
    const approved = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const pending = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const suspended = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const other = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const now = new Date('2026-09-24T10:00:00.000Z');
    const yesterday = new Date('2026-09-23T10:00:00.000Z');
    const monthAgo = new Date('2026-08-24T10:00:00.000Z');
    const revised = await createCabinetWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'cabinet0001',
      parentStatus: 'APPROVED',
      parentTitle: 'Old public title',
      parentUpdatedAt: monthAgo,
      editingStatus: 'DRAFT',
      editingTitle: 'New owner title',
      editingUpdatedAt: now,
      hasPublishedImage: true,
    });
    const recentParent = await createCabinetWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'cabinet0002',
      parentStatus: 'DRAFT',
      parentTitle: 'Yesterday parent',
      parentUpdatedAt: yesterday,
      editingStatus: 'DRAFT',
      editingTitle: 'Yesterday owner title',
      editingUpdatedAt: yesterday,
    });
    const archived = await createCabinetWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'cabinet0003',
      parentStatus: 'ARCHIVED',
      parentTitle: 'Archived public title',
      parentUpdatedAt: yesterday,
      editingStatus: 'DRAFT',
      editingTitle: 'Archived edit',
      editingUpdatedAt: yesterday,
      hasPublishedImage: true,
    });
    const changesWithoutReason = await createCabinetWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'cabinet0004',
      parentStatus: 'CHANGES_REQUESTED',
      parentTitle: 'Changes requested',
      parentUpdatedAt: yesterday,
      editingStatus: 'CHANGES_REQUESTED',
      editingTitle: 'Changes requested edit',
      editingUpdatedAt: yesterday,
    });
    const changesWithReason = await createCabinetWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'cabinet0005',
      parentStatus: 'CHANGES_REQUESTED',
      parentTitle: 'Changes with reason',
      parentUpdatedAt: yesterday,
      editingStatus: 'CHANGES_REQUESTED',
      editingTitle: 'Changes with reason edit',
      editingUpdatedAt: yesterday,
    });
    await prisma.auditEvent.createMany({
      data: [
        {
          targetType: 'PRODUCT',
          targetId: changesWithoutReason.id,
          oldStatus: 'PENDING_REVIEW',
          newStatus: 'CHANGES_REQUESTED',
          reason: 'Old problem',
          createdAt: monthAgo,
        },
        {
          targetType: 'PRODUCT',
          targetId: changesWithoutReason.id,
          oldStatus: 'PENDING_REVIEW',
          newStatus: 'CHANGES_REQUESTED',
          reason: null,
          createdAt: now,
        },
        {
          targetType: 'PRODUCT',
          targetId: changesWithReason.id,
          oldStatus: 'PENDING_REVIEW',
          newStatus: 'CHANGES_REQUESTED',
          reason: 'Current problem',
          createdAt: now,
        },
      ],
    });

    expect((await guest.get('/author/cabinet/works')).status).toBe(401);
    await login(approved, fixture.sellers.approved);
    await login(pending, fixture.sellers.pending);
    await login(suspended, fixture.sellers.suspended);
    await login(other, fixture.sellers.otherApproved);

    const response = await approved.get(
      '/author/cabinet/works?page=1&limit=20',
    );
    expect(response.status).toBe(200);
    const body = portfolioCabinetWorksResponseSchema.parse(
      await response.json(),
    );
    expect(body.pagination).toEqual({ page: 1, limit: 20, total: 8 });
    expect(body.works.map((work) => work.id)).not.toContain(
      fixture.sellers.otherApproved.productId,
    );
    expect(body.works.find((work) => work.id === revised.id)).toMatchObject({
      id: revised.id,
      title: 'New owner title',
      updatedAt: now.toISOString(),
      coverImage: null,
    });
    expect(
      body.works.findIndex((work) => work.id === revised.id),
    ).toBeLessThan(
      body.works.findIndex((work) => work.id === recentParent.id),
    );
    expect(body.works.find((work) => work.id === archived.id)).toMatchObject({
      status: 'ARCHIVED',
    });
    expect(
      body.works.find((work) => work.id === changesWithoutReason.id)
        ?.moderationMessage,
    ).toBeNull();
    expect(
      body.works.find((work) => work.id === changesWithReason.id)
        ?.moderationMessage,
    ).toBe('Current problem');

    const secondPageResponse = await approved.get(
      '/author/cabinet/works?page=2&limit=5',
    );
    expect(secondPageResponse.status).toBe(200);
    const secondPage = portfolioCabinetWorksResponseSchema.parse(
      await secondPageResponse.json(),
    );
    expect(secondPage.pagination).toEqual({ page: 2, limit: 5, total: 8 });
    expect(secondPage.works).toHaveLength(3);

    expect((await approved.get(`/works/${archived.publicId}`)).status).toBe(
      404,
    );
    expect((await approved.get(`/works/${revised.publicId}`)).status).toBe(200);

    expect((await pending.get('/author/cabinet/works')).status).toBe(403);
    expect((await suspended.get('/author/cabinet/works')).status).toBe(200);
    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.pending.profileId },
      data: { status: 'DRAFT' },
    });
    expect((await pending.get('/author/cabinet/works')).status).toBe(403);

    expect((await other.post(`/products/${revised.id}/hide`)).status).toBe(403);
    expect((await approved.post(`/products/${revised.id}/hide`)).status).toBe(
      201,
    );
    const hidden = portfolioCabinetWorksResponseSchema.parse(
      await (await approved.get('/author/cabinet/works')).json(),
    );
    expect(hidden.works.find((work) => work.id === revised.id)).toMatchObject({
      status: 'ARCHIVED',
    });
    expect((await approved.get(`/works/${revised.publicId}`)).status).toBe(404);
    expect((await approved.post(`/products/${revised.id}/unhide`)).status).toBe(
      201,
    );
    expect((await approved.get(`/works/${revised.publicId}`)).status).toBe(200);
  });
});

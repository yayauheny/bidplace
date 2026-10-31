import { randomUUID } from 'node:crypto';

import { portfolioWorksResponseSchema } from '@bidplace/contracts';
import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/core/database';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  permissionImage,
  resetPermissionFixture,
  type PermissionFixture,
} from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

process.env.BIDPLACE_QUERY_COUNT = '1';

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let prisma: PrismaClient;

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl, 'http://localhost:8081');
}, 30_000);

afterEach(async () => {
  await prisma.favoriteWork.deleteMany();
  await resetPermissionFixture(prisma);
});

afterAll(async () => {
  delete process.env.BIDPLACE_QUERY_COUNT;
  await http?.close();
  await database?.cleanup();
});

const DEAL_PHONE = '+375291112244';
const HIDDEN_TITLE = 'HIDDEN-WORK-TITLE-9f3a';
let clientSerial = 0;

function client() {
  clientSerial += 1;
  const host = (clientSerial % 200) + 1;
  const net = (Math.floor(clientSerial / 200) % 200) + 1;
  return new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    `198.51.${net}.${host}`,
  );
}

async function signedIn(email: string) {
  const actor = client();
  const response = await actor.post('/auth/login', {
    email,
    password: 'password123',
  });
  expect(response.status).toBe(201);
  return actor;
}

function publicId(): string {
  return `f${randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

async function createPublicWork(fixture: PermissionFixture, title: string) {
  const seller = fixture.sellers.approved;
  const product = await prisma.product.create({
    data: {
      publicId: publicId(),
      sellerProfileId: seller.profileId,
      categoryId: fixture.categoryId,
      title,
      story: 'Favorite fixture',
      status: 'DRAFT',
      images: {
        create: {
          position: 0,
          mimeType: 'image/png',
          byteLength: permissionImage.byteLength,
          data: permissionImage,
          checksum: 'ab'.repeat(32),
        },
      },
    },
    select: { id: true, publicId: true, images: { select: { id: true } } },
  });
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status: 'APPROVED',
      categoryId: fixture.categoryId,
      title,
      story: 'Favorite fixture',
      images: {
        create: { imageId: product.images[0]!.id, position: 0 },
      },
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: {
      status: 'APPROVED',
      editingRevisionId: revision.id,
      publishedRevisionId: revision.id,
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    },
  });
  return product;
}

async function favoriteRows(userId: string, productId: string) {
  return prisma.favoriteWork.count({ where: { userId, productId } });
}

describe('favorite works', () => {
  it('excludes a deleted work from favorites and its count while retaining the favorite row', async () => {
    const fixture = await createPermissionFixture(prisma);
    const work = await createPublicWork(fixture, 'Deleted favorite');
    const buyer = await signedIn(fixture.buyer.email);
    const owner = await signedIn(fixture.sellers.approved.email);
    expect((await buyer.put(`/works/${work.id}/favorite`)).status).toBe(204);
    expect((await owner.delete(`/products/${work.id}`)).status).toBe(204);
    expect((await buyer.put(`/works/${work.id}/favorite`)).status).toBe(404);
    const response = await buyer.get('/me/favorites');
    expect(response.status).toBe(200);
    const body = portfolioWorksResponseSchema.parse(await response.json());
    expect(body.works).toEqual([]);
    expect(body.pagination.total).toBe(0);
    expect(await favoriteRows(fixture.buyer.id, work.id)).toBe(1);
  });
  it('rejects an anonymous reader and writer', async () => {
    const actor = client();
    const productId = randomUUID();
    expect((await actor.get('/me/favorites')).status).toBe(401);
    expect((await actor.put(`/works/${productId}/favorite`)).status).toBe(401);
    expect((await actor.delete(`/works/${productId}/favorite`)).status).toBe(401);
  });

  it('stores one row for two puts and omits a hidden work without deleting the row', async () => {
    const fixture = await createPermissionFixture(prisma);
    const seller = fixture.sellers.approved;
    const hidden = await createPublicWork(fixture, HIDDEN_TITLE);
    const visible = await createPublicWork(fixture, 'PUBLIC-WORK-TITLE-9f3a');
    await prisma.user.update({
      where: { id: seller.id },
      data: { contactPhone: DEAL_PHONE },
    });
    const actor = await signedIn(fixture.buyer.email);
    const other = await signedIn(fixture.sellers.otherApproved.email);

    expect((await actor.put(`/works/${randomUUID()}/favorite`)).status).toBe(404);
    expect((await actor.put(`/works/${fixture.approvedDraftProductId}/favorite`)).status).toBe(404);
    expect(await favoriteRows(fixture.buyer.id, fixture.approvedDraftProductId)).toBe(0);

    const first = await actor.put(`/works/${visible.id}/favorite`);
    const second = await actor.put(`/works/${visible.id}/favorite`);
    expect(first.status).toBe(204);
    expect(second.status).toBe(204);
    expect(first.headers.get('cache-control')).toBe('private, no-store');
    expect(await favoriteRows(fixture.buyer.id, visible.id)).toBe(1);
    const saved = await prisma.favoriteWork.findUniqueOrThrow({
      where: {
        userId_productId: { userId: fixture.buyer.id, productId: visible.id },
      },
    });

    expect((await actor.put(`/works/${hidden.id}/favorite`)).status).toBe(204);
    await prisma.product.update({
      where: { id: hidden.id },
      data: { status: 'ARCHIVED' },
    });
    expect((await actor.put(`/works/${hidden.id}/favorite`)).status).toBe(404);
    expect(await favoriteRows(fixture.buyer.id, hidden.id)).toBe(1);

    const response = await actor.get('/me/favorites');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const body = portfolioWorksResponseSchema.parse(await response.json());
    expect(body.works.map((row) => row.work.id)).toEqual([visible.id]);
    expect(body.pagination).toEqual({ page: 1, limit: 20, total: 1 });
    const raw = JSON.stringify(body);
    expect(raw).not.toContain(HIDDEN_TITLE);
    expect(raw).not.toContain(DEAL_PHONE);
    expect(raw).not.toContain('contactPhone');
    expect(raw).toContain('PUBLIC-WORK-TITLE-9f3a');

    const theirs = portfolioWorksResponseSchema.parse(
      await (await other.get('/me/favorites')).json(),
    );
    expect(theirs.works).toEqual([]);

    await prisma.product.update({
      where: { id: hidden.id },
      data: { status: 'APPROVED' },
    });
    const restored = portfolioWorksResponseSchema.parse(
      await (await actor.get('/me/favorites')).json(),
    );
    expect(restored.works.map((row) => row.work.id).sort()).toEqual(
      [hidden.id, visible.id].sort(),
    );
    const kept = await prisma.favoriteWork.findUniqueOrThrow({
      where: {
        userId_productId: { userId: fixture.buyer.id, productId: visible.id },
      },
    });
    expect(kept.createdAt.toISOString()).toBe(saved.createdAt.toISOString());

    expect((await actor.delete(`/works/${visible.id}/favorite`)).status).toBe(204);
    expect((await actor.delete(`/works/${visible.id}/favorite`)).status).toBe(204);
    expect(await favoriteRows(fixture.buyer.id, visible.id)).toBe(0);
    expect((await actor.delete(`/works/${randomUUID()}/favorite`)).status).toBe(404);
  });

  it('pages public favorites newest first', async () => {
    const fixture = await createPermissionFixture(prisma);
    const older = await createPublicWork(fixture, 'Older favorite');
    const middle = await createPublicWork(fixture, 'Middle favorite');
    const newer = await createPublicWork(fixture, 'Newer favorite');
    const actor = await signedIn(fixture.buyer.email);
    for (const productId of [older.id, middle.id, newer.id]) {
      expect((await actor.put(`/works/${productId}/favorite`)).status).toBe(204);
    }
    await prisma.favoriteWork.update({
      where: { userId_productId: { userId: fixture.buyer.id, productId: older.id } },
      data: { createdAt: new Date('2026-09-01T00:00:00.000Z') },
    });
    await prisma.favoriteWork.update({
      where: { userId_productId: { userId: fixture.buyer.id, productId: middle.id } },
      data: { createdAt: new Date('2026-09-02T00:00:00.000Z') },
    });
    await prisma.favoriteWork.update({
      where: { userId_productId: { userId: fixture.buyer.id, productId: newer.id } },
      data: { createdAt: new Date('2026-09-03T00:00:00.000Z') },
    });

    const page = await actor.get('/me/favorites?page=1&limit=2');
    expect(page.status).toBe(200);
    const first = portfolioWorksResponseSchema.parse(await page.json());
    expect(first.works.map((row) => row.work.id)).toEqual([newer.id, middle.id]);
    expect(first.pagination).toEqual({ page: 1, limit: 2, total: 3 });
    const second = portfolioWorksResponseSchema.parse(
      await (await actor.get('/me/favorites?page=2&limit=2')).json(),
    );
    expect(second.works.map((row) => row.work.id)).toEqual([older.id]);
    expect(second.pagination).toEqual({ page: 2, limit: 2, total: 3 });
    expect((await actor.get('/me/favorites?page=0')).status).toBe(400);
  });

  it('uses the same number of queries for one favorite and for several', async () => {
    const fixture = await createPermissionFixture(prisma);
    const first = await createPublicWork(fixture, 'Query one');
    const actor = await signedIn(fixture.buyer.email);
    expect((await actor.put(`/works/${first.id}/favorite`)).status).toBe(204);
    PrismaService.queryCount = 0;
    const onceBody = portfolioWorksResponseSchema.parse(
      await (await actor.get('/me/favorites?limit=20')).json(),
    );
    expect(onceBody.works).toHaveLength(1);
    const once = PrismaService.queryCount;
    expect(once).toBeGreaterThan(0);

    for (let index = 0; index < 3; index += 1) {
      const extra = await createPublicWork(fixture, `Query ${index + 2}`);
      expect((await actor.put(`/works/${extra.id}/favorite`)).status).toBe(204);
    }
    PrismaService.queryCount = 0;
    const many = portfolioWorksResponseSchema.parse(
      await (await actor.get('/me/favorites?limit=20')).json(),
    );
    expect(many.works).toHaveLength(4);
    expect(PrismaService.queryCount).toBe(once);
    expect(once).toBeLessThan(25);
  });
});

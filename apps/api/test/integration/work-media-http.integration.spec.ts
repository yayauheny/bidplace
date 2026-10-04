import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { MediaLifecycleService } from '../../src/core/media/media-lifecycle.service';
import {
  S3MediaObjectStore,
  type StoredMedia,
} from '../../src/core/media/media-object-store';
import { CloudflarePublicMediaCache } from '../../src/core/media/public-media-cache';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import { fixturePasswordHash } from './permission-fixtures';
import {
  productModerationRequest,
  sellerModerationRequest,
} from './admin-status-request';

let db: IntegrationDatabaseContext;
let http: HttpTestApp;
let media: MediaLifecycleService;
const objects = new Map<string, StoredMedia>();
let unavailable = false;
const purged: string[] = [];
beforeAll(async () => {
  for (const [name, value] of Object.entries({
    MEDIA_STORAGE_PROVIDER: 's3',
    S3_ENDPOINT: 'https://r2.example.test',
    S3_REGION: 'auto',
    S3_BUCKET: 'private',
    S3_PUBLIC_BUCKET: 'public',
    S3_ACCESS_KEY_ID: 'fixture',
    S3_SECRET_ACCESS_KEY: 'fixture',
    MEDIA_PUBLIC_BASE_URL: 'https://media.example.test',
    CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
    CLOUDFLARE_CACHE_TOKEN: 'fixture',
  }))
    vi.stubEnv(name, value);
  vi.spyOn(S3MediaObjectStore.prototype, 'get').mockImplementation(
    async (tier, key) => objects.get(`${tier}:${key}`) ?? null,
  );
  vi.spyOn(S3MediaObjectStore.prototype, 'put').mockImplementation(
    async (tier, key, value) => {
      if (tier === 'PUBLIC' && unavailable) throw new Error('R2 outage');
      objects.set(`${tier}:${key}`, value);
    },
  );
  vi.spyOn(S3MediaObjectStore.prototype, 'delete').mockImplementation(
    async (tier, key) => {
      objects.delete(`${tier}:${key}`);
    },
  );
  vi.spyOn(CloudflarePublicMediaCache.prototype, 'purge').mockImplementation(
    async (urls) => {
      purged.push(...urls);
    },
  );
  db = await createIntegrationDatabaseContext();
  http = await createHttpTestApp(db.databaseUrl);
  media = http.app.get(MediaLifecycleService);
  media.onModuleDestroy(); // Drive the existing executor deterministically at failure boundaries.
});
afterAll(async () => {
  await http?.close();
  await db?.cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function user(role: 'user' | 'admin', suffix: string) {
  const row = await db.prisma.user.create({
    data: {
      email: `${suffix}@work.test`,
      passwordHash: fixturePasswordHash,
      displayName: suffix,
      role,
      emailVerifiedAt: new Date(),
    },
  });
  const client = new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    row.id,
  );
  expect(
    (
      await client.post('/auth/login', {
        email: row.email,
        password: 'password123',
      })
    ).status,
  ).toBe(201);
  return { row, client };
}
async function run(
  kind: 'PUBLISH' | 'REVOKE',
  productId?: string,
  profileId?: string,
) {
  const operations = await db.prisma.mediaOperation.findMany({
    where: {
      kind,
      ...(productId ? { productId } : {}),
      ...(profileId ? { profileId } : {}),
      state: { in: ['PENDING', 'FAILED'] },
    },
  });
  for (const operation of operations) await media.run(operation.id);
}
function upload(bytes: Buffer) {
  const form = new FormData();
  form.append(
    'images',
    new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
    'work.png',
  );
  return form;
}

describe('Work media lifecycle over authenticated HTTP and PostgreSQL', () => {
  it('creates, uploads once, submits, waits for delivery, publishes, revises atomically and revokes exact public objects', async () => {
    const author = await user('user', 'author');
    const admin = await user('admin', 'admin');
    const outsider = await user('user', 'outsider');
    const bytes = await sharp({
      create: { width: 200, height: 100, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    const photo = new FormData();
    for (const [key, value] of Object.entries({
      slug: 'http-media-author',
      fullName: 'HTTP author',
      country: 'BY',
      city: 'Minsk',
      discipline: 'Автор',
      shortDescription: 'Portfolio author',
    }))
      photo.set(key, value);
    photo.set(
      'profilePhoto',
      new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
      'photo.png',
    );
    const createdAuthor = await author.client.post('/seller/profile', photo);
    expect(createdAuthor.status).toBe(201);
    const profileId = (await createdAuthor.json()).sellerProfile.id;
    await author.client.post('/author/application/advance');
    await author.client.post('/author/application/advance');
    expect(
      (await author.client.post('/author/application/submit')).status,
    ).toBe(201);
    expect(
      (
        await admin.client.patch(
          `/admin/seller-profiles/${profileId}/status`,
          await sellerModerationRequest(db.prisma, profileId, 'APPROVED'),
        )
      ).status,
    ).toBe(200);
    await run('PUBLISH', undefined, profileId);
    const category = await db.prisma.category.create({
      data: { slug: 'http-media', name: 'HTTP media' },
    });
    const created = await author.client.post('/products', {
      title: 'First work',
      categoryId: category.id,
    });
    expect(created.status).toBe(201);
    const work = (await created.json()).product;
    const imagePath = `/products/${work.id}/images`;
    const add = (client: HttpTestClient, body = bytes, key = 'first-upload') =>
      client.request(imagePath, {
        method: 'POST',
        headers: { 'Idempotency-Key': key },
        body: upload(body),
      });
    expect((await add(outsider.client)).status).toBe(403);
    expect((await add(author.client, bytes, 'invalid key')).status).toBe(400);
    const multiple = upload(bytes);
    multiple.append(
      'images',
      new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
      'second.png',
    );
    expect(
      (
        await author.client.request(imagePath, {
          method: 'POST',
          headers: { 'Idempotency-Key': 'two-files' },
          body: multiple,
        })
      ).status,
    ).toBe(400);
    expect((await add(author.client)).status).toBe(201);
    expect((await add(author.client)).status).toBe(201);
    expect(
      await db.prisma.productImage.count({ where: { productId: work.id } }),
    ).toBe(1);
    const different = await sharp(bytes).negate().png().toBuffer();
    expect((await add(author.client, different)).status).toBe(409);
    const firstImage = await db.prisma.productImage.findFirstOrThrow({
      where: { productId: work.id },
    });
    expect(
      (await new HttpTestClient(http.baseUrl).get(`/images/${firstImage.id}`))
        .status,
    ).toBe(404);
    expect(
      (await author.client.post(`/products/${work.id}/submit`)).status,
    ).toBe(201);
    expect(
      (await author.client.post(`/products/${work.id}/submit`)).status,
    ).toBe(201);
    const approval = await productModerationRequest(
      db.prisma,
      work.id,
      'APPROVED',
    );
    expect(
      (await admin.client.patch(`/admin/products/${work.id}/status`, approval))
        .status,
    ).toBe(200);
    expect(
      (await admin.client.patch(`/admin/products/${work.id}/status`, approval))
        .status,
    ).toBe(200);
    unavailable = true;
    await run('PUBLISH', work.id);
    const pending = await author.client.get(`/seller/products/${work.id}`);
    expect((await pending.json()).publication.state).toBe('FAILED');
    expect(
      (await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`))
        .status,
    ).toBe(404);
    unavailable = false;
    await run('PUBLISH', work.id);
    const publishedAudits = await db.prisma.auditEvent.count({
      where: { targetId: work.id },
    });
    expect(
      (await admin.client.patch(`/admin/products/${work.id}/status`, approval))
        .status,
    ).toBe(200);
    expect(
      await db.prisma.auditEvent.count({ where: { targetId: work.id } }),
    ).toBe(publishedAudits);
    expect(
      (
        await admin.client.patch(`/admin/products/${work.id}/status`, {
          ...approval,
          target: { ...approval.target, updatedAt: new Date(0).toISOString() },
        })
      ).status,
    ).toBe(409);
    const publicWork = await (
      await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`)
    ).json();
    const preview = publicWork.work.images[0];
    expect(preview.url).toMatch(/\/preview.webp$/);
    expect(preview.full.url).toMatch(/\/full.webp$/);
    const oldPublicId = (
      await db.prisma.product.findUniqueOrThrow({ where: { id: work.id } })
    ).publishedRevisionId;
    expect(
      (
        await author.client.patch(`/products/${work.id}`, {
          title: 'Revised work',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await author.client.delete(
          `/products/${work.id}/images/${firstImage.id}`,
        )
      ).status,
    ).toBe(200);
    expect((await add(author.client)).status).toBe(409);
    expect(
      (await add(author.client, different, 'revision-upload')).status,
    ).toBe(201);
    expect(
      (await author.client.post(`/products/${work.id}/submit`)).status,
    ).toBe(201);
    expect(
      (
        await admin.client.patch(
          `/admin/products/${work.id}/status`,
          await productModerationRequest(db.prisma, work.id, 'APPROVED'),
        )
      ).status,
    ).toBe(200);
    unavailable = true;
    await run('PUBLISH', work.id);
    expect(
      (
        await (
          await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`)
        ).json()
      ).work.title,
    ).toBe('First work');
    expect(
      (await db.prisma.product.findUniqueOrThrow({ where: { id: work.id } }))
        .publishedRevisionId,
    ).toBe(oldPublicId);
    unavailable = false;
    await run('PUBLISH', work.id);
    await run('REVOKE', work.id);
    const revised = await (
      await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`)
    ).json();
    expect(revised.work.title).toBe('Revised work');
    expect(revised.work.images[0].url).not.toBe(preview.url);
    expect(
      objects.has(`PUBLIC:${new URL(preview.url).pathname.slice(1)}`),
    ).toBe(false);
    expect((await author.client.post(`/products/${work.id}/hide`)).status).toBe(
      201,
    );
    expect(
      (await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`))
        .status,
    ).toBe(404);
    await run('REVOKE', work.id);
    for (const image of revised.work.images)
      for (const url of [image.url, image.full.url]) {
        expect(objects.has(`PUBLIC:${new URL(url).pathname.slice(1)}`)).toBe(
          false,
        );
        expect(purged).toContain(url);
      }
    expect(
      [...objects.keys()].filter((key) => key.includes('/source.')).length,
    ).toBe(3);
    expect(
      (await author.client.post(`/products/${work.id}/unhide`)).status,
    ).toBe(201);
    await run('PUBLISH', work.id);
    const guest = new HttpTestClient(http.baseUrl);
    expect((await guest.get(`/works/${work.publicId}`)).status).toBe(200);
    const currentImage = await db.prisma.productImage.findFirstOrThrow({
      where: {
        productId: work.id,
        mediaAssetId: { not: firstImage.mediaAssetId },
      },
    });
    expect(
      (
        await admin.client.patch(`/admin/users/${author.row.id}/status`, {
          status: 'banned',
          reason: 'HTTP lifecycle revoke',
        })
      ).status,
    ).toBe(200);
    for (const path of [
      `/works/${work.publicId}`,
      '/authors/http-media-author',
      `/images/${currentImage.id}`,
      '/sellers/http-media-author/photo',
    ])
      expect((await guest.get(path)).status).toBe(404);
    const catalogue = await (await guest.get('/works?page=1&limit=12')).json();
    expect(catalogue.works).toEqual([]);
    expect(
      (await (await guest.get('/authors?page=1&limit=12')).json()).authors,
    ).toEqual([]);
    await run('REVOKE', undefined, profileId);
    for (const url of [
      revised.work.images[0].url,
      revised.work.images[0].full.url,
    ]) {
      expect(objects.has(`PUBLIC:${new URL(url).pathname.slice(1)}`)).toBe(
        false,
      );
      expect(purged).toContain(url);
    }
    expect((await guest.get(`/works/${work.publicId}`)).status).toBe(404);
  });
});

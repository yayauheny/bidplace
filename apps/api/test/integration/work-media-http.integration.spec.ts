import {
  ApiErrorCode,
  sellerProfileResponseSchema,
  productResponseSchema,
  sellerProductDetailResponseSchema,
  portfolioWorkDetailResponseSchema,
  portfolioWorksResponseSchema,
  portfolioAuthorsResponseSchema,
} from '@bidplace/contracts';
import { createHash, randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../src/core/database';
import { RetryableTransactionConflict } from '../../src/core/database/transaction';
import { normalizeCatalogName } from '../../src/catalog/catalog-data';
import {
  MediaLifecycleService,
  mediaUploadIdentity,
} from '../../src/core/media/media-lifecycle.service';
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
import {
  attachAuthorDirection,
  createPermissionFixture,
  fixturePasswordHash,
} from './permission-fixtures';
import {
  productModerationRequest,
  sellerModerationRequest,
} from './admin-status-request';
import { sellerProfileForm } from './seller-profile-form';

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
      slug: suffix,
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
async function moderationFixture() {
  const fixture = await createPermissionFixture(db.prisma);
  await db.prisma.category.update({
    where: { id: fixture.categoryId },
    data: { normalizedName: normalizeCatalogName(`Wave 3 category ${fixture.categoryId}`) },
  });
  return fixture;
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
function upload(bytes: Buffer, format: 'jpeg' | 'png' | 'webp' = 'png') {
  const form = new FormData();
  form.append(
    'images',
    new Blob([new Uint8Array(bytes)], { type: `image/${format}` }),
    `work.${format}`,
  );
  return form;
}

describe('Work media lifecycle over authenticated HTTP and PostgreSQL', () => {
  it('uploads JPEG, PNG and WebP through multipart HTTP and replays each without duplicates', async () => {
    const suffix = `formats-${randomUUID().slice(0, 8)}`;
    const owner = await user('user', suffix);
    const profile = await db.prisma.sellerProfile.create({
      data: {
        userId: owner.row.id,
        slug: suffix,
        sellerType: 'creator',
        fullName: 'Format check',
        country: 'BY',
        shortDescription: 'Format check',
        status: 'APPROVED',
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: 1,
        profilePhotoChecksum: 'c'.repeat(64),
        profilePhotoData: Buffer.from('x'),
      },
    });
    const product = await db.prisma.product.create({
      data: {
        sellerProfileId: profile.id,
        publicId: `f${randomUUID().replace(/-/g, '').slice(0, 10)}`,
        title: 'Format check',
      },
    });
    const revision = await db.prisma.productRevision.create({
      data: {
        productId: product.id,
        version: 1,
        status: 'DRAFT',
        title: 'Format check',
      },
    });
    await db.prisma.product.update({
      where: { id: product.id },
      data: { editingRevisionId: revision.id },
    });
    try {
      for (const [index, format] of (
        ['jpeg', 'png', 'webp'] as const
      ).entries()) {
        const bytes = await sharp({
          create: {
            width: 64,
            height: 48,
            channels: format === 'jpeg' ? 3 : 4,
            background: { r: 45, g: 120, b: 190, alpha: 0.5 },
          },
        })
          .toFormat(format)
          .withExif({ IFD0: { Artist: 'Private author' } })
          .toBuffer();
        const send = () =>
          owner.client.request(`/products/${product.id}/images`, {
            method: 'POST',
            headers: { 'Idempotency-Key': `format-${format}` },
            body: upload(bytes, format),
          });
        expect((await send()).status).toBe(201);
        expect((await send()).status).toBe(201);
        const rows = await db.prisma.productImage.findMany({
          where: { productId: product.id },
          orderBy: { position: 'asc' },
        });
        expect(rows).toHaveLength(index + 1);
        const response = await owner.client.get(`/images/${rows[index]!.id}`);
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('image/webp');
        expect(response.headers.get('cache-control')).toBe('private, no-store');
        const rendered = Buffer.from(await response.arrayBuffer());
        const metadata = await sharp(rendered).metadata();
        expect([metadata.width, metadata.height]).toEqual([64, 48]);
        expect(metadata.hasAlpha).toBe(format !== 'jpeg');
        expect(metadata.exif).toBeUndefined();
        expect((await sharp(rendered).raw().toBuffer()).length).toBeGreaterThan(
          0,
        );
      }
    } finally {
      await db.prisma.sellerProfile.update({
        where: { id: profile.id },
        data: { status: 'DRAFT' },
      });
    }
  });

  it('enforces the 10 MiB story multipart boundary and serializes concurrent sixth uploads', async () => {
    const suffix = `story-limits-${randomUUID().slice(0, 8)}`;
    const owner = await user('user', suffix);
    const profile = await db.prisma.sellerProfile.create({ data: {
      userId: owner.row.id, slug: suffix, sellerType: 'creator', fullName: 'Story limits',
      country: 'BY', shortDescription: 'Story limits', status: 'APPROVED',
      profilePhotoMimeType: 'image/png', profilePhotoByteLength: 1, profilePhotoChecksum: 'c'.repeat(64), profilePhotoData: Buffer.from('x'),
    } });
    const category = await db.prisma.category.findFirstOrThrow({ where: { active: true } });
    const work = await owner.client.post('/products', { title: 'Story limits', categoryId: category.id });
    expect(work.status).toBe(201);
    const { product } = await work.json() as { product: { id: string } };
    const originalRevisionId = (await db.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { editingRevisionId: true },
    })).editingRevisionId!;
    const png = await sharp({ create: { width: 64, height: 48, channels: 3, background: 'blue' } }).png().toBuffer();
    const send = (size: number, key: string) => {
      const form = new FormData();
      form.append('image', new Blob([new Uint8Array(Buffer.concat([png, Buffer.alloc(size - png.length)]))], { type: 'image/png' }), 'story.png');
      return owner.client.request(`/products/${product.id}/story-images`, {
        method: 'POST',
        headers: { 'Idempotency-Key': key, 'X-Photo-Revision': originalRevisionId },
        body: form,
      });
    };
    try {
      const accepted = await send(10 * 1024 * 1024, 'story-boundary');
      expect(accepted.status).toBe(201);
      const { mediaAssetId } = await accepted.json() as { mediaAssetId: string };
      expect((await send(10 * 1024 * 1024, 'story-boundary')).status).toBe(201);
      expect([400, 413]).toContain((await send(10 * 1024 * 1024 + 1, 'too-large')).status);
      expect((await owner.client.delete(`/products/${product.id}/story-images/${randomUUID()}`)).status).toBe(200);
      for (let i = 0; i < 3; i += 1) expect((await send(png.length, `story-${i}`)).status).toBe(201);
      const original = media.stage.bind(media);
      const stage = vi.spyOn(media, 'stage');
      let arrivals = 0;
      let release!: () => void;
      const bothStaged = new Promise<void>((resolve) => { release = resolve; });
      stage.mockImplementation(async (...args) => {
        // Both requests must pass admission before either can attach.
        const asset = await original(...args);
        arrivals += 1;
        if (arrivals === 2) release();
        await bothStaged;
        return asset;
      });
      try {
        const results = await Promise.all([send(png.length, 'race-a'), send(png.length, 'race-b')]);
        expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
        expect(await db.prisma.productRevisionStoryAsset.count({ where: { revision: { productId: product.id } } })).toBe(5);
      } finally { stage.mockRestore(); }
      expect((await send(10 * 1024 * 1024, 'story-boundary')).status).toBe(201);
      expect(await db.prisma.mediaAsset.findUniqueOrThrow({ where: { id: mediaAssetId } })).toMatchObject({ state: 'READY' });
    } finally {
      await db.prisma.sellerProfile.update({ where: { id: profile.id }, data: { status: 'DRAFT' } });
    }
  });

  it('keeps a story upload on its original revision when that revision changes around staging', async () => {
    const suffix = `story-revision-${randomUUID().slice(0, 8)}`;
    const owner = await user('user', suffix);
    const profile = await db.prisma.sellerProfile.create({ data: {
      userId: owner.row.id, slug: suffix, sellerType: 'creator', fullName: 'Story revision',
      country: 'BY', shortDescription: 'Story revision', status: 'APPROVED',
      profilePhotoMimeType: 'image/png', profilePhotoByteLength: 1, profilePhotoChecksum: 'c'.repeat(64), profilePhotoData: Buffer.from('x'),
    } });
    const category = await db.prisma.category.findFirstOrThrow({ where: { active: true } });
    const work = await owner.client.post('/products', { title: 'Story revision', categoryId: category.id });
    expect(work.status).toBe(201);
    const { product } = await work.json() as { product: { id: string } };
    const originalRevisionId = (await db.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { editingRevisionId: true },
    })).editingRevisionId!;
    const png = await sharp({ create: { width: 64, height: 48, channels: 3, background: 'blue' } }).png().toBuffer();
    const send = (key: string, revisionId: string) => {
      const form = new FormData();
      form.append('image', new Blob([png], { type: 'image/png' }), 'story.png');
      return owner.client.request(`/products/${product.id}/story-images`, {
        method: 'POST',
        headers: { 'Idempotency-Key': key, 'X-Photo-Revision': revisionId },
        body: form,
      });
    };
    const holds = (revisionId: string) => db.prisma.productRevisionStoryAsset.count({ where: { revisionId } });
    try {
      const lost = await send('story-replay', originalRevisionId);
      expect(lost.status).toBe(201);
      const replay = await send('story-replay', originalRevisionId);
      expect(replay.status).toBe(201);
      expect(await lost.json()).toEqual(await replay.json());
      expect(await holds(originalRevisionId)).toBe(1);

      const next = await db.prisma.productRevision.create({
        data: { productId: product.id, version: 2, status: 'DRAFT', title: 'Next' },
      });
      await db.prisma.product.update({
        where: { id: product.id },
        data: { editingRevisionId: next.id },
      });
      expect((await send('story-replay', originalRevisionId)).status).toBe(409);
      expect((await send('story-replay', next.id)).status).toBe(409);
      expect(await holds(next.id)).toBe(0);
      expect(await holds(originalRevisionId)).toBe(1);
      const identity = mediaUploadIdentity(
        owner.row.id,
        'STORY_IMAGE',
        createHash('sha256').update(`${product.id}:story:story-replay`).digest('hex'),
      );
      expect(await db.prisma.mediaOperation.count({ where: { identity } })).toBe(1);

      await db.prisma.product.update({
        where: { id: product.id },
        data: { editingRevisionId: originalRevisionId },
      });
      const original = media.stage.bind(media);
      const stage = vi.spyOn(media, 'stage');
      stage.mockImplementation(async (...args) => {
        const asset = await original(...args);
        await db.prisma.product.update({
          where: { id: product.id },
          data: { editingRevisionId: next.id },
        });
        return asset;
      });
      try {
        expect((await send('story-race', originalRevisionId)).status).toBe(409);
      } finally {
        stage.mockRestore();
      }
      expect(await holds(next.id)).toBe(0);
      expect(await holds(originalRevisionId)).toBe(1);

      await db.prisma.product.update({
        where: { id: product.id },
        data: { editingRevisionId: originalRevisionId },
      });
      vi.mocked(S3MediaObjectStore.prototype.put).mockRejectedValueOnce(new Error('private upload interrupted'));
      expect((await send('story-partial', originalRevisionId)).status).toBe(500);
      await db.prisma.product.update({
        where: { id: product.id },
        data: { editingRevisionId: next.id },
      });
      expect((await send('story-partial', next.id)).status).toBe(409);
      expect(await holds(next.id)).toBe(0);
      await db.prisma.product.update({
        where: { id: product.id },
        data: { editingRevisionId: originalRevisionId },
      });
      expect((await send('story-partial', originalRevisionId)).status).toBe(201);
      expect(await holds(originalRevisionId)).toBe(2);
    } finally {
      await db.prisma.sellerProfile.update({ where: { id: profile.id }, data: { status: 'DRAFT' } });
    }
  });

  it('creates, uploads once, submits, waits for delivery, publishes, revises atomically and revokes exact public objects', async () => {
    const author = await user('user', 'author');
    const admin = await user('admin', 'admin');
    const outsider = await user('user', 'outsider');
    const bytes = await sharp({
      create: { width: 200, height: 100, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    const photo = sellerProfileForm(
      {
        fullName: 'HTTP author',
        country: 'BY',
        city: 'Minsk',
        discipline: 'Автор',
        shortDescription: 'Portfolio author',
      },
      new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
    );
    const createdAuthor = await author.client.post('/seller/profile', photo);
    expect(createdAuthor.status).toBe(201);
    const profileId = (sellerProfileResponseSchema.parse(await createdAuthor.json())).sellerProfile.id;
    const application = await db.prisma.sellerProfile.findUniqueOrThrow({
      where: { id: profileId },
      select: { editingRevisionId: true },
    });
    await attachAuthorDirection(db.prisma, application.editingRevisionId!);
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
      data: {
        slug: 'http-media',
        name: 'HTTP media',
        normalizedName: normalizeCatalogName('HTTP media'),
      },
    });
    const created = await author.client.post('/products', {
      title: 'First work',
      categoryId: category.id,
    });
    expect(created.status).toBe(201);
    const work = (productResponseSchema.parse(await created.json())).product;
    const imagePath = `/products/${work.id}/images`;
    const largeInput = Buffer.concat([
      bytes,
      Buffer.alloc(7 * 1024 * 1024 - bytes.length),
    ]);
    const add = (
      client: HttpTestClient,
      body = largeInput,
      key = 'first-upload',
    ) =>
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
    const normalized = await db.prisma.mediaObject.findFirstOrThrow({
      where: {
        variant: 'SOURCE',
        asset: { images: { some: { productId: work.id } } },
      },
    });
    expect(normalized.byteLength).toBeLessThanOrEqual(5 * 1024 * 1024);
    expect(normalized.sha256).not.toBe(
      createHash('sha256').update(largeInput).digest('hex'),
    );
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
    unavailable = true;
    expect(
      (await admin.client.patch(`/admin/products/${work.id}/status`, approval))
        .status,
    ).toBe(409);
    const pending = await author.client.get(`/seller/products/${work.id}`);
    expect((sellerProductDetailResponseSchema.parse(await pending.json())).publication!.state).toBe('FAILED');
    expect(
      (await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`))
        .status,
    ).toBe(404);
    unavailable = false;
    expect(
      (await admin.client.patch(`/admin/products/${work.id}/status`, approval))
        .status,
    ).toBe(200);
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
    const publicWork = portfolioWorkDetailResponseSchema.parse(await (
      await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`)
    ).json());
    const preview = publicWork.work.images[0];
    expect(preview.url).toMatch(/\/preview.webp$/);
    expect(preview.full!.url).toMatch(/\/full.webp$/);
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
    const revisionApproval = await productModerationRequest(
      db.prisma,
      work.id,
      'APPROVED',
    );
    unavailable = true;
    expect(
      (
        await admin.client.patch(
          `/admin/products/${work.id}/status`,
          revisionApproval,
        )
      ).status,
    ).toBe(409);
    expect(
      (
        portfolioWorkDetailResponseSchema.parse(await (
          await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`)
        ).json())
      ).work.title,
    ).toBe('First work');
    expect(
      (await db.prisma.product.findUniqueOrThrow({ where: { id: work.id } }))
        .publishedRevisionId,
    ).toBe(oldPublicId);
    unavailable = false;
    expect(
      (
        await admin.client.patch(
          `/admin/products/${work.id}/status`,
          revisionApproval,
        )
      ).status,
    ).toBe(200);
    const revised = portfolioWorkDetailResponseSchema.parse(await (
      await new HttpTestClient(http.baseUrl).get(`/works/${work.publicId}`)
    ).json());
    expect(revised.work.title).toBe('Revised work');
    expect(revised.work.images[0]!.url).not.toBe(preview.url);
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
      for (const url of [image.url, image.full!.url]) {
        expect(objects.has(`PUBLIC:${new URL(url).pathname.slice(1)}`)).toBe(
          false,
        );
        expect(purged).toContain(url);
      }
    const retainedSources = await db.prisma.mediaObject.findMany({
      where: { variant: 'SOURCE', asset: { ownerUserId: author.row.id } },
      select: { objectKey: true },
    });
    expect(retainedSources).toHaveLength(3);
    expect(retainedSources.every(({ objectKey }) => objects.has(`PRIVATE:${objectKey}`))).toBe(true);
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
    const catalogue = portfolioWorksResponseSchema.parse(await (await guest.get('/works?page=1&limit=12')).json());
    expect(catalogue.works).toEqual([]);
    expect(
      (portfolioAuthorsResponseSchema.parse(await (await guest.get('/authors?page=1&limit=12')).json())).authors,
    ).toEqual([]);
    await run('REVOKE', undefined, profileId);
    for (const url of [
      revised.work.images[0]!.url,
      revised.work.images[0]!.full!.url,
    ]) {
      expect(objects.has(`PUBLIC:${new URL(url).pathname.slice(1)}`)).toBe(
        false,
      );
      expect(purged).toContain(url);
    }
    expect((await guest.get(`/works/${work.publicId}`)).status).toBe(404);
  });

  it('publishes only a story image that is in the published revision', async () => {
    const owner = await user('user', `story-read-${Date.now()}`);
    const outsider = await user('user', `story-outsider-${Date.now()}`);
    const painting = await db.prisma.category.findUniqueOrThrow({
      where: { slug: 'painting' },
    });
    const profile = await db.prisma.sellerProfile.create({
      data: {
        userId: owner.row.id,
        slug: `story-read-${owner.row.id.slice(0, 8)}`,
        sellerType: 'creator',
        fullName: 'Story reader',
        country: 'BY',
        shortDescription: 'Story images',
        status: 'APPROVED',
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: 8,
        profilePhotoChecksum: 'c'.repeat(64),
        profilePhotoData: Buffer.from('storypng'),
      },
    });
    const profileRevision = await db.prisma.sellerProfileRevision.create({
      data: {
        sellerProfileId: profile.id,
        version: 1,
        status: 'APPROVED',
        slug: profile.slug,
        fullName: profile.fullName,
        country: 'BY',
        shortDescription: profile.shortDescription,
        directions: { create: { categoryId: painting.id, position: 0 } },
      },
    });
    await db.prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        editingRevisionId: profileRevision.id,
        publishedRevisionId: profileRevision.id,
      },
    });
    const product = await db.prisma.product.create({
      data: {
        sellerProfileId: profile.id,
        publicId: `s${owner.row.id.replace(/-/g, '').slice(0, 10)}`,
        title: 'Story read',
        status: 'APPROVED',
        publishedAt: new Date(),
        categoryId: painting.id,
      },
    });
    const revision = await db.prisma.productRevision.create({
      data: {
        productId: product.id,
        version: 1,
        status: 'APPROVED',
        title: 'Story read',
        categoryId: painting.id,
      },
    });
    await db.prisma.product.update({
      where: { id: product.id },
      data: {
        editingRevisionId: revision.id,
        publishedRevisionId: revision.id,
      },
    });
    async function previewAsset(purpose: 'STORY_IMAGE') {
      const key = `story/${randomUUID()}`;
      objects.set(`PRIVATE:${key}`, {
        bytes: Buffer.from('story-preview'),
        mimeType: 'image/png',
      });
      return db.prisma.mediaAsset.create({
        data: {
          ownerUserId: owner.row.id,
          purpose,
          state: 'READY',
          objects: {
            create: [
              {
                variant: 'SOURCE',
                tier: 'PRIVATE',
                pipelineVersion: 'source',
                objectKey: `${key}/source`,
                mimeType: 'image/png',
                byteLength: 32,
                sha256: 'a'.repeat(64),
                width: 10,
                height: 10,
                state: 'READY',
              },
              {
                variant: 'PREVIEW',
                tier: 'PRIVATE',
                pipelineVersion: 'v1',
                objectKey: key,
                mimeType: 'image/png',
                byteLength: 13,
                sha256: 'b'.repeat(64),
                width: 10,
                height: 10,
                state: 'READY',
              },
            ],
          },
        },
      });
    }
    const publishedAsset = await previewAsset('STORY_IMAGE');
    const heldAsset = await previewAsset('STORY_IMAGE');
    await db.prisma.productRevisionStoryBlock.create({
      data: {
        revisionId: revision.id,
        position: 0,
        type: 'IMAGE',
        mediaAssetId: publishedAsset.id,
      },
    });
    await db.prisma.productRevisionStoryAsset.create({
      data: { revisionId: revision.id, mediaAssetId: heldAsset.id },
    });
    const guest = new HttpTestClient(http.baseUrl);
    const publishedPath = `/products/${product.id}/story-images/${publishedAsset.id}`;
    const heldPath = `/products/${product.id}/story-images/${heldAsset.id}`;
    const published = await guest.get(publishedPath);
    expect(published.status).toBe(200);
    expect(published.headers.get('cache-control')).not.toBe(
      'private, no-store',
    );
    expect((await guest.get(heldPath)).status).toBe(404);
    const owned = await owner.client.get(heldPath);
    expect(owned.status).toBe(200);
    expect(owned.headers.get('cache-control')).toBe('private, no-store');
    expect((await outsider.client.get(heldPath)).status).toBe(404);
    await db.prisma.product.update({
      where: { id: product.id },
      data: { status: 'ARCHIVED' },
    });
    expect((await guest.get(publishedPath)).status).toBe(404);
    await db.prisma.product.update({
      where: { id: product.id },
      data: { status: 'APPROVED' },
    });
    await db.prisma.sellerProfile.update({
      where: { id: profile.id },
      data: { status: 'SUSPENDED' },
    });
    expect((await guest.get(publishedPath)).status).toBe(404);
    expect((await owner.client.get(publishedPath)).status).toBe(200);
  });

  it.each(['ban', 'suspend'] as const)(
    'rolls back %s and its media journal when the transaction conflicts before commit',
    async (action) => {
      const fixture = await moderationFixture();
      const admin = await user('admin', `rollback-${randomUUID()}`);
      const target = fixture.sellers.approved;
      const assetId = randomUUID();
      await db.prisma.mediaAsset.create({ data: {
        id: assetId, ownerUserId: target.id, purpose: 'AUTHOR_PHOTO', state: 'READY',
        objects: { create: {
          tier: 'PUBLIC', variant: 'PREVIEW', pipelineVersion: 'p1', state: 'READY',
          objectKey: `assets/${assetId}/p1/preview.webp`, publicUrl: `https://media.example.test/assets/${assetId}/p1/preview.webp`, mimeType: 'image/webp',
          byteLength: 8, sha256: 'a'.repeat(64), width: 1, height: 1,
        } },
      } });
      const before = await db.prisma.user.findUniqueOrThrow({ where: { id: target.id } });
      const prisma = http.app.get(PrismaService);
      const original = prisma.$transaction.bind(prisma);
      const transaction = vi.spyOn(prisma, '$transaction').mockImplementation(async (callback, options) => {
        if (typeof callback !== 'function') throw new Error('Expected interactive transaction');
        return original(async (tx) => {
          await callback(tx);
          throw new RetryableTransactionConflict();
        }, options);
      });
      try {
        const response = action === 'ban'
          ? await admin.client.patch(`/admin/users/${target.id}/status`, { status: 'banned', reason: 'Rollback' })
          : await admin.client.patch(`/admin/seller-profiles/${target.profileId}/status`, await sellerModerationRequest(db.prisma, target.profileId, 'SUSPENDED', 'Rollback'));
        expect(response.status).toBe(409);
        expect(await response.json()).toMatchObject({ code: ApiErrorCode.CONFLICT, message: 'Conflict' });
        expect(transaction).toHaveBeenCalledTimes(3);
        expect(await db.prisma.user.findUniqueOrThrow({ where: { id: target.id } })).toMatchObject({ status: 'active', sessionVersion: before.sessionVersion });
        expect((await db.prisma.sellerProfile.findUniqueOrThrow({ where: { id: target.profileId } })).status).toBe('APPROVED');
        expect(await db.prisma.auditEvent.count({ where: { actorUserId: admin.row.id } })).toBe(0);
        expect(await db.prisma.mediaOperation.count({ where: { profileId: target.profileId } })).toBe(0);
      } finally {
        transaction.mockRestore();
      }
    },
  );

  it.each(['delete', 'purge'] as const)(
    'keeps committed moderation successful and journals %s failure until tick recovery',
    async (failure) => {
      const fixture = await moderationFixture();
      const admin = await user('admin', `delivery-${randomUUID()}`);
      const target = fixture.sellers.approved;
      const assetId = randomUUID();
      const key = `assets/${assetId}/p1/preview.webp`;
      const url = `https://media.example.test/${key}`;
      await db.prisma.mediaAsset.create({ data: {
        id: assetId, ownerUserId: target.id, purpose: 'AUTHOR_PHOTO', state: 'READY',
        objects: { create: [
          { tier: 'PUBLIC', variant: 'PREVIEW', pipelineVersion: 'p1', state: 'READY', objectKey: key, publicUrl: url, mimeType: 'image/webp', byteLength: 8, sha256: 'a'.repeat(64), width: 1, height: 1 },
          { tier: 'PRIVATE', variant: 'SOURCE', pipelineVersion: 'source', state: 'READY', objectKey: `assets/${assetId}/source.webp`, mimeType: 'image/webp', byteLength: 8, sha256: 'a'.repeat(64), width: 1, height: 1 },
        ] },
      } });
      const value = { bytes: new Uint8Array(8), mimeType: 'image/webp' };
      objects.set(`PUBLIC:${key}`, value);
      objects.set(`PRIVATE:assets/${assetId}/source.webp`, value);
      const deleteMock = vi.mocked(S3MediaObjectStore.prototype.delete);
      const purgeMock = vi.mocked(CloudflarePublicMediaCache.prototype.purge);
      const originalDelete = deleteMock.getMockImplementation()!;
      const originalPurge = purgeMock.getMockImplementation()!;
      const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      if (failure === 'delete') vi.mocked(S3MediaObjectStore.prototype.delete).mockRejectedValueOnce(new Error('Synthetic delete failure'));
      else vi.mocked(CloudflarePublicMediaCache.prototype.purge).mockRejectedValueOnce(new Error('Synthetic purge failure'));
      try {
        const body = await sellerModerationRequest(db.prisma, target.profileId, 'SUSPENDED', 'Delivery outage');
        expect((await admin.client.patch(`/admin/seller-profiles/${target.profileId}/status`, body)).status).toBe(200);
        const revoke = await db.prisma.mediaOperation.findFirstOrThrow({ where: { profileId: target.profileId, kind: 'REVOKE' } });
        expect(revoke).toMatchObject({ state: 'FAILED', errorCode: 'MEDIA_DELIVERY_FAILED', attemptCount: 1, leaseToken: null, leaseUntil: null });
        expect(warn).toHaveBeenCalledWith(`Post-commit media revoke failed: ${revoke.id}`);
        expect((await db.prisma.sellerProfile.findUniqueOrThrow({ where: { id: target.profileId } })).status).toBe('SUSPENDED');
        expect(await db.prisma.auditEvent.count({ where: { actorUserId: admin.row.id, action: 'DECISION' } })).toBe(1);
        await db.prisma.mediaOperation.update({ where: { id: revoke.id }, data: { nextAttemptAt: new Date(0) } });
        await media.tick();
        expect(await db.prisma.mediaOperation.findUniqueOrThrow({ where: { id: revoke.id } })).toMatchObject({ state: 'DONE', errorCode: null, leaseToken: null, leaseUntil: null });
        expect(objects.has(`PUBLIC:${key}`)).toBe(false);
        expect(objects.get(`PRIVATE:assets/${assetId}/source.webp`)).toEqual(value);
        expect(purged).toContain(url);
      } finally {
        warn.mockRestore();
        deleteMock.mockReset().mockImplementation(originalDelete);
        purgeMock.mockReset().mockImplementation(originalPurge);
      }
    },
  );

  it('returns committed ban success when the post-commit database scan fails and tick later revokes it', async () => {
    const fixture = await moderationFixture();
    const target = fixture.sellers.approved;
    const admin = await user('admin', `db-outage-${randomUUID()}`);
    const assetId = randomUUID();
    const key = `assets/${assetId}/p1/preview.webp`;
    await db.prisma.mediaAsset.create({ data: {
      id: assetId, ownerUserId: target.id, purpose: 'AUTHOR_PHOTO', state: 'READY',
      objects: { create: {
        tier: 'PUBLIC', variant: 'PREVIEW', pipelineVersion: 'p1', state: 'READY',
        objectKey: key, publicUrl: `https://media.example.test/${key}`, mimeType: 'image/webp',
        byteLength: 8, sha256: 'a'.repeat(64), width: 1, height: 1,
      } },
    } });
    objects.set(`PUBLIC:${key}`, { bytes: new Uint8Array(8), mimeType: 'image/webp' });
    const prisma = http.app.get(PrismaService);
    const original = media.deliverRevokes.bind(media);
    let scan: ReturnType<typeof vi.spyOn> | undefined;
    const delivery = vi.spyOn(media, 'deliverRevokes').mockImplementationOnce(async (target) => {
      scan = vi.spyOn(prisma.mediaOperation, 'findMany').mockRejectedValueOnce(new Error('Synthetic database outage'));
      await original(target);
    });
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      expect((await admin.client.patch(`/admin/users/${target.id}/status`, { status: 'banned', reason: 'Database outage' })).status).toBe(200);
      expect(error).toHaveBeenCalledWith('Post-commit media revoke scan failed');
      const revoke = await db.prisma.mediaOperation.findFirstOrThrow({ where: { profileId: target.profileId, kind: 'REVOKE' } });
      expect(revoke.state).toBe('PENDING');
      scan?.mockRestore();
      await media.tick();
      expect((await db.prisma.mediaOperation.findUniqueOrThrow({ where: { id: revoke.id } })).state).toBe('DONE');
      expect(objects.has(`PUBLIC:${key}`)).toBe(false);
    } finally {
      scan?.mockRestore();
      delivery.mockRestore();
      error.mockRestore();
    }
  });

  it('commits concurrent suspension and ban while a leased revoke recovers through tick', async () => {
    const fixture = await moderationFixture();
    const admin = await user('admin', `lock-admin-${randomUUID()}`);
    const profileId = fixture.sellers.approved.profileId;
    const mediaId = randomUUID();
    await db.prisma.mediaAsset.create({ data: {
      id: mediaId, ownerUserId: fixture.sellers.approved.id, purpose: 'AUTHOR_PHOTO', state: 'READY',
      objects: { create: {
        tier: 'PUBLIC', variant: 'PREVIEW', pipelineVersion: 'v1', state: 'READY',
        objectKey: `assets/${mediaId}/p1/preview.webp`, publicUrl: `https://media.example.test/assets/${mediaId}/p1/preview.webp`, mimeType: 'image/webp',
        byteLength: 8, sha256: 'a'.repeat(64), width: 1, height: 1,
      } },
    } });
    const publicKey = `assets/${mediaId}/p1/preview.webp`;
    objects.set(`PUBLIC:${publicKey}`, { bytes: new Uint8Array(8), mimeType: 'image/webp' });
    const initialVersion = (await db.prisma.user.findUniqueOrThrow({ where: { id: fixture.sellers.approved.id } })).sessionVersion;
    const ownerClient = new HttpTestClient(http.baseUrl, 'http://localhost:8081', fixture.sellers.approved.id);
    expect((await ownerClient.post('/auth/login', { email: fixture.sellers.approved.email, password: fixture.sellers.approved.password })).status).toBe(201);
    const body = await sellerModerationRequest(db.prisma, profileId, 'SUSPENDED', 'Concurrent suspension');
    let entered!: () => void;
    let release!: () => void;
    const ready = new Promise<void>((resolve) => { entered = resolve; });
    const released = new Promise<void>((resolve) => { release = resolve; });
    const original = media.enqueueRevoke.bind(media);
    const enqueue = vi.spyOn(media, 'enqueueRevoke').mockImplementationOnce(async (...args) => {
      entered();
      await released;
      return original(...args);
    });
    let releaseDelete!: () => void;
    const deleteReleased = new Promise<void>((resolve) => { releaseDelete = resolve; });
    let deleteEntered!: () => void;
    const deleting = new Promise<void>((resolve) => { deleteEntered = resolve; });
    const deleteMock = vi.mocked(S3MediaObjectStore.prototype.delete);
    const originalDelete = deleteMock.getMockImplementation()!;
    deleteMock.mockImplementation(async (tier, key) => {
      if (tier === 'PUBLIC' && key === publicKey) {
        deleteEntered();
        await deleteReleased;
        expect(objects.has(`PUBLIC:${publicKey}`)).toBe(true);
      }
      await originalDelete(tier, key);
    });
    const ban = admin.client.patch(`/admin/users/${fixture.sellers.approved.id}/status`, { status: 'banned', reason: 'Concurrent ban' });
    let suspension: Promise<Response> | undefined;
    try {
      await Promise.race([ready, ban.then(() => { throw new Error('Ban finished before reaching the revoke barrier'); })]);
      suspension = admin.client.patch(`/admin/seller-profiles/${profileId}/status`, body);
      await expect.poll(async () => {
        const [row] = await db.prisma.$queryRaw<Array<{ waiting: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
            JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_stat_activity a ON a.pid = l.pid
            WHERE c.relname = 'users' AND n.nspname = current_schema() AND a.wait_event_type = 'Lock'
          ) AS waiting
        `;
        return row?.waiting;
      }, { timeout: 5_000 }).toBe(true);
      release();
      await Promise.race([deleting, Promise.all([ban, suspension]).then(() => { throw new Error('Requests finished before delete'); })]);
      const first = await Promise.race([ban, suspension]);
      expect(first.status).toBe(200);
      const held = await db.prisma.mediaOperation.findMany({ where: { profileId, kind: 'REVOKE' }, include: { objects: true } });
      expect(held).toHaveLength(2);
      const running = held.find((operation) => operation.state === 'RUNNING')!;
      const pending = held.find((operation) => operation.state === 'PENDING')!;
      expect(running.leaseToken).toBeTruthy();
      expect(running.leaseUntil!.getTime()).toBeGreaterThan(Date.now());
      expect(pending.attemptCount).toBe(0);
      expect(pending.objects.map(({ objectId }) => objectId)).toEqual(running.objects.map(({ objectId }) => objectId));
      expect((await db.prisma.user.findUniqueOrThrow({ where: { id: fixture.sellers.approved.id } })).status).toBe('banned');
      expect((await db.prisma.sellerProfile.findUniqueOrThrow({ where: { id: profileId } })).status).toBe('SUSPENDED');
      expect((await ownerClient.get('/auth/me')).status).toBe(401);
      releaseDelete();
      const responses = await Promise.all([ban, suspension]);
      expect(responses.map((response) => response.status)).toEqual([200, 200]);
      deleteMock.mockImplementation(originalDelete);
      expect((await db.prisma.mediaOperation.findUniqueOrThrow({ where: { id: running.id } })).state).toBe('DONE');
      expect((await db.prisma.mediaOperation.findUniqueOrThrow({ where: { id: pending.id } })).state).toBe('PENDING');
      await media.tick();
      const revokes = await db.prisma.mediaOperation.findMany({
        where: { profileId, kind: 'REVOKE' },
        select: { state: true },
      });
      expect(revokes).toHaveLength(2);
      expect(revokes.every((operation) => operation.state === 'DONE')).toBe(true);
      expect(objects.has(`PUBLIC:${publicKey}`)).toBe(false);
      expect(deleteMock).toHaveBeenCalledWith('PUBLIC', publicKey);
      expect(await db.prisma.mediaOperation.count({ where: { profileId, kind: 'REVOKE', state: { not: 'DONE' } } })).toBe(0);
      expect((await admin.client.patch(`/admin/users/${fixture.sellers.approved.id}/status`, { status: 'banned', reason: 'Retry ban' })).status).toBe(200);
      const stale = await admin.client.patch(`/admin/seller-profiles/${profileId}/status`, body);
      expect(stale.status).toBe(409);
      expect(await stale.json()).toMatchObject({ code: ApiErrorCode.CONFLICT, message: 'Moderation target is stale' });
      const fresh = await sellerModerationRequest(db.prisma, profileId, 'SUSPENDED', 'Retry suspension');
      const retries = await Promise.all([1, 2].map(() => admin.client.patch(`/admin/seller-profiles/${profileId}/status`, fresh)));
      expect(retries.map(({ status }) => status)).toEqual([200, 200]);
      expect(await db.prisma.mediaOperation.count({ where: { profileId, kind: 'REVOKE' } })).toBe(2);
      expect((await db.prisma.user.findUniqueOrThrow({ where: { id: fixture.sellers.approved.id } })).sessionVersion).toBe(initialVersion + 1);
      expect((await db.prisma.mediaObject.findFirstOrThrow({
        where: { assetId: mediaId, tier: 'PUBLIC' },
      })).state).toBe('DELETED');
      expect(purged).toContain(`https://media.example.test/assets/${mediaId}/p1/preview.webp`);
      expect((await db.prisma.user.findUniqueOrThrow({ where: { id: fixture.sellers.approved.id } })).status).toBe('banned');
      expect((await db.prisma.sellerProfile.findUniqueOrThrow({ where: { id: profileId } })).status).toBe('SUSPENDED');
      expect(await db.prisma.auditEvent.count({ where: { actorUserId: admin.row.id, targetId: profileId, action: 'DECISION' } })).toBe(1);
      expect(await db.prisma.auditEvent.count({ where: { actorUserId: admin.row.id, targetId: fixture.sellers.approved.id, newStatus: 'banned' } })).toBe(1);
    } finally {
      release();
      releaseDelete();
      await Promise.allSettled(suspension ? [ban, suspension] : [ban]);
      enqueue.mockRestore();
      deleteMock.mockImplementation(originalDelete);
    }
  });
});

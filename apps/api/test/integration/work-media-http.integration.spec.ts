import { createHash, randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
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
    const profileId = (await createdAuthor.json()).sellerProfile.id;
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
    const work = (await created.json()).product;
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
    expect((await pending.json()).publication.state).toBe('FAILED');
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
    expect(
      (
        await admin.client.patch(
          `/admin/products/${work.id}/status`,
          revisionApproval,
        )
      ).status,
    ).toBe(200);
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
});

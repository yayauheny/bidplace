import { createHash } from 'node:crypto';

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import sharp from 'sharp';
import { MediaLifecycleService } from '../../src/core/media/media-lifecycle.service';
import {
  S3MediaObjectStore,
  type StoredMedia,
} from '../../src/core/media/media-object-store';
import { CloudflarePublicMediaCache } from '../../src/core/media/public-media-cache';
import { productImageUploadLimits } from '../../src/images/image-policy';
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
import { sellerModerationRequest } from './admin-status-request';

let db: IntegrationDatabaseContext;
let http: HttpTestApp;
let media: MediaLifecycleService;
let stage: ReturnType<typeof vi.spyOn>;
const objects = new Map<string, StoredMedia>();

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
    CLOUDFLARE_ZONE_ID: 'b'.repeat(32),
    CLOUDFLARE_CACHE_TOKEN: 'fixture',
  }))
    vi.stubEnv(name, value);
  vi.spyOn(S3MediaObjectStore.prototype, 'get').mockImplementation(
    async (tier, key) => objects.get(`${tier}:${key}`) ?? null,
  );
  vi.spyOn(S3MediaObjectStore.prototype, 'put').mockImplementation(
    async (tier, key, value) => {
      objects.set(`${tier}:${key}`, value);
    },
  );
  vi.spyOn(S3MediaObjectStore.prototype, 'delete').mockImplementation(
    async (tier, key) => {
      objects.delete(`${tier}:${key}`);
    },
  );
  vi.spyOn(CloudflarePublicMediaCache.prototype, 'purge').mockResolvedValue(
    undefined,
  );
  db = await createIntegrationDatabaseContext();
  http = await createHttpTestApp(db.databaseUrl);
  media = http.app.get(MediaLifecycleService);
  media.onModuleDestroy();
  stage = vi.spyOn(media, 'stage');
});

beforeEach(() => {
  stage.mockClear();
});

afterAll(async () => {
  await http?.close();
  await db?.cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function png(color: string) {
  return sharp({
    create: { width: 8, height: 8, channels: 3, background: color },
  })
    .png()
    .toBuffer();
}

async function user(suffix: string, role: 'user' | 'admin' = 'user') {
  const row = await db.prisma.user.create({
    data: {
      email: `${suffix}@upload-safety.test`,
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

function profilePhoto(bytes: Buffer, fields: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  form.set(
    'profilePhoto',
    new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
    'photo.png',
  );
  return form;
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

async function runPublish(profileId: string) {
  const operations = await db.prisma.mediaOperation.findMany({
    where: {
      kind: 'PUBLISH',
      profileId,
      state: { in: ['PENDING', 'FAILED'] },
    },
  });
  for (const operation of operations) await media.run(operation.id);
}

async function message(response: Response) {
  const body = (await response.json()) as { message?: string };
  return body.message ?? '';
}

async function approvedAuthor(suffix: string) {
  const author = await user(suffix);
  const admin = await user(`${suffix}-admin`, 'admin');
  const bytes = await png('red');
  const created = await author.client.post(
    '/seller/profile',
    profilePhoto(bytes, {
      slug: suffix,
      fullName: 'Upload author',
      country: 'BY',
      city: 'Minsk',
      discipline: 'Автор',
      shortDescription: 'Portfolio author',
    }),
  );
  expect(created.status).toBe(201);
  const profileId = (await created.json()).sellerProfile.id as string;
  expect((await author.client.post('/author/application/advance')).status).toBe(
    201,
  );
  expect((await author.client.post('/author/application/advance')).status).toBe(
    201,
  );
  expect((await author.client.post('/author/application/submit')).status).toBe(
    201,
  );
  expect(
    (
      await admin.client.patch(
        `/admin/seller-profiles/${profileId}/status`,
        await sellerModerationRequest(db.prisma, profileId, 'APPROVED'),
      )
    ).status,
  ).toBe(200);
  await runPublish(profileId);
  const category = await db.prisma.category.create({
    data: { slug: `${suffix}-works`, name: suffix },
  });
  const workResponse = await author.client.post('/products', {
    title: `${suffix} work`,
    categoryId: category.id,
  });
  expect(workResponse.status).toBe(201);
  const work = (await workResponse.json()).product as { id: string };
  const product = await db.prisma.product.findUniqueOrThrow({
    where: { id: work.id },
    select: { editingRevisionId: true },
  });
  if (!product.editingRevisionId)
    throw new Error('Editing revision is missing');
  return {
    author,
    workId: work.id,
    revisionId: product.editingRevisionId,
    bytes,
  };
}

async function fillRevision(
  productId: string,
  revisionId: string,
  count: number,
) {
  const [images, revisionImages] = await Promise.all([
    db.prisma.productImage.findMany({
      where: { productId },
      select: { position: true },
    }),
    db.prisma.productRevisionImage.findMany({
      where: { revisionId },
      select: { position: true },
    }),
  ]);
  let imagePosition = images.reduce(
    (next, image) => Math.max(next, image.position + 1),
    0,
  );
  let revisionPosition = revisionImages.reduce(
    (next, image) => Math.max(next, image.position + 1),
    0,
  );
  for (let index = 0; index < count; index += 1) {
    const image = await db.prisma.productImage.create({
      data: {
        productId,
        position: imagePosition,
        mimeType: 'image/png',
        byteLength: 1,
        data: Buffer.from([index + 1]),
        checksum: createHash('sha256')
          .update(`${productId}:${imagePosition}`)
          .digest('hex'),
      },
    });
    await db.prisma.productRevisionImage.create({
      data: {
        revisionId,
        imageId: image.id,
        position: revisionPosition,
      },
    });
    imagePosition += 1;
    revisionPosition += 1;
  }
}

describe('portfolio upload admission over HTTP and PostgreSQL', () => {
  it('does not process a profile photo after the upload rate limit', async () => {
    const author = await user('profile-limit');
    const bytes = await png('blue');
    const created = await author.client.post(
      '/seller/profile',
      profilePhoto(bytes, {
        slug: 'profile-limit',
        fullName: 'Limited author',
        country: 'BY',
        city: 'Minsk',
      }),
    );
    expect(created.status).toBe(201);
    for (let index = 0; index < 9; index += 1) {
      const updated = await author.client.patch(
        '/seller/profile',
        profilePhoto(bytes, { city: 'Minsk' }),
      );
      expect(updated.status).toBe(200);
    }
    const calls = stage.mock.calls.length;
    const stored = objects.size;
    const limited = await author.client.patch(
      '/seller/profile',
      profilePhoto(bytes, { city: 'Minsk' }),
    );
    expect(limited.status).toBe(429);
    expect(await message(limited)).toBe('Too many requests');
    expect(stage.mock.calls.length).toBe(calls);
    expect(objects.size).toBe(stored);
  });

  it('rejects a full work gallery before stage and keeps replay rules', async () => {
    const fixture = await approvedAuthor('gallery-cap');
    const add = (bytes: Buffer, key: string) =>
      fixture.author.client.request(`/products/${fixture.workId}/images`, {
        method: 'POST',
        headers: { 'Idempotency-Key': key },
        body: upload(bytes),
      });
    await fillRevision(
      fixture.workId,
      fixture.revisionId,
      productImageUploadLimits.maxFiles,
    );
    stage.mockClear();
    const stored = objects.size;
    const overflow = await add(fixture.bytes, 'brand-new');
    expect(overflow.status).toBe(400);
    expect(await message(overflow)).toContain('at most');
    expect(stage).not.toHaveBeenCalled();
    expect(objects.size).toBe(stored);

    await db.prisma.productRevisionImage.deleteMany({
      where: { revisionId: fixture.revisionId },
    });
    await db.prisma.productImage.deleteMany({
      where: { productId: fixture.workId },
    });
    stage.mockClear();
    expect((await add(fixture.bytes, 'original')).status).toBe(201);
    await fillRevision(
      fixture.workId,
      fixture.revisionId,
      productImageUploadLimits.maxFiles - 1,
    );
    const beforeReplay = stage.mock.calls.length;
    const replay = await add(fixture.bytes, 'original');
    expect(replay.status).toBe(201);
    expect(stage.mock.calls.length).toBe(beforeReplay);
    expect(
      await db.prisma.productImage.count({
        where: { productId: fixture.workId },
      }),
    ).toBe(productImageUploadLimits.maxFiles);

    const different = await png('green');
    const mismatch = await add(different, 'original');
    expect(mismatch.status).toBe(409);
    expect(await message(mismatch)).toBe(
      'Idempotency identity has different content',
    );
    expect(stage.mock.calls.length).toBe(beforeReplay);
    expect(
      await db.prisma.productImage.count({
        where: { productId: fixture.workId },
      }),
    ).toBe(productImageUploadLimits.maxFiles);

    const next = await db.prisma.productRevision.create({
      data: { productId: fixture.workId, version: 2, status: 'DRAFT' },
    });
    await db.prisma.product.update({
      where: { id: fixture.workId },
      data: { editingRevisionId: next.id },
    });
    await fillRevision(
      fixture.workId,
      next.id,
      productImageUploadLimits.maxFiles,
    );
    const stale = await add(fixture.bytes, 'original');
    expect(stale.status).toBe(409);
    expect(await message(stale)).toBe(
      'Upload identity belongs to an earlier revision',
    );
    expect(stage.mock.calls.length).toBe(beforeReplay);
  });

  it('does not let concurrent uploads exceed gallery capacity', async () => {
    const fixture = await approvedAuthor('gallery-race');
    await fillRevision(
      fixture.workId,
      fixture.revisionId,
      productImageUploadLimits.maxFiles - 1,
    );
    const bytes = [await png('red'), await png('navy')];
    const responses = await Promise.all(
      bytes.map((value, index) =>
        fixture.author.client.request(`/products/${fixture.workId}/images`, {
          method: 'POST',
          headers: { 'Idempotency-Key': `race-${index}` },
          body: upload(value),
        }),
      ),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 400,
    ]);
    expect(
      await db.prisma.productRevisionImage.count({
        where: { revisionId: fixture.revisionId },
      }),
    ).toBe(productImageUploadLimits.maxFiles);
  });
});

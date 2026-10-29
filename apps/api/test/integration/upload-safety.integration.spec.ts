import { z } from 'zod';
import {
  workPhotoResultSchema,
  sellerProfileResponseSchema,
  productResponseSchema,
  workPhotoUploadResponseSchema,
  type WorkPhotoEditRequest,
} from '@bidplace/contracts';

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
import { Prisma } from '@bidplace/database';

import { normalizeCatalogName } from '../../src/catalog/catalog-data';
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
import {
  attachAuthorDirection,
  fixturePasswordHash,
} from './permission-fixtures';
import { sellerModerationRequest } from './admin-status-request';
import { sellerProfileForm } from './seller-profile-form';

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

function profilePhoto(bytes: Buffer, fields: Record<string, string> = {}) {
  const profileFields = Object.fromEntries(
    Object.entries(fields).filter(([key]) => key !== 'slug'),
  );
  return sellerProfileForm(
    profileFields,
    new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
    'photo.png',
  );
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
  const profileId = (sellerProfileResponseSchema.parse(await created.json())).sellerProfile.id as string;
  const application = await db.prisma.sellerProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: { editingRevisionId: true },
  });
  await attachAuthorDirection(db.prisma, application.editingRevisionId!);
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
    data: {
      slug: `${suffix}-works`,
      name: suffix,
      normalizedName: normalizeCatalogName(suffix),
    },
  });
  const workResponse = await author.client.post('/products', {
    title: `${suffix} work`,
    categoryId: category.id,
  });
  expect(workResponse.status).toBe(201);
  const work = (productResponseSchema.parse(await workResponse.json())).product as { id: string };
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

  it('returns stable slots and edits revision crop without uploading bytes or changing published media', async () => {
    const f = await approvedAuthor('photo-crop');
    const add = () =>
      f.author.client.request(`/products/${f.workId}/images`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': 'crop-source',
          'X-Photo-Response': 'slots',
        },
        body: upload(f.bytes),
      });
    const added = workPhotoUploadResponseSchema.parse(
      await (await add()).json(),
    );
    const first = added.photos[0]!;
    // Reconstruct pre-slot-contract uploads from their existing media manifest.
    await db.prisma.mediaOperation.updateMany({
      where: { productId: f.workId, kind: 'UPLOAD' },
      data: { photoResult: Prisma.DbNull, revisionId: null },
    });
    await db.prisma.productImage.update({
      where: { id: first.imageId },
      data: { uploadIdentity: null, inputChecksum: null },
    });
    expect(
      workPhotoUploadResponseSchema.parse(await (await add()).json()),
    ).toEqual(added);
    expect(
      (
        z.object({ photo: workPhotoResultSchema }).passthrough().parse(await (
          await f.author.client.get(
            `/products/${f.workId}/image-operations/crop-source`,
          )
        ).json())
      ).photo,
    ).toEqual(first);
    const crop = { x: 0.1, y: 0.2, width: 0.5, height: 0.6 };
    stage.mockClear();
    const request: WorkPhotoEditRequest = {
      revisionId: f.revisionId,
      version: first.version,
      crop,
      operationKey: 'crop-only',
    };
    const patch = () =>
      f.author.client.patch(
        `/products/${f.workId}/photos/${first.slotId}`,
        request,
      );
    const edited = z.object({ photo: workPhotoResultSchema }).passthrough().parse(await (await patch()).json());
    expect(edited.photo).toMatchObject({ ...first, version: 1, crop });
    expect(await (await patch()).json()).toEqual(edited);
    expect(stage).not.toHaveBeenCalled();
    expect(
      (
        await f.author.client.patch(
          `/products/${f.workId}/photos/${first.slotId}`,
          { ...request, crop: { ...crop, x: 0.9 }, operationKey: 'invalid' },
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await f.author.client.patch(
          `/products/${f.workId}/photos/${first.slotId}`,
          { ...request, crop: null },
        )
      ).status,
    ).toBe(409);
    const other = await user('photo-crop-stranger');
    expect(
      (
        await other.client.patch(
          `/products/${f.workId}/photos/${first.slotId}`,
          request,
        )
      ).status,
    ).toBe(403);
    const revision = await db.prisma.productRevision.update({
      where: { id: f.revisionId },
      data: { status: 'PENDING_REVIEW' },
    });
    await db.prisma.product.update({
      where: { id: f.workId },
      data: { status: 'PENDING_REVIEW' },
    });
    const publication = await db.prisma.$transaction((tx) =>
      media.enqueuePublication(
        tx,
        { productId: f.workId },
        revision,
        null,
        f.author.row.id,
      ),
    );
    await media.run(publication.id);
    const originalImage = await db.prisma.productImage.findUniqueOrThrow({
      where: { id: first.imageId },
    });
    const full = await db.prisma.mediaObject.findFirstOrThrow({
      where: {
        assetId: originalImage.mediaAssetId!,
        variant: 'FULL',
        tier: 'PUBLIC',
      },
    });
    const publishedBytes = objects.get(`PUBLIC:${full.objectKey}`)!.bytes;
    expect(
      (await other.client.get(`/images/${first.imageId}?source=true`)).status,
    ).toBe(404);
    expect(
      (await f.author.client.get(`/images/${first.imageId}?source=true`))
        .status,
    ).toBe(200);
    const fork = await f.author.client.patch(`/products/${f.workId}`, {
      title: 'New revision',
    });
    expect(fork.status).toBe(200);
    const current = await db.prisma.product.findUniqueOrThrow({
      where: { id: f.workId },
    });
    const nextSlot = await db.prisma.productRevisionImage.findFirstOrThrow({
      where: { revisionId: current.editingRevisionId! },
    });
    expect(nextSlot.slotId).not.toBe(first.slotId);
    expect(nextSlot.crop).toEqual(crop);
    const staleOrder = await f.author.client.patch(
      `/products/${f.workId}/images/order`,
      { imageIds: [first.imageId], revisionId: f.revisionId },
    );
    expect(staleOrder.status).toBe(409);
    expect(
      (
        await f.author.client.request(
          `/products/${f.workId}/images/${first.imageId}?revisionId=${f.revisionId}`,
          { method: 'DELETE' },
        )
      ).status,
    ).toBe(409);
    const cleared = await f.author.client.patch(
      `/products/${f.workId}/photos/${nextSlot.slotId}`,
      {
        revisionId: nextSlot.revisionId,
        version: 0,
        crop: null,
        operationKey: 'clear-crop',
      },
    );
    expect(cleared.status).toBe(200);
    expect(
      (
        await db.prisma.productRevisionImage.findUniqueOrThrow({
          where: { slotId: first.slotId },
        })
      ).crop,
    ).toEqual(crop);
    const replacement = upload(await png('purple'));
    replacement.append(
      'data',
      JSON.stringify({
        revisionId: nextSlot.revisionId,
        version: 1,
        crop: null,
        operationKey: 'published-replace',
      }),
    );
    expect(
      (
        await f.author.client.request(
          `/products/${f.workId}/photos/${nextSlot.slotId}`,
          {
            method: 'POST',
            headers: { 'Idempotency-Key': 'published-replace' },
            body: replacement,
          },
        )
      ).status,
    ).toBe(201);
    expect(
      (
        await db.prisma.productRevisionImage.findUniqueOrThrow({
          where: { slotId: first.slotId },
        })
      ).imageId,
    ).toBe(first.imageId);
    expect(objects.get(`PUBLIC:${full.objectKey}`)!.bytes).toEqual(
      publishedBytes,
    );
    expect(
      (
        await f.author.client.patch(
          `/products/${f.workId}/photos/${first.slotId}`,
          { ...request, operationKey: 'stale' },
        )
      ).status,
    ).toBe(409);
  });

  it('replaces a full-gallery slot atomically, replays it and serializes concurrent replacements', async () => {
    const f = await approvedAuthor('photo-replace');
    const added = await f.author.client.request(
      `/products/${f.workId}/images`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': 'original-slot',
          'X-Photo-Response': 'slots',
        },
        body: upload(f.bytes),
      },
    );
    const first = workPhotoUploadResponseSchema.parse(await added.json())
      .photos[0]!;
    await fillRevision(f.workId, f.revisionId, 9);
    const bytes = await png('green');
    const replace = (operationKey: string, version = 0) => {
      const form = upload(bytes);
      form.append(
        'data',
        JSON.stringify({
          revisionId: f.revisionId,
          version,
          crop: null,
          operationKey,
        }),
      );
      return f.author.client.request(
        `/products/${f.workId}/photos/${first.slotId}`,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': operationKey },
          body: form,
        },
      );
    };
    const result = await replace('replacement');
    expect(result.status).toBe(201);
    const body = z.object({ photo: workPhotoResultSchema }).passthrough().parse(await result.json());
    expect(body.photo).toMatchObject({
      slotId: first.slotId,
      revisionId: f.revisionId,
      version: 1,
    });
    expect(body.photo.imageId).not.toBe(first.imageId);
    expect(await (await replace('replacement')).json()).toEqual(body);
    const originalReplay = await f.author.client.request(
      `/products/${f.workId}/images`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': 'original-slot',
          'X-Photo-Response': 'slots',
        },
        body: upload(f.bytes),
      },
    );
    expect(originalReplay.status).toBe(201);
    expect(
      workPhotoUploadResponseSchema.parse(await originalReplay.json())
        .photos[0],
    ).toEqual(first);
    expect(
      (
        z.object({ photo: workPhotoResultSchema }).passthrough().parse(await (
          await f.author.client.get(
            `/products/${f.workId}/image-operations/replacement?slotId=${first.slotId}`,
          )
        ).json())
      ).photo,
    ).toEqual(body.photo);
    const raced = await Promise.all([
      replace('race-one', 1),
      replace('race-two', 1),
    ]);
    expect(raced.map((r) => r.status).sort()).toEqual([201, 409]);
    const slots = await db.prisma.productRevisionImage.findMany({
      where: { revisionId: f.revisionId },
      orderBy: { position: 'asc' },
    });
    expect(slots).toHaveLength(10);
    expect(slots.map((slot) => slot.position)).toEqual(
      Array.from({ length: 10 }, (_, i) => i),
    );
    expect(slots[0]!.slotId).toBe(first.slotId);
    expect(slots[0]!.version).toBe(2);
    expect(
      await db.prisma.productImage.count({ where: { productId: f.workId } }),
    ).toBe(10);
    const cleanups = await db.prisma.mediaOperation.findMany({
      where: { kind: 'CLEANUP' },
    });
    expect(cleanups.length).toBeGreaterThan(0);
    for (const cleanup of cleanups) await media.run(cleanup.id);
    const failedAssets = await db.prisma.mediaAsset.findMany({
      where: { ownerUserId: f.author.row.id, state: 'FAILED' },
      include: { objects: true },
    });
    expect(failedAssets.length).toBeGreaterThan(0);
    for (const asset of failedAssets)
      for (const object of asset.objects) {
        expect(object.state).toBe('DELETED');
        expect(objects.has(`${object.tier}:${object.objectKey}`)).toBe(false);
      }
    expect(
      (await f.author.client.get(`/images/${slots[0]!.imageId}?source=true`))
        .status,
    ).toBe(200);
  });

  it('rolls back a replacement after staging when the slot changes and cleans only the staged asset', async () => {
    const f = await approvedAuthor('replace-rollback');
    const added = await f.author.client.request(
      `/products/${f.workId}/images`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': 'rollback-original',
          'X-Photo-Response': 'slots',
        },
        body: upload(f.bytes),
      },
    );
    const first = workPhotoUploadResponseSchema.parse(await added.json())
      .photos[0]!;
    let stagedId: string | undefined;
    stage.mockImplementationOnce(
      async (...args: Parameters<MediaLifecycleService['stage']>) => {
        const staged = await MediaLifecycleService.prototype.stage.apply(
          media,
          args,
        );
        stagedId = staged.id;
        await db.prisma.productRevisionImage.update({
          where: { slotId: first.slotId },
          data: { version: { increment: 1 } },
        });
        return staged;
      },
    );
    const form = upload(await png('blue'));
    form.append(
      'data',
      JSON.stringify({
        revisionId: f.revisionId,
        version: 0,
        crop: null,
        operationKey: 'rollback',
      }),
    );
    const result = await f.author.client.request(
      `/products/${f.workId}/photos/${first.slotId}`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': 'rollback' },
        body: form,
      },
    );
    expect(result.status).toBe(409);
    expect(
      await db.prisma.productImage.count({ where: { productId: f.workId } }),
    ).toBe(1);
    expect(
      (
        await db.prisma.productRevisionImage.findUniqueOrThrow({
          where: { slotId: first.slotId },
        })
      ).imageId,
    ).toBe(first.imageId);
    const cleanup = await db.prisma.mediaOperation.findFirstOrThrow({
      where: {
        kind: 'CLEANUP',
        objects: { some: { object: { assetId: stagedId! } } },
      },
    });
    await media.run(cleanup.id);
    expect(
      (
        await db.prisma.mediaAsset.findUniqueOrThrow({
          where: { id: stagedId! },
        })
      ).state,
    ).toBe('FAILED');
    expect(
      (await f.author.client.get(`/images/${first.imageId}?source=true`))
        .status,
    ).toBe(200);
  });

  it('rejects attach while cleanup is deleting a retired asset', async () => {
    const f = await approvedAuthor('cleanup-attach');
    const staged = await media.stage(
      f.author.row.id,
      'WORK_IMAGE',
      { buffer: f.bytes, mimetype: 'image/png' },
      'cleanup-attach',
    );
    await db.prisma.$transaction((tx) => media.enqueueCleanup(tx, [staged.id]));
    const cleanup = await db.prisma.mediaOperation.findFirstOrThrow({
      where: {
        kind: 'CLEANUP',
        objects: { some: { object: { assetId: staged.id } } },
      },
    });
    let deleting!: () => void;
    const started = new Promise<void>((resolve) => {
      deleting = resolve;
    });
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.mocked(S3MediaObjectStore.prototype.delete).mockImplementationOnce(
      async (tier, key) => {
        deleting();
        await blocked;
        objects.delete(`${tier}:${key}`);
      },
    );
    const running = media.run(cleanup.id);
    try {
      await started;
      expect(
        (
          await db.prisma.mediaAsset.findUniqueOrThrow({
            where: { id: staged.id },
          })
        ).state,
      ).toBe('FAILED');
      await expect(
        db.prisma.$transaction((tx) => media.attach(tx, staged.id)),
      ).rejects.toThrow('Media asset cannot be attached');
    } finally {
      release();
      await running;
    }
    expect(
      await db.prisma.mediaObject.count({
        where: { assetId: staged.id, state: { not: 'DELETED' } },
      }),
    ).toBe(0);
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

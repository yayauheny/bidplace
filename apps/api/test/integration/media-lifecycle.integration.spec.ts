import { SharpImageProcessor } from '../../src/core/media/media-pipeline';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import sharp from 'sharp';
import type { MediaTier, PrismaClient } from '@bidplace/database';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import { normalizeCatalogName } from '../../src/catalog/catalog-data';
import { MediaLifecycleService } from '../../src/core/media/media-lifecycle.service';
import {
  MediaObjectStore,
  type StoredMedia,
} from '../../src/core/media/media-object-store';
import { PublicMediaCache } from '../../src/core/media/public-media-cache';
import { syntheticServerEnv } from '../../src/core/config/synthetic-server-env';
import { AdminModerationService } from '../../src/admin/admin-moderation.service';
import { PostgresImageStore } from '../../src/core/image-store';
import { importLegacyMedia } from '../../src/core/media/import-legacy-media';
import { mediaChecksum } from '../../src/core/media/media-object-store';

class MemoryStore extends MediaObjectStore {
  objects = new Map<string, StoredMedia>();
  failPublic = false;
  privateWritesBeforeFailure = Number.POSITIVE_INFINITY;
  privateWrites = 0;
  afterPublicPut?: () => Promise<void>;
  beforeDelete?: () => Promise<void>;
  async get(tier: MediaTier, key: string) {
    return this.objects.get(`${tier}:${key}`) ?? null;
  }
  async head() {
    return null;
  }
  async put(tier: MediaTier, key: string, value: StoredMedia) {
    if (tier === 'PRIVATE') {
      this.privateWrites += 1;
      if (this.privateWrites > this.privateWritesBeforeFailure)
        throw new Error('Provider outage');
    }
    if (tier === 'PUBLIC' && this.failPublic)
      throw new Error('Provider outage');
    this.objects.set(`${tier}:${key}`, value);
    if (tier === 'PUBLIC' && this.afterPublicPut) {
      const hook = this.afterPublicPut;
      delete this.afterPublicPut;
      await hook();
    }
  }
  async delete(tier: MediaTier, key: string) {
    if (this.beforeDelete) {
      const hook = this.beforeDelete;
      delete this.beforeDelete;
      await hook();
    }
    this.objects.delete(`${tier}:${key}`);
  }
}
class MemoryCache extends PublicMediaCache {
  urls: string[] = [];
  fail = false;
  async purge(urls: readonly string[]) {
    if (this.fail) throw new Error('Purge outage');
    this.urls.push(...urls);
  }
}
let context: IntegrationDatabaseContext;
let prisma: PrismaClient;
const mediaServices = new Set<MediaLifecycleService>();
let bytes: Buffer;
beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
  bytes = await sharp({
    create: { width: 40, height: 20, channels: 3, background: 'red' },
  })
    .png()
    .toBuffer();
});
afterEach(() => {
  for (const service of mediaServices) service.onModuleDestroy();
  mediaServices.clear();
});
afterAll(async () => context?.cleanup());
function setup(store = new MemoryStore(), cache = new MemoryCache()) {
  const env = syntheticServerEnv({
    MEDIA_STORAGE_PROVIDER: 's3',
    S3_ENDPOINT: 'https://r2.example.com',
    S3_REGION: 'auto',
    S3_BUCKET: 'private',
    S3_PUBLIC_BUCKET: 'public',
    S3_ACCESS_KEY_ID: 'test',
    S3_SECRET_ACCESS_KEY: 'test',
    MEDIA_PUBLIC_BASE_URL: 'https://media.example.com',
    CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
    CLOUDFLARE_CACHE_TOKEN: 'test',
  });
  const media = new MediaLifecycleService(prisma as never, store, cache, env, new SharpImageProcessor());
  mediaServices.add(media);
  return { store, cache, media };
}
async function author(media: MediaLifecycleService) {
  const user = await prisma.user.create({
    data: {
      email: `media-${randomUUID()}@example.com`,
      passwordHash: 'unusable',
      displayName: 'Media author',
      emailVerifiedAt: new Date(),
    },
  });
  const asset = await media.stage(user.id, 'AUTHOR_PHOTO', {
    buffer: bytes,
    mimetype: 'image/png',
  });
  const profile = await prisma.$transaction(async (tx) => {
    await media.attach(tx, asset.id);
    const profile = await tx.sellerProfile.create({
      data: {
        userId: user.id,
        slug: `media-${randomUUID()}`,
        sellerType: 'creator',
        fullName: 'Author',
        country: 'BY',
        city: 'Minsk',
        discipline: 'Автор',
        shortDescription: 'Portfolio',
        status: 'PENDING_REVIEW',
        profilePhotoAssetId: asset.id,
        profilePhotoObjectKey: asset.preview.objectKey,
        profilePhotoMimeType: asset.preview.mimeType,
        profilePhotoByteLength: asset.preview.byteLength,
        profilePhotoChecksum: asset.preview.sha256,
        profilePhotoData: new Uint8Array(0),
      },
    });
    const revision = await tx.sellerProfileRevision.create({
      data: {
        sellerProfileId: profile.id,
        version: 1,
        status: 'PENDING_REVIEW',
        slug: profile.slug,
        fullName: profile.fullName,
        country: profile.country,
        city: profile.city,
        discipline: profile.discipline,
        shortDescription: profile.shortDescription,
        profilePhotoAssetId: asset.id,
        profilePhotoObjectKey: asset.preview.objectKey,
        profilePhotoMimeType: asset.preview.mimeType,
        profilePhotoByteLength: asset.preview.byteLength,
        profilePhotoChecksum: asset.preview.sha256,
      },
    });
    const direction = await tx.category.upsert({
      where: { slug: 'painting' },
      update: {},
      create: {
        slug: 'painting',
        name: 'Живопись',
        normalizedName: normalizeCatalogName('Живопись'),
        active: true,
      },
    });
    await tx.sellerProfileRevisionDirection.create({
      data: { revisionId: revision.id, categoryId: direction.id, position: 0 },
    });
    await tx.sellerProfile.update({
      where: { id: profile.id },
      data: { editingRevisionId: revision.id },
    });
    return { ...profile, revision };
  });
  return { user, profile, asset };
}
async function approve(
  media: MediaLifecycleService,
  profile: Awaited<ReturnType<typeof author>>['profile'],
  userId: string,
) {
  const moderation = new AdminModerationService(
    prisma as never,
    new PostgresImageStore(prisma as never),
    media,
  );
  await moderation.updateSellerStatus(userId, profile.id, {
    status: 'APPROVED',
    target: {
      kind: 'revision',
      id: profile.revision.id,
      updatedAt: profile.revision.updatedAt.toISOString(),
    },
  });
  return prisma.mediaOperation.findFirstOrThrow({
    where: { profileId: profile.id, kind: 'PUBLISH' },
  });
}
describe('durable media lifecycle on PostgreSQL', () => {
  it('imports all five legacy owners across bounded pages, preserves Bytes, refuses corruption and can resume after public delivery failure', async () => {
    const s = setup();
    const user = await prisma.user.create({
      data: {
        email: `legacy-${randomUUID()}@test.local`,
        passwordHash: 'unusable',
        displayName: 'Legacy',
      },
    });
    const photo = {
      profilePhotoData: bytes,
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: bytes.byteLength,
      profilePhotoChecksum: mediaChecksum(bytes),
    };
    const profile = await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        slug: `legacy-${randomUUID()}`,
        fullName: 'Legacy author',
        country: 'BY',
        city: 'Minsk',
        discipline: 'Автор',
        sellerType: 'creator',
        shortDescription: 'Existing portfolio',
        status: 'APPROVED',
        ...photo,
      },
    });
    const revision = await prisma.sellerProfileRevision.create({
      data: {
        sellerProfileId: profile.id,
        version: 1,
        status: 'APPROVED',
        slug: profile.slug,
        fullName: profile.fullName,
        country: profile.country,
        city: profile.city,
        discipline: profile.discipline,
        shortDescription: profile.shortDescription,
        ...photo,
      },
    });
    await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        publishedRevisionId: revision.id,
        editingRevisionId: revision.id,
      },
    });
    const category = await prisma.category.create({
      data: {
        slug: `legacy-${randomUUID()}`,
        name: 'Legacy',
        normalizedName: normalizeCatalogName('Legacy'),
      },
    });
    const imageData = {
      data: bytes,
      mimeType: 'image/png',
      byteLength: bytes.byteLength,
      checksum: mediaChecksum(bytes),
    };
    const product = await prisma.product.create({
      data: {
        publicId: randomUUID().replaceAll('-', '').slice(0, 11),
        sellerProfileId: profile.id,
        categoryId: category.id,
        title: 'Preserved work',
        status: 'APPROVED',
        publishedAt: new Date(),
        images: {
          create: Array.from({ length: 7 }, (_, position) => ({
            position,
            ...imageData,
          })),
        },
      },
      include: { images: true },
    });
    const workRevision = await prisma.productRevision.create({
      data: {
        productId: product.id,
        version: 1,
        status: 'APPROVED',
        title: product.title,
        categoryId: category.id,
        images: {
          create: product.images.map((image) => ({
            imageId: image.id,
            position: image.position,
          })),
        },
      },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        publishedRevisionId: workRevision.id,
        editingRevisionId: workRevision.id,
      },
    });
    const achievement = await prisma.sellerProfileRevisionAchievement.create({
      data: {
        revisionId: revision.id,
        position: 0,
        body: 'Existing achievement',
        ...imageData,
      },
    });
    const step = await prisma.productCreationStep.create({
      data: {
        productId: product.id,
        position: 0,
        title: 'Existing step',
        body: 'Preserved',
        ...imageData,
      },
    });
    const legacyStore = new PostgresImageStore(prisma as never);
    expect(
      await importLegacyMedia(prisma as never, s.media, legacyStore),
    ).toEqual({ inspected: 11, imported: 0, publications: 0 });
    expect(
      await prisma.mediaAsset.count({ where: { ownerUserId: user.id } }),
    ).toBe(0);
    await prisma.productImage.update({
      where: { id: product.images[0]!.id },
      data: { checksum: '0'.repeat(64) },
    });
    await expect(
      importLegacyMedia(prisma as never, s.media, legacyStore, true),
    ).rejects.toThrow('Legacy media verification failed');
    await prisma.productImage.update({
      where: { id: product.images[0]!.id },
      data: { checksum: mediaChecksum(bytes) },
    });
    s.store.failPublic = true;
    await expect(
      importLegacyMedia(prisma as never, s.media, legacyStore, true),
    ).rejects.toThrow('Legacy public delivery is incomplete');
    expect(
      await prisma.productImage.count({
        where: { productId: product.id, mediaAssetId: { not: null } },
      }),
    ).toBe(7);
    s.store.failPublic = false;
    expect(
      await importLegacyMedia(prisma as never, s.media, legacyStore, true),
    ).toEqual({ inspected: 0, imported: 0, publications: 1 });
    const assetsBefore = await prisma.mediaAsset.count({
      where: { ownerUserId: user.id },
    });
    await importLegacyMedia(prisma as never, s.media, legacyStore, true);
    expect(
      await prisma.mediaAsset.count({ where: { ownerUserId: user.id } }),
    ).toBe(assetsBefore);
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: profile.id },
        })
      ).profilePhotoData,
    ).toEqual(new Uint8Array(bytes));
    expect(
      (
        await prisma.sellerProfileRevision.findUniqueOrThrow({
          where: { id: revision.id },
        })
      ).profilePhotoData,
    ).toEqual(new Uint8Array(bytes));
    expect(
      (
        await prisma.sellerProfileRevisionAchievement.findUniqueOrThrow({
          where: { id: achievement.id },
        })
      ).data,
    ).toEqual(new Uint8Array(bytes));
    expect(
      (
        await prisma.productCreationStep.findUniqueOrThrow({
          where: { id: step.id },
        })
      ).data,
    ).toEqual(new Uint8Array(bytes));
    for (const image of await prisma.productImage.findMany({
      where: { productId: product.id },
      include: { mediaAsset: { include: { objects: true } } },
    })) {
      expect(image.data).toEqual(new Uint8Array(bytes));
      expect(image.mediaAsset?.sourceProvenance).toBe('LEGACY_NORMALIZED');
      const source = image.mediaAsset!.objects.find(
        (object) => object.variant === 'SOURCE',
      )!;
      expect((await s.store.get('PRIVATE', source.objectKey))?.bytes).toEqual(
        bytes,
      );
      expect(
        image.mediaAsset!.objects.some(
          (object) => object.tier === 'PUBLIC' && object.state === 'READY',
        ),
      ).toBe(true);
    }
  });

  it('keeps first publication private during outage and recovers with the same intent after restart', async () => {
    const s = setup();
    const fixture = await author(s.media);
    s.store.failPublic = true;
    await expect(
      approve(s.media, fixture.profile, fixture.user.id),
    ).rejects.toThrow('Media delivery failed');
    const operation = await prisma.mediaOperation.findFirstOrThrow({
      where: { profileId: fixture.profile.id, kind: 'PUBLISH' },
    });
    expect(operation.state).toBe('FAILED');
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: fixture.profile.id },
        })
      ).publishedRevisionId,
    ).toBeNull();
    s.store.failPublic = false;
    await setup(s.store, s.cache).media.deliver(operation.id);
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: fixture.profile.id },
        })
      ).publishedRevisionId,
    ).toBe(fixture.profile.revision.id);
    expect(
      [...s.store.objects.keys()].some(
        (key) => key.startsWith('PUBLIC:') && key.includes('/source.'),
      ),
    ).toBe(false);
  });
  it('retries purge after deleting public bytes and retains private SOURCE', async () => {
    const s = setup();
    const f = await author(s.media);
    const operation = await approve(s.media, f.profile, f.user.id);
    await s.media.run(operation.id);
    await prisma.$transaction(async (tx) => {
      await tx.sellerProfile.update({
        where: { id: f.profile.id },
        data: { status: 'SUSPENDED' },
      });
      await s.media.enqueueRevoke(tx, { profileId: f.profile.id });
    });
    const revoke = await prisma.mediaOperation.findFirstOrThrow({
      where: { profileId: f.profile.id, kind: 'REVOKE' },
      orderBy: { createdAt: 'desc' },
    });
    s.cache.fail = true;
    await s.media.run(revoke.id);
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: revoke.id },
        })
      ).state,
    ).toBe('FAILED');
    s.cache.fail = false;
    await s.media.run(revoke.id);
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: revoke.id },
        })
      ).state,
    ).toBe('DONE');
    expect(await s.store.get('PUBLIC', f.asset.preview.objectKey)).toBeNull();
    expect(
      await s.store.get('PRIVATE', f.asset.source.objectKey),
    ).not.toBeNull();
    expect(s.cache.urls).toContain(
      `https://media.example.com/${f.asset.preview.objectKey}`,
    );
  });
  it('cleans a late public PUT when publication is cancelled during delivery', async () => {
    const s = setup();
    const f = await author(s.media);
    s.store.afterPublicPut = async () => {
      await prisma.$transaction(async (tx) => {
        await tx.sellerProfile.update({
          where: { id: f.profile.id },
          data: { status: 'SUSPENDED' },
        });
        await s.media.enqueueRevoke(tx, { profileId: f.profile.id });
      });
    };
    await expect(approve(s.media, f.profile, f.user.id)).rejects.toThrow(
      'Publication was cancelled',
    );
    const revokes = await prisma.mediaOperation.findMany({
      where: {
        kind: 'REVOKE',
        objects: { some: { object: { assetId: f.asset.id } } },
      },
    });
    for (const row of revokes) await s.media.run(row.id);
    expect(await s.store.get('PUBLIC', f.asset.preview.objectKey)).toBeNull();
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: f.profile.id },
        })
      ).publishedRevisionId,
    ).toBeNull();
  });
  it.each([false, true])('reuses upload identity and rejects changed bytes (legacy=%s)', async (legacy) => {
    const s = setup();
    const f = await author(s.media);
    const key = randomUUID();
    const input = legacy ? Buffer.concat([bytes, Buffer.alloc(1024)]) : bytes;
    const a = await s.media.stage(
      f.user.id,
      'WORK_IMAGE',
      { buffer: input, mimetype: 'image/png' },
      key,
      legacy,
    );
    if (legacy) await prisma.mediaOperation.updateMany({
      where: { kind: 'UPLOAD', objects: { some: { object: { assetId: a.id } } } },
      data: { inputChecksum: null },
    });
    const b = await s.media.stage(
      f.user.id,
      'WORK_IMAGE',
      { buffer: input, mimetype: 'image/png' },
      key,
    );
    expect(a.id).toBe(b.id);
    const changed = await sharp({
      create: { width: 40, height: 20, channels: 3, background: 'blue' },
    })
      .png()
      .toBuffer();
    await expect(
      s.media.stage(
        f.user.id,
        'WORK_IMAGE',
        { buffer: changed, mimetype: 'image/png' },
        key,
      ),
    ).rejects.toThrow('different content');
  });
  it('keeps the previous published snapshot until replacement media is delivered', async () => {
    const s = setup();
    const f = await author(s.media);
    const first = await approve(s.media, f.profile, f.user.id);
    await s.media.run(first.id);
    const nextAsset = await s.media.stage(f.user.id, 'AUTHOR_PHOTO', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    const revision = await prisma.$transaction(async (tx) => {
      await s.media.attach(tx, nextAsset.id);
      const row = await tx.sellerProfileRevision.create({
        data: {
          sellerProfileId: f.profile.id,
          version: 2,
          status: 'PENDING_REVIEW',
          slug: f.profile.slug,
          fullName: 'Updated author',
          country: 'BY',
          city: 'Minsk',
          discipline: 'Автор',
          shortDescription: 'Updated portfolio',
          profilePhotoAssetId: nextAsset.id,
          profilePhotoObjectKey: nextAsset.preview.objectKey,
          profilePhotoMimeType: nextAsset.preview.mimeType,
          profilePhotoByteLength: nextAsset.preview.byteLength,
          profilePhotoChecksum: nextAsset.preview.sha256,
        },
      });
      await tx.sellerProfile.update({
        where: { id: f.profile.id },
        data: { editingRevisionId: row.id },
      });
      return row;
    });
    const operation = await prisma.$transaction((tx) =>
      s.media.enqueuePublication(
        tx,
        { profileId: f.profile.id },
        revision,
        f.profile.revision.id,
        f.user.id,
      ),
    );
    s.store.failPublic = true;
    await expect(s.media.deliver(operation.id)).rejects.toThrow(
      'Media delivery failed',
    );
    const before = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: f.profile.id },
    });
    expect(before.publishedRevisionId).toBe(f.profile.revision.id);
    expect(before.fullName).toBe('Author');
    expect(
      await s.store.get('PUBLIC', f.asset.preview.objectKey),
    ).not.toBeNull();
    s.store.failPublic = false;
    await s.media.deliver(operation.id);
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: f.profile.id },
        })
      ).publishedRevisionId,
    ).toBe(revision.id);
  });
  it('retains objects while another revision still references the asset', async () => {
    const s = setup();
    const f = await author(s.media);
    const operation = await approve(s.media, f.profile, f.user.id);
    await s.media.run(operation.id);
    await prisma.$transaction((tx) => s.media.enqueueCleanup(tx, [f.asset.id]));
    const cleanup = await prisma.mediaOperation.findFirstOrThrow({
      where: {
        kind: 'CLEANUP',
        objects: { some: { object: { assetId: f.asset.id } } },
      },
    });
    await s.media.run(cleanup.id);
    expect(
      await s.store.get('PRIVATE', f.asset.source.objectKey),
    ).not.toBeNull();
    expect(
      await s.store.get('PUBLIC', f.asset.preview.objectKey),
    ).not.toBeNull();
  });
  it('cleans unattached assets recorded before a domain transaction rolls back', async () => {
    const s = setup();
    const f = await author(s.media);
    const staged = await s.media.stage(f.user.id, 'WORK_IMAGE', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    await expect(
      prisma.$transaction(async (tx) => {
        await s.media.attach(tx, staged.id);
        throw new Error('Domain rollback');
      }),
    ).rejects.toThrow('Domain rollback');
    await prisma.mediaAsset.update({
      where: { id: staged.id },
      data: { createdAt: new Date(Date.now() - 11 * 60_000) },
    });
    await s.media.tick();
    await s.media.tick();
    expect(await s.store.get('PRIVATE', staged.source.objectKey)).toBeNull();
    expect(
      (await prisma.mediaAsset.findUniqueOrThrow({ where: { id: staged.id } }))
        .state,
    ).toBe('FAILED');
  });

  it('serializes restoration with an unfinished public DELETE', async () => {
    const s = setup();
    const f = await author(s.media);
    const first = await approve(s.media, f.profile, f.user.id);
    await s.media.run(first.id);
    const workAsset = await s.media.stage(f.user.id, 'WORK_IMAGE', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    const work = await prisma.$transaction(async (tx) => {
      await s.media.attach(tx, workAsset.id);
      const product = await tx.product.create({
        data: {
          sellerProfileId: f.profile.id,
          publicId: randomUUID().replace(/-/g, '').slice(0, 11),
          title: 'Work',
          status: 'APPROVED',
        },
      });
      const image = await tx.productImage.create({
        data: {
          productId: product.id,
          position: 0,
          mediaAssetId: workAsset.id,
          objectKey: workAsset.preview.objectKey,
          mimeType: workAsset.preview.mimeType,
          byteLength: workAsset.preview.byteLength,
          checksum: workAsset.preview.sha256,
          data: new Uint8Array(0),
        },
      });
      const revision = await tx.productRevision.create({
        data: {
          productId: product.id,
          version: 1,
          status: 'APPROVED',
          title: 'Work',
          images: { create: { imageId: image.id, position: 0 } },
        },
      });
      await tx.product.update({
        where: { id: product.id },
        data: {
          editingRevisionId: revision.id,
          publishedRevisionId: revision.id,
        },
      });
      return product;
    });
    await prisma.$transaction(async (tx) => {
      await tx.sellerProfile.update({
        where: { id: f.profile.id },
        data: { status: 'SUSPENDED' },
      });
      await s.media.enqueueRevoke(tx, { profileId: f.profile.id });
    });
    const revoke = await prisma.mediaOperation.findFirstOrThrow({
      where: { profileId: f.profile.id, kind: 'REVOKE' },
      orderBy: { createdAt: 'desc' },
    });
    let startDelete = () => {};
    let finishDelete = () => {};
    const started = new Promise<void>((resolve) => {
      startDelete = resolve;
    });
    const finish = new Promise<void>((resolve) => {
      finishDelete = resolve;
    });
    s.store.beforeDelete = async () => {
      startDelete();
      await finish;
    };
    const deleting = s.media.run(revoke.id);
    await started;
    const revision = await prisma.sellerProfileRevision.findUniqueOrThrow({
      where: { id: f.profile.revision.id },
    });
    const restore = await prisma.$transaction((tx) =>
      s.media.enqueuePublication(
        tx,
        { profileId: f.profile.id },
        revision,
        revision.id,
        f.user.id,
        true,
      ),
    );
    await s.media.run(restore.id);
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: restore.id },
        })
      ).state,
    ).toBe('PENDING');
    finishDelete();
    await deleting;
    await s.media.run(restore.id);
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: f.profile.id },
        })
      ).status,
    ).toBe('APPROVED');
    expect(
      await s.store.get('PUBLIC', f.asset.preview.objectKey),
    ).not.toBeNull();
    expect(
      await s.store.get('PUBLIC', workAsset.preview.objectKey),
    ).not.toBeNull();
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: work.id } }))
        .status,
    ).toBe('APPROVED');
  });

  it('does not treat a busy lease or a background tick as a confirmed publication', async () => {
    const s = setup();
    const fixture = await author(s.media);
    const operation = await prisma.$transaction((tx) =>
      s.media.enqueuePublication(
        tx,
        { profileId: fixture.profile.id },
        fixture.profile.revision,
        null,
        fixture.user.id,
      ),
    );
    await prisma.mediaOperation.update({
      where: { id: operation.id },
      data: {
        state: 'RUNNING',
        leaseUntil: new Date(Date.now() + 60_000),
        leaseToken: randomUUID(),
      },
    });
    await expect(s.media.deliver(operation.id)).rejects.toThrow(
      'Publication is in progress',
    );
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: fixture.profile.id },
        })
      ).publishedRevisionId,
    ).toBeNull();
    await prisma.mediaOperation.update({
      where: { id: operation.id },
      data: { state: 'PENDING', leaseUntil: null, leaseToken: null },
    });
    await s.media.tick();
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: operation.id },
        })
      ).state,
    ).toBe('PENDING');
    await s.media.deliver(operation.id);
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: fixture.profile.id },
        })
      ).publishedRevisionId,
    ).toBe(fixture.profile.revision.id);
  });

  it('requires the file again when upload SOURCE bytes are gone and does not retry that from the executor', async () => {
    const s = setup();
    const fixture = await author(s.media);
    const staged = await s.media.stage(fixture.user.id, 'WORK_IMAGE', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    const upload = await prisma.mediaOperation.findFirstOrThrow({
      where: {
        kind: 'UPLOAD',
        objects: {
          some: { object: { assetId: staged.id, variant: 'SOURCE' } },
        },
      },
      include: { objects: { include: { object: true } } },
    });
    const source = upload.objects.find(
      (item) => item.object.variant === 'SOURCE',
    )!;
    s.store.objects.delete(`PRIVATE:${source.object.objectKey}`);
    await prisma.mediaOperation.update({
      where: { id: upload.id },
      data: { state: 'PENDING', leaseToken: null, leaseUntil: null },
    });
    await s.media.run(upload.id);
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: upload.id },
        })
      ).errorCode,
    ).toBe('SOURCE_RESEND_REQUIRED');
    await s.media.tick();
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: upload.id },
        })
      ).state,
    ).toBe('FAILED');
    await expect(s.media.deliver(upload.id)).rejects.toThrow(
      'Upload source must be resent',
    );
  });

  it('publishes and revokes a story image that is not in the gallery', async () => {
    const s = setup();
    const f = await author(s.media);
    await s.media.run((await approve(s.media, f.profile, f.user.id)).id);
    const gallery = await s.media.stage(f.user.id, 'WORK_IMAGE', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    const story = await s.media.stage(f.user.id, 'STORY_IMAGE', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    const held = await s.media.stage(f.user.id, 'STORY_IMAGE', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    const work = await prisma.$transaction(async (tx) => {
      await s.media.attach(tx, gallery.id);
      await s.media.attach(tx, story.id);
      await s.media.attach(tx, held.id);
      const product = await tx.product.create({
        data: {
          sellerProfileId: f.profile.id,
          publicId: randomUUID().replace(/-/g, '').slice(0, 11),
          title: 'Story media',
          status: 'PENDING_REVIEW',
        },
      });
      const image = await tx.productImage.create({
        data: {
          productId: product.id,
          position: 0,
          mediaAssetId: gallery.id,
          objectKey: gallery.preview.objectKey,
          mimeType: gallery.preview.mimeType,
          byteLength: gallery.preview.byteLength,
          checksum: gallery.preview.sha256,
          data: new Uint8Array(0),
        },
      });
      const revision = await tx.productRevision.create({
        data: {
          productId: product.id,
          version: 1,
          status: 'PENDING_REVIEW',
          title: 'Story media',
          images: { create: { imageId: image.id, position: 0 } },
          storyBlocks: {
            create: [
              {
                position: 0,
                type: 'IMAGE',
                mediaAssetId: story.id,
                altText: 'First',
              },
              {
                position: 1,
                type: 'IMAGE',
                mediaAssetId: story.id,
                altText: 'Second',
              },
            ],
          },
          storyAssets: { create: { mediaAssetId: held.id } },
        },
      });
      await tx.product.update({
        where: { id: product.id },
        data: { editingRevisionId: revision.id },
      });
      const operation = await s.media.enqueuePublication(
        tx,
        { productId: product.id },
        revision,
        null,
        f.user.id,
      );
      return { product, revision, operation };
    });
    s.store.failPublic = true;
    await expect(s.media.deliver(work.operation.id)).rejects.toThrow(
      'Media delivery failed',
    );
    s.store.failPublic = false;
    await s.media.deliver(work.operation.id);
    const publicCount = () =>
      prisma.mediaObject.count({
        where: { assetId: story.id, tier: 'PUBLIC' },
      });
    const publishedCount = await publicCount();
    expect(publishedCount).toBeGreaterThan(0);
    expect(await s.store.get('PUBLIC', story.preview.objectKey)).not.toBeNull();
    expect(await s.store.get('PUBLIC', held.preview.objectKey)).toBeNull();
    await s.media.run(work.operation.id);
    expect(await publicCount()).toBe(publishedCount);
    await prisma.productRevisionStoryBlock.deleteMany({
      where: { revisionId: work.revision.id, position: 1 },
    });
    await prisma.$transaction((tx) => s.media.enqueueCleanup(tx, [story.id]));
    const cleanup = await prisma.mediaOperation.findFirstOrThrow({
      where: { kind: 'CLEANUP', objects: { some: { object: { assetId: story.id } } } },
      orderBy: { createdAt: 'desc' },
    });
    await s.media.run(cleanup.id);
    expect(await s.store.get('PRIVATE', story.source.objectKey)).not.toBeNull();
    expect(await s.store.get('PUBLIC', story.preview.objectKey)).not.toBeNull();
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: work.product.id },
        data: { status: 'ARCHIVED' },
      });
      await s.media.enqueueRevoke(tx, { productId: work.product.id });
    });
    await s.media.run(
      (
        await prisma.mediaOperation.findFirstOrThrow({
          where: { productId: work.product.id, kind: 'REVOKE' },
          orderBy: { createdAt: 'desc' },
        })
      ).id,
    );
    expect(await s.store.get('PUBLIC', story.preview.objectKey)).toBeNull();
    expect(await s.store.get('PRIVATE', story.source.objectKey)).not.toBeNull();
    expect(s.cache.urls.some((url) => url.includes(story.preview.objectKey))).toBe(
      true,
    );
    const revision = await prisma.productRevision.findUniqueOrThrow({
      where: { id: work.revision.id },
    });
    await prisma.product.update({
      where: { id: work.product.id },
      data: { status: 'APPROVED' },
    });
    await s.media.run(
      (
        await prisma.$transaction((tx) =>
          s.media.enqueuePublication(
            tx,
            { productId: work.product.id },
            revision,
            revision.id,
            f.user.id,
            true,
          ),
        )
      ).id,
    );
    expect(await s.store.get('PUBLIC', story.preview.objectKey)).not.toBeNull();
    expect(await publicCount()).toBe(publishedCount);
    await prisma.$transaction(async (tx) => {
      await tx.sellerProfile.update({
        where: { id: f.profile.id },
        data: { status: 'SUSPENDED' },
      });
      await s.media.enqueueRevoke(tx, { profileId: f.profile.id });
    });
    await s.media.run(
      (
        await prisma.mediaOperation.findFirstOrThrow({
          where: { profileId: f.profile.id, kind: 'REVOKE' },
          orderBy: { createdAt: 'desc' },
        })
      ).id,
    );
    expect(await s.store.get('PUBLIC', story.preview.objectKey)).toBeNull();
    const profileRevision = await prisma.sellerProfileRevision.findUniqueOrThrow({
      where: { id: f.profile.revision.id },
    });
    await s.media.run(
      (
        await prisma.$transaction((tx) =>
          s.media.enqueuePublication(
            tx,
            { profileId: f.profile.id },
            profileRevision,
            profileRevision.id,
            f.user.id,
            true,
          ),
        )
      ).id,
    );
    expect(await s.store.get('PUBLIC', story.preview.objectKey)).not.toBeNull();
    expect(await s.store.get('PUBLIC', held.preview.objectKey)).toBeNull();
  });
});

describe('scheduled media recovery on PostgreSQL', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function useSchedulerClock() {
    const started = Date.now();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(started);
    let now = started;
    const realSetTimeout = globalThis.setTimeout;
    const realClearTimeout = globalThis.clearTimeout;
    const queue = new Map<object, { at: number; run: () => unknown }>();
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
      fn: TimerHandler,
      delay?: number,
      ...args: unknown[]
    ) => {
      if (delay === 5_000 || delay === 10 * 60_000) {
        const handle = {
          unref() {
            return handle;
          },
          ref() {
            return handle;
          },
        };
        queue.set(handle, {
          at: now + delay,
          run: () => (fn as (...inner: unknown[]) => unknown)(...args),
        });
        return handle as unknown as ReturnType<typeof setTimeout>;
      }
      return realSetTimeout(fn, delay, ...args);
    }) as typeof setTimeout);
    vi.spyOn(globalThis, 'clearTimeout').mockImplementation(((id?: unknown) => {
      if (id && typeof id === 'object' && queue.delete(id)) return;
      realClearTimeout(id as ReturnType<typeof setTimeout>);
    }) as typeof clearTimeout);
    return {
      started,
      async advance(ms: number) {
        now += ms;
        vi.setSystemTime(now);
        const due = [...queue.entries()].filter(([, timer]) => timer.at <= now);
        for (const [handle] of due) queue.delete(handle);
        for (const [, timer] of due) await timer.run();
      },
    };
  }

  async function user() {
    return prisma.user.create({
      data: {
        email: `recover-${randomUUID()}@example.com`,
        passwordHash: 'unusable',
        displayName: 'Recovery author',
        emailVerifiedAt: new Date(),
      },
    });
  }

  it('continues a pending revoke after the database returns without a new enqueue or restart', async () => {
    const clock = useSchedulerClock();
    const s = setup();
    const f = await author(s.media);
    await approve(s.media, f.profile, f.user.id);
    await prisma.$transaction(async (tx) => {
      await tx.sellerProfile.update({
        where: { id: f.profile.id },
        data: { status: 'SUSPENDED' },
      });
      await s.media.enqueueRevoke(tx, { profileId: f.profile.id });
    });
    const revoke = await prisma.mediaOperation.findFirstOrThrow({
      where: { profileId: f.profile.id, kind: 'REVOKE', state: 'PENDING' },
    });
    const revokesBefore = await prisma.mediaOperation.count({
      where: { profileId: f.profile.id, kind: 'REVOKE' },
    });
    const operation = prisma.mediaOperation;
    const asset = prisma.mediaAsset;
    const originalFindMany = operation.findMany;
    const originalCount = operation.count;
    const originalAssetFindMany = asset.findMany;
    const originalAssetCount = asset.count;
    const unavailable = () => Promise.reject(new Error('database unavailable'));
    operation.findMany = unavailable as typeof operation.findMany;
    operation.count = unavailable as typeof operation.count;
    asset.findMany = unavailable as typeof asset.findMany;
    asset.count = unavailable as typeof asset.count;
    try {
      await clock.advance(5_000);
    } finally {
      operation.findMany = originalFindMany;
      operation.count = originalCount;
      asset.findMany = originalAssetFindMany;
      asset.count = originalAssetCount;
    }
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: revoke.id },
        })
      ).state,
    ).toBe('PENDING');
    expect(
      await s.store.get('PUBLIC', f.asset.preview.objectKey),
    ).not.toBeNull();
    await clock.advance(5_000);
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: revoke.id },
        })
      ).state,
    ).toBe('DONE');
    expect(await s.store.get('PUBLIC', f.asset.preview.objectKey)).toBeNull();
    expect(
      await s.store.get('PRIVATE', f.asset.source.objectKey),
    ).not.toBeNull();
    expect(
      await prisma.mediaOperation.count({
        where: { profileId: f.profile.id, kind: 'REVOKE' },
      }),
    ).toBe(revokesBefore);
    s.media.onModuleDestroy();
  });

  it('cleans a one-minute-old staging upload after restart once the grace period elapses', async () => {
    const clock = useSchedulerClock();
    const started = clock.started;
    const store = new MemoryStore();
    const first = setup(store);
    const owner = await user();
    const staged = await first.media.stage(owner.id, 'AUTHOR_PHOTO', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    first.media.onModuleDestroy();
    await prisma.mediaAsset.update({
      where: { id: staged.id },
      data: { createdAt: new Date(started - 60_000) },
    });
    const restarted = setup(store);
    await restarted.media.onModuleInit();
    expect(await store.get('PRIVATE', staged.source.objectKey)).not.toBeNull();
    expect(
      (await prisma.mediaAsset.findUniqueOrThrow({ where: { id: staged.id } }))
        .state,
    ).toBe('STAGING');
    await clock.advance(10 * 60_000);
    await clock.advance(5_000);
    expect(await store.get('PRIVATE', staged.source.objectKey)).toBeNull();
    expect(
      (await prisma.mediaAsset.findUniqueOrThrow({ where: { id: staged.id } }))
        .state,
    ).toBe('FAILED');
    expect(
      (
        await prisma.mediaOperation.findFirstOrThrow({
          where: {
            kind: 'CLEANUP',
            objects: { some: { object: { assetId: staged.id } } },
          },
        })
      ).state,
    ).toBe('DONE');
    restarted.media.onModuleDestroy();
  });

  it('retries a previous encoder upload from its persisted master after an upgrade', async () => {
    const store = new MemoryStore();
    store.privateWritesBeforeFailure = 1;
    const s = setup(store);
    const owner = await user();
    const input = await sharp(bytes).toColourspace('rgb16').png().toBuffer();
    const currentProcess = SharpImageProcessor.prototype.process;
    const oldEncoder = vi.spyOn(SharpImageProcessor.prototype, 'process').mockImplementation(async function (file, purpose, preserveSource) {
      const downgraded = await sharp(file.buffer).png().toBuffer();
      return currentProcess.call(this, { buffer: downgraded, mimetype: 'image/png' }, purpose, preserveSource);
    });
    try {
      await expect(s.media.stage(owner.id, 'WORK_IMAGE', { buffer: input, mimetype: 'image/png' }, 'encoder-upgrade')).rejects.toThrow('Provider outage');
    } finally { oldEncoder.mockRestore(); }
    store.privateWritesBeforeFailure = Number.POSITIVE_INFINITY;
    const asset = await s.media.stage(owner.id, 'WORK_IMAGE', { buffer: input, mimetype: 'image/png' }, 'encoder-upgrade');
    const persisted = await store.get('PRIVATE', asset.source.objectKey);
    expect(mediaChecksum(persisted!.bytes)).toBe(asset.source.sha256);
    expect((await sharp(persisted!.bytes).metadata()).bitsPerSample).toBe(8);
    s.media.onModuleDestroy();
  });

  it('cleans a partially stored upload after the grace period and does not retry the upload', async () => {
    const clock = useSchedulerClock();
    const started = clock.started;
    const store = new MemoryStore();
    store.privateWritesBeforeFailure = 1;
    const s = setup(store);
    const owner = await user();
    await expect(
      s.media.stage(owner.id, 'AUTHOR_PHOTO', {
        buffer: bytes,
        mimetype: 'image/png',
      }),
    ).rejects.toThrow('Provider outage');
    const asset = await prisma.mediaAsset.findFirstOrThrow({
      where: { ownerUserId: owner.id, purpose: 'AUTHOR_PHOTO' },
      include: { objects: true },
    });
    const source = asset.objects.find((object) => object.variant === 'SOURCE');
    expect(source).toBeTruthy();
    expect(await store.get('PRIVATE', source!.objectKey)).not.toBeNull();
    const upload = await prisma.mediaOperation.findFirstOrThrow({
      where: {
        kind: 'UPLOAD',
        objects: { some: { objectId: source!.id } },
      },
    });
    expect(upload.state).toBe('FAILED');
    await clock.advance(20_000);
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: upload.id },
        })
      ).attemptCount,
    ).toBe(upload.attemptCount);
    expect(await store.get('PRIVATE', source!.objectKey)).not.toBeNull();
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { createdAt: new Date(started - 60_000) },
    });
    await clock.advance(10 * 60_000);
    await clock.advance(5_000);
    expect(await store.get('PRIVATE', source!.objectKey)).toBeNull();
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: upload.id },
        })
      ).state,
    ).toBe('FAILED');
    s.media.onModuleDestroy();
  });

  it('does not delete an attached asset or a leased object from the scheduled scan', async () => {
    const clock = useSchedulerClock();
    const started = clock.started;
    const store = new MemoryStore();
    const s = setup(store);
    const f = await author(s.media);
    const owner = await user();
    const leased = await s.media.stage(owner.id, 'WORK_IMAGE', {
      buffer: bytes,
      mimetype: 'image/png',
    });
    s.media.onModuleDestroy();
    await prisma.mediaAsset.update({
      where: { id: f.asset.id },
      data: { createdAt: new Date(started - 60_000) },
    });
    await prisma.mediaAsset.update({
      where: { id: leased.id },
      data: { createdAt: new Date(started - 11 * 60_000) },
    });
    const leasedSource = await prisma.mediaObject.findFirstOrThrow({
      where: { assetId: leased.id, variant: 'SOURCE' },
    });
    await prisma.mediaOperation.create({
      data: {
        kind: 'PUBLISH',
        state: 'RUNNING',
        identity: `lease:${randomUUID()}`,
        leaseUntil: new Date(started + 60 * 60_000),
        objects: { create: [{ objectId: leasedSource.id }] },
      },
    });
    await prisma.mediaObject.update({
      where: { id: leasedSource.id },
      data: { leaseUntil: new Date(started + 60 * 60_000) },
    });
    const restarted = setup(store);
    await restarted.media.onModuleInit();
    await clock.advance(10 * 60_000 + 5_000);
    expect(await store.get('PRIVATE', f.asset.source.objectKey)).not.toBeNull();
    expect(
      (
        await prisma.mediaAsset.findUniqueOrThrow({
          where: { id: f.asset.id },
        })
      ).state,
    ).toBe('READY');
    expect(
      await prisma.mediaOperation.count({
        where: {
          kind: 'CLEANUP',
          objects: { some: { object: { assetId: f.asset.id } } },
        },
      }),
    ).toBe(0);
    expect(await store.get('PRIVATE', leased.source.objectKey)).not.toBeNull();
    expect(
      (
        await prisma.mediaObject.findUniqueOrThrow({
          where: { id: leasedSource.id },
        })
      ).state,
    ).not.toBe('DELETED');
    restarted.media.onModuleDestroy();
  });

  it('keeps the account slug when an older profile revision is published', async () => {
    const s = setup();
    const fixture = await author(s.media);
    await prisma.user.update({
      where: { id: fixture.user.id },
      data: { slug: 'canonical-author' },
    });
    const revision = await prisma.sellerProfileRevision.update({
      where: { id: fixture.profile.revision.id },
      data: { slug: 'old-snapshot' },
    });
    const operation = await approve(
      s.media,
      { ...fixture.profile, revision },
      fixture.user.id,
    );
    await s.media.run(operation.id);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: fixture.user.id } });
    const profile = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.profile.id },
    });
    expect(user.slug).toBe('canonical-author');
    expect(profile.slug).toBe(fixture.profile.slug);
    s.media.onModuleDestroy();
  });
});

it('records one decision and completion per restore cycle, preserves retries, and updates the restore actor', async () => {
  const s = setup();
  const fixture = await author(s.media);
  const moderation = new AdminModerationService(
    prisma as never,
    new PostgresImageStore(prisma as never),
    s.media,
  );
  await approve(s.media, fixture.profile, fixture.user.id);
  await approve(s.media, fixture.profile, fixture.user.id);
  const secondActor = await prisma.user.create({
    data: {
      email: `restore-${randomUUID()}@example.com`,
      passwordHash: 'unusable',
    },
  });
  for (let cycle = 0; cycle < 3; cycle++) {
    let profile = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.profile.id },
    });
    await moderation.updateSellerStatus(fixture.user.id, profile.id, {
      status: 'SUSPENDED',
      reason: 'fixture revoke',
      target: {
        kind: 'parent',
        status: 'APPROVED',
        updatedAt: profile.updatedAt.toISOString(),
      },
    });
    profile = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });
    s.store.failPublic = true;
    const actor = cycle === 2 ? secondActor.id : fixture.user.id;
    const input = {
      status: 'APPROVED' as const,
      target: {
        kind: 'parent' as const,
        status: 'SUSPENDED' as const,
        updatedAt: profile.updatedAt.toISOString(),
      },
    };
    await expect(
      moderation.updateSellerStatus(actor, profile.id, input),
    ).rejects.toThrow('Media delivery failed');
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: profile.id },
        })
      ).status,
    ).toBe('SUSPENDED');
    s.store.failPublic = false;
    await moderation.updateSellerStatus(actor, profile.id, input);
    const operation = await prisma.mediaOperation.findFirstOrThrow({
      where: { profileId: profile.id, restore: true },
    });
    expect(operation.generation).toBe(cycle);
    expect(operation.actorUserId).toBe(actor);
    await s.media.deliver(operation.id);
    const events = await prisma.auditEvent.findMany({
      where: { mediaOperationId: operation.id, operationGeneration: cycle },
      orderBy: { createdAt: 'asc' },
    });
    expect(events.map((event) => event.action)).toEqual([
      'DECISION',
      'PUBLICATION_COMPLETED',
    ]);
    expect(
      events.every(
        (event) =>
          event.actorUserId === actor &&
          event.revisionId === fixture.profile.revision.id,
      ),
    ).toBe(true);
  }
  const initial = await prisma.auditEvent.count({
    where: { targetId: fixture.profile.id, action: 'PUBLICATION_COMPLETED' },
  });
  expect(initial).toBe(4);
});

it('rejects a completion from a worker whose publication lease was taken over', async () => {
  const s = setup();
  const fixture = await author(s.media);
  s.store.afterPublicPut = async () => {
    await prisma.mediaOperation.updateMany({ where: { profileId: fixture.profile.id, kind: 'PUBLISH', state: 'RUNNING' },
      data: { leaseToken: randomUUID(), leaseUntil: new Date(0) } });
  };
  await expect(approve(s.media, fixture.profile, fixture.user.id)).rejects.toThrow();
  expect((await prisma.sellerProfile.findUniqueOrThrow({ where: { id: fixture.profile.id } })).publishedRevisionId).toBeNull();
  expect(await prisma.auditEvent.count({ where: { targetId: fixture.profile.id, action: 'PUBLICATION_COMPLETED' } })).toBe(0);
  const operation = await prisma.mediaOperation.findFirstOrThrow({ where: { profileId: fixture.profile.id, kind: 'PUBLISH' } });
  await s.media.deliver(operation.id);
  expect(await prisma.auditEvent.count({ where: { mediaOperationId: operation.id, action: 'PUBLICATION_COMPLETED' } })).toBe(1);
});

it('stops a revoke after its lease expires instead of deleting more objects', async () => {
  const s = setup();
  const fixture = await author(s.media);
  await approve(s.media, fixture.profile, fixture.user.id);
  const second = await author(s.media);
  await approve(s.media, second.profile, second.user.id);
  await prisma.$transaction(async (tx) => {
    await tx.sellerProfile.update({ where: { id: fixture.profile.id }, data: { status: 'SUSPENDED' } });
    await s.media.enqueueRevoke(tx, { profileId: fixture.profile.id });
  });
  const revoke = await prisma.mediaOperation.findFirstOrThrow({ where: { profileId: fixture.profile.id, kind: 'REVOKE' }, orderBy: { createdAt: 'desc' } });
  await prisma.sellerProfile.update({ where: { id: second.profile.id }, data: { status: 'SUSPENDED' } });
  const secondObject = await prisma.mediaObject.findFirstOrThrow({ where: { assetId: second.asset.id, tier: 'PUBLIC' } });
  await prisma.mediaOperationObject.create({ data: { operationId: revoke.id, objectId: secondObject.id } });
  s.store.beforeDelete = async () => {
    await prisma.mediaOperation.update({ where: { id: revoke.id }, data: { leaseUntil: new Date(0) } });
  };
  await s.media.run(revoke.id);
  expect((await prisma.mediaOperation.findUniqueOrThrow({ where: { id: revoke.id } })).state).toBe('FAILED');
  expect([...s.store.objects.keys()].filter((key) => key.startsWith('PUBLIC:'))).toHaveLength(1);
  await s.media.deliver(revoke.id);
  expect([...s.store.objects.keys()].filter((key) => key.startsWith('PUBLIC:'))).toHaveLength(0);
});

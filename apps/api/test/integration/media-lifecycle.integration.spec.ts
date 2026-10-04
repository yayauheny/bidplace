import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import type { MediaTier, PrismaClient } from '@bidplace/database';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
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
  afterPublicPut?: () => Promise<void>;
  beforeDelete?: () => Promise<void>;
  async get(tier: MediaTier, key: string) {
    return this.objects.get(`${tier}:${key}`) ?? null;
  }
  async head() {
    return null;
  }
  async put(tier: MediaTier, key: string, value: StoredMedia) {
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
  return {
    store,
    cache,
    media: new MediaLifecycleService(prisma as never, store, cache, env),
  };
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
    const user = await prisma.user.create({ data: { email: `legacy-${randomUUID()}@test.local`, passwordHash: 'unusable', displayName: 'Legacy' } });
    const photo = { profilePhotoData: bytes, profilePhotoMimeType: 'image/png', profilePhotoByteLength: bytes.byteLength, profilePhotoChecksum: mediaChecksum(bytes) };
    const profile = await prisma.sellerProfile.create({ data: { userId: user.id, slug: `legacy-${randomUUID()}`, fullName: 'Legacy author', country: 'BY', city: 'Minsk', discipline: 'Автор', sellerType: 'creator', shortDescription: 'Existing portfolio', status: 'APPROVED', ...photo } });
    const revision = await prisma.sellerProfileRevision.create({ data: { sellerProfileId: profile.id, version: 1, status: 'APPROVED', slug: profile.slug, fullName: profile.fullName, country: profile.country, city: profile.city, discipline: profile.discipline, shortDescription: profile.shortDescription, ...photo } });
    await prisma.sellerProfile.update({ where: { id: profile.id }, data: { publishedRevisionId: revision.id, editingRevisionId: revision.id } });
    const category = await prisma.category.create({ data: { slug: `legacy-${randomUUID()}`, name: 'Legacy' } });
    const imageData = { data: bytes, mimeType: 'image/png', byteLength: bytes.byteLength, checksum: mediaChecksum(bytes) };
    const product = await prisma.product.create({ data: { publicId: randomUUID().replaceAll('-', '').slice(0, 11), sellerProfileId: profile.id, categoryId: category.id, title: 'Preserved work', status: 'APPROVED', publishedAt: new Date(), images: { create: Array.from({ length: 7 }, (_, position) => ({ position, ...imageData })) } }, include: { images: true } });
    const workRevision = await prisma.productRevision.create({ data: { productId: product.id, version: 1, status: 'APPROVED', title: product.title, categoryId: category.id, images: { create: product.images.map(image => ({ imageId: image.id, position: image.position })) } } });
    await prisma.product.update({ where: { id: product.id }, data: { publishedRevisionId: workRevision.id, editingRevisionId: workRevision.id } });
    const achievement = await prisma.sellerProfileRevisionAchievement.create({ data: { revisionId: revision.id, position: 0, body: 'Existing achievement', ...imageData } });
    const step = await prisma.productCreationStep.create({ data: { productId: product.id, position: 0, title: 'Existing step', body: 'Preserved', ...imageData } });
    const legacyStore = new PostgresImageStore(prisma as never);
    expect(await importLegacyMedia(prisma as never, s.media, legacyStore)).toEqual({ inspected: 11, imported: 0, publications: 0 });
    expect(await prisma.mediaAsset.count({ where: { ownerUserId: user.id } })).toBe(0);
    await prisma.productImage.update({ where: { id: product.images[0]!.id }, data: { checksum: '0'.repeat(64) } });
    await expect(importLegacyMedia(prisma as never, s.media, legacyStore, true)).rejects.toThrow('Legacy media verification failed');
    await prisma.productImage.update({ where: { id: product.images[0]!.id }, data: { checksum: mediaChecksum(bytes) } });
    s.store.failPublic = true;
    await expect(importLegacyMedia(prisma as never, s.media, legacyStore, true)).rejects.toThrow('Legacy public delivery is incomplete');
    expect(await prisma.productImage.count({ where: { productId: product.id, mediaAssetId: { not: null } } })).toBe(7);
    s.store.failPublic = false;
    expect(await importLegacyMedia(prisma as never, s.media, legacyStore, true)).toEqual({ inspected: 0, imported: 0, publications: 1 });
    const assetsBefore = await prisma.mediaAsset.count({ where: { ownerUserId: user.id } });
    await importLegacyMedia(prisma as never, s.media, legacyStore, true);
    expect(await prisma.mediaAsset.count({ where: { ownerUserId: user.id } })).toBe(assetsBefore);
    expect((await prisma.sellerProfile.findUniqueOrThrow({ where: { id: profile.id } })).profilePhotoData).toEqual(new Uint8Array(bytes));
    expect((await prisma.sellerProfileRevision.findUniqueOrThrow({ where: { id: revision.id } })).profilePhotoData).toEqual(new Uint8Array(bytes));
    expect((await prisma.sellerProfileRevisionAchievement.findUniqueOrThrow({ where: { id: achievement.id } })).data).toEqual(new Uint8Array(bytes));
    expect((await prisma.productCreationStep.findUniqueOrThrow({ where: { id: step.id } })).data).toEqual(new Uint8Array(bytes));
    for (const image of await prisma.productImage.findMany({ where: { productId: product.id }, include: { mediaAsset: { include: { objects: true } } } })) {
      expect(image.data).toEqual(new Uint8Array(bytes));
      expect(image.mediaAsset?.sourceProvenance).toBe('LEGACY_NORMALIZED');
      const source = image.mediaAsset!.objects.find(object => object.variant === 'SOURCE')!;
      expect((await s.store.get('PRIVATE', source.objectKey))?.bytes).toEqual(bytes);
      expect(image.mediaAsset!.objects.some(object => object.tier === 'PUBLIC' && object.state === 'READY')).toBe(true);
    }
  });

  it('keeps first publication private during outage and recovers with the same intent after restart', async () => {
    const s = setup();
    const fixture = await author(s.media);
    s.store.failPublic = true;
    const operation = await approve(s.media, fixture.profile, fixture.user.id);
    await s.media.run(operation.id);
    expect(
      (
        await prisma.mediaOperation.findUniqueOrThrow({
          where: { id: operation.id },
        })
      ).state,
    ).toBe('FAILED');
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: fixture.profile.id },
        })
      ).publishedRevisionId,
    ).toBeNull();
    s.store.failPublic = false;
    await setup(s.store, s.cache).media.run(operation.id);
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
    const op = await approve(s.media, f.profile, f.user.id);
    s.store.afterPublicPut = async () => {
      await prisma.$transaction(async (tx) => {
        await tx.sellerProfile.update({
          where: { id: f.profile.id },
          data: { status: 'SUSPENDED' },
        });
        await s.media.enqueueRevoke(tx, { profileId: f.profile.id });
      });
    };
    await s.media.run(op.id);
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
  it('reuses identical upload identity and rejects changed bytes', async () => {
    const s = setup();
    const f = await author(s.media);
    const key = randomUUID();
    const a = await s.media.stage(
      f.user.id,
      'WORK_IMAGE',
      { buffer: bytes, mimetype: 'image/png' },
      key,
    );
    const b = await s.media.stage(
      f.user.id,
      'WORK_IMAGE',
      { buffer: bytes, mimetype: 'image/png' },
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
    await s.media.run(operation.id);
    const before = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: f.profile.id },
    });
    expect(before.publishedRevisionId).toBe(f.profile.revision.id);
    expect(before.fullName).toBe('Author');
    expect(
      await s.store.get('PUBLIC', f.asset.preview.objectKey),
    ).not.toBeNull();
    s.store.failPublic = false;
    await s.media.run(operation.id);
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
});

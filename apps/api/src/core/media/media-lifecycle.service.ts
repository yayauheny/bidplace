import {
  publishedProductData,
  publishedSellerProfileData,
} from './publication-fields';
import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { MediaOperation, MediaPurpose, Prisma } from '@bidplace/database';
import { SERVER_ENV, type ServerEnv } from '../config';
import { PrismaService, runReadCommittedTransaction } from '../database';
import type { RawImageUpload } from '../../images/image-policy';
import { buildMediaPipeline } from './media-pipeline';
import { mediaChecksum, MediaObjectStore } from './media-object-store';
import { PublicMediaCache, publicMediaUrl } from './public-media-cache';

const activeStates = ['PENDING', 'RUNNING', 'FAILED'] as const;

export function mediaUploadIdentity(
  userId: string,
  purpose: MediaPurpose,
  idempotencyKey: string,
) {
  return `upload:${userId}:${purpose}:${idempotencyKey}`;
}
const objectInclude = {
  objects: { include: { object: true } },
} satisfies Prisma.MediaOperationInclude;
type Operation = Prisma.MediaOperationGetPayload<{
  include: typeof objectInclude;
}>;

@Injectable()
export class MediaLifecycleService implements OnModuleInit, OnModuleDestroy {
  readonly enabled: boolean;
  private timer?: ReturnType<typeof setTimeout>;
  private orphanTimer?: ReturnType<typeof setTimeout>;
  private stopped = false;
  private readonly logger = new Logger(MediaLifecycleService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: MediaObjectStore,
    private readonly cache: PublicMediaCache,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {
    this.enabled = Boolean(env.S3_PUBLIC_BUCKET);
  }
  onModuleInit() {
    if (this.enabled) void this.recover();
  }
  onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.orphanTimer) clearTimeout(this.orphanTimer);
    this.timer = undefined;
    this.orphanTimer = undefined;
  }
  private arm() {
    if (this.stopped || this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.recover();
    }, 5_000);
    this.timer.unref();
  }
  private async recover() {
    try {
      await this.tick();
    } catch {
      this.logger.error('Media reconciliation failed');
    }
    if (this.stopped) return;
    if (await this.revokeWorkOutstanding().catch(() => false)) this.arm();
  }
  private async revokeWorkOutstanding() {
    return (
      (await this.prisma.mediaOperation.count({
        where: {
          kind: { in: ['REVOKE', 'CLEANUP'] },
          state: { in: ['PENDING', 'RUNNING', 'FAILED'] },
        },
      })) > 0
    );
  }
  private armOrphanScan() {
    if (this.stopped || this.orphanTimer) return;
    this.orphanTimer = setTimeout(() => {
      this.orphanTimer = undefined;
      void this.tick()
        .catch(() => this.logger.error('Media reconciliation failed'))
        .finally(() => {
          void this.prisma.mediaAsset
            .count({
              where: {
                state: 'STAGING',
                createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
              },
            })
            .then((young) => {
              if (young > 0) this.armOrphanScan();
            })
            .catch(() => undefined);
          void this.revokeWorkOutstanding()
            .then((pending) => {
              if (pending) this.arm();
            })
            .catch(() => undefined);
        });
    }, 10 * 60_000);
    this.orphanTimer.unref();
  }
  async tick() {
    const now = new Date();
    const operations = await this.prisma.mediaOperation.findMany({
      where: {
        kind: { in: ['REVOKE', 'CLEANUP'] },
        OR: [
          { state: { in: ['PENDING', 'FAILED'] }, nextAttemptAt: { lte: now } },
          { state: 'RUNNING', leaseUntil: { lt: now } },
        ],
      },
      orderBy: [{ kind: 'desc' }, { createdAt: 'asc' }],
      take: 8,
      select: { id: true },
    });
    for (const operation of operations) await this.run(operation.id);
    const abandoned = await this.prisma.mediaAsset.findMany({
      where: {
        state: 'STAGING',
        createdAt: { lt: new Date(Date.now() - 10 * 60_000) },
      },
      take: 16,
      select: { id: true },
    });
    for (const asset of abandoned)
      await runReadCommittedTransaction(this.prisma, async (tx) => {
        if (!(await this.hasReference(tx, asset.id))) {
          await this.enqueueCleanup(tx, [asset.id]);
          await tx.mediaAsset.update({
            where: { id: asset.id },
            data: { state: 'FAILED' },
          });
        }
      });
  }
  async stage(
    userId: string,
    purpose: MediaPurpose,
    file: RawImageUpload,
    idempotencyKey: string = randomUUID(),
  ) {
    if (!this.enabled) throw new Error('Media lifecycle is disabled');
    if (!/^[a-zA-Z0-9:_-]{1,100}$/.test(idempotencyKey))
      throw new ConflictException('Invalid media idempotency identity');
    const pipeline = await buildMediaPipeline(file, purpose);
    const identity = mediaUploadIdentity(userId, purpose, idempotencyKey);
    let operation = await this.prisma.mediaOperation.findUnique({
      where: { identity },
      include: objectInclude,
    });
    if (!operation) {
      try {
        operation = await this.prisma.$transaction(async (tx) => {
          const asset = await tx.mediaAsset.create({
            data: { ownerUserId: userId, purpose },
          });
          const objects = [];
          for (const item of pipeline)
            objects.push(
              await tx.mediaObject.create({
                data: {
                  assetId: asset.id,
                  variant: item.variant,
                  tier: 'PRIVATE',
                  pipelineVersion: item.variant === 'SOURCE' ? 'source' : 'p1',
                  objectKey: `assets/${asset.id}/${item.variant === 'SOURCE' ? `source.${item.extension}` : `p1/${item.variant.toLowerCase()}.webp`}`,
                  mimeType: item.mimeType,
                  byteLength: item.bytes.byteLength,
                  sha256: item.sha256,
                  width: item.width,
                  height: item.height,
                },
              }),
            );
          return tx.mediaOperation.create({
            data: {
              kind: 'UPLOAD',
              identity,
              objects: {
                create: objects.map((object) => ({ objectId: object.id })),
              },
            },
            include: objectInclude,
          });
        });
      } catch (error) {
        if (
          typeof error !== 'object' ||
          error === null ||
          !('code' in error) ||
          error.code !== 'P2002'
        )
          throw error;
        operation = await this.prisma.mediaOperation.findUniqueOrThrow({
          where: { identity },
          include: objectInclude,
        });
      }
    }
    const source = operation.objects.find(
      (x) => x.object.variant === 'SOURCE',
    )?.object;
    if (
      !source ||
      source.sha256 !== mediaChecksum(file.buffer) ||
      source.mimeType !== file.mimetype
    )
      throw new ConflictException('Idempotency identity has different content');
    if (operation.state === 'CANCELLED')
      throw new ConflictException('Media upload was cancelled');
    if (operation.state !== 'DONE') {
      const token = await this.claim(operation.id);
      if (!token)
        throw new ConflictException('Media upload is already in progress');
      try {
        for (const item of operation.objects) {
          const value = pipeline.find((x) => x.variant === item.object.variant);
          if (!value) throw new Error('Missing media variant');
          await this.writeVerified(item.object, value.bytes);
          await this.prisma.mediaObject.update({
            where: { id: item.objectId },
            data: { state: 'READY' },
          });
          await this.prisma.mediaOperationObject.update({
            where: {
              operationId_objectId: {
                operationId: operation.id,
                objectId: item.objectId,
              },
            },
            data: { state: 'READY' },
          });
        }
        await this.prisma.mediaOperation.updateMany({
          where: { id: operation.id, leaseToken: token, state: 'RUNNING' },
          data: {
            state: 'DONE',
            leaseToken: null,
            leaseUntil: null,
            errorCode: null,
          },
        });
      } catch (error) {
        await this.fail(operation.id, token);
        throw error;
      } finally {
        await this.release(token);
      }
    }
    const asset = await this.prisma.mediaAsset.findUniqueOrThrow({
      where: { id: source.assetId },
      include: { objects: true },
    });
    if (asset.state === 'FAILED')
      throw new ConflictException(
        'Media upload expired; retry with a new identity',
      );
    this.armOrphanScan();
    const preview = asset.objects.find(
      (x) => x.variant === 'PREVIEW' && x.tier === 'PRIVATE',
    );
    if (!preview) throw new Error('Missing preview');
    return { id: asset.id, preview, source };
  }
  async attach(tx: Prisma.TransactionClient, assetId: string) {
    const result = await tx.mediaAsset.updateMany({
      where: { id: assetId, state: { in: ['STAGING', 'READY'] } },
      data: { state: 'READY' },
    });
    if (result.count !== 1)
      throw new ConflictException('Media asset cannot be attached');
  }
  private async hasReference(tx: Prisma.TransactionClient, assetId: string) {
    return Boolean(
      (await tx.productImage.count({ where: { mediaAssetId: assetId } })) ||
      (await tx.sellerProfileRevision.count({
        where: { profilePhotoAssetId: assetId },
      })) ||
      (await tx.sellerProfile.count({
        where: { profilePhotoAssetId: assetId },
      })) ||
      (await tx.sellerProfileRevisionAchievement.count({
        where: { mediaAssetId: assetId },
      })) ||
      (await tx.productCreationStep.count({
        where: { mediaAssetId: assetId },
      })),
    );
  }
  async assertNotPending(
    tx: Prisma.TransactionClient,
    target: { profileId?: string; productId?: string },
  ) {
    if (
      await tx.mediaOperation.count({
        where: { ...target, kind: 'PUBLISH', state: { in: [...activeStates] } },
      })
    )
      throw new ConflictException('Publication is waiting for media delivery');
  }
  async enqueuePublication(
    tx: Prisma.TransactionClient,
    target: { profileId?: string; productId?: string },
    revision: { id: string; updatedAt: Date },
    previousRevisionId: string | null,
    actorUserId: string,
    restore = false,
  ) {
    const identity = restore
      ? `restore:${target.profileId ?? target.productId}:${revision.id}:${revision.updatedAt.toISOString()}`
      : `publish:${revision.id}:${revision.updatedAt.toISOString()}`;
    const existing = await tx.mediaOperation.findUnique({
      where: { identity },
    });
    if (existing?.state === 'CANCELLED')
      throw new ConflictException('Publication was cancelled');
    if (existing && existing.state !== 'DONE') return existing;
    if (existing?.state === 'DONE') {
      if (!restore) return existing;
      const current = target.profileId
        ? await tx.sellerProfile.findUnique({
            where: { id: target.profileId },
            select: { status: true, publishedRevisionId: true },
          })
        : await tx.product.findUnique({
            where: { id: target.productId! },
            select: { status: true, publishedRevisionId: true },
          });
      if (
        current?.status === 'APPROVED' &&
        current.publishedRevisionId === revision.id
      )
        return existing;
      return tx.mediaOperation.update({
        where: { id: existing.id },
        data: {
          state: 'PENDING',
          errorCode: null,
          leaseToken: null,
          leaseUntil: null,
        },
      });
    }
    const assetIds = await this.revisionAssets(
      tx,
      target,
      revision.id,
      restore,
    );
    if (!assetIds.length)
      throw new ConflictException('Publication media has not been migrated');
    const assets = await tx.mediaAsset.count({
      where: { id: { in: assetIds }, state: 'READY' },
    });
    if (assets !== assetIds.length)
      throw new ConflictException('Publication media is not ready');
    const privateObjects = await tx.mediaObject.findMany({
      where: {
        assetId: { in: assetIds },
        tier: 'PRIVATE',
        variant: { not: 'SOURCE' },
        state: 'READY',
      },
    });
    const objects = [];
    for (const object of privateObjects) {
      const data = {
        assetId: object.assetId,
        variant: object.variant,
        pipelineVersion: object.pipelineVersion,
        objectKey: object.objectKey,
        mimeType: object.mimeType,
        byteLength: object.byteLength,
        sha256: object.sha256,
        width: object.width,
        height: object.height,
      };
      objects.push(
        await tx.mediaObject.upsert({
          where: {
            tier_objectKey: { tier: 'PUBLIC', objectKey: object.objectKey },
          },
          create: {
            ...data,
            tier: 'PUBLIC',
            state: 'PLANNED',
            publicUrl: publicMediaUrl(
              this.env.MEDIA_PUBLIC_BASE_URL!,
              object.objectKey,
            ),
          },
          update: {},
        }),
      );
    }
    return tx.mediaOperation.create({
      data: {
        kind: 'PUBLISH',
        identity,
        ...target,
        revisionId: revision.id,
        expectedRevisionAt: revision.updatedAt,
        previousRevisionId,
        actorUserId,
        restore,
        objects: { create: objects.map((object) => ({ objectId: object.id })) },
      },
    });
  }
  private async revisionAssets(
    tx: Prisma.TransactionClient,
    target: { profileId?: string; productId?: string },
    revisionId: string,
    restore = false,
  ) {
    const ids = new Set<string>();
    if (target.profileId) {
      const revision = await tx.sellerProfileRevision.findUniqueOrThrow({
        where: { id: revisionId },
        select: {
          profilePhotoAssetId: true,
          achievements: { select: { mimeType: true, mediaAssetId: true } },
        },
      });
      if (!revision.profilePhotoAssetId)
        throw new ConflictException('Author photo has not been migrated');
      ids.add(revision.profilePhotoAssetId);
      for (const item of revision.achievements) {
        if (item.mimeType && !item.mediaAssetId)
          throw new ConflictException('Achievement has not been migrated');
        if (item.mediaAssetId) ids.add(item.mediaAssetId);
      }
    } else {
      const revision = await tx.productRevision.findUniqueOrThrow({
        where: { id: revisionId },
        select: {
          images: { select: { image: { select: { mediaAssetId: true } } } },
        },
      });
      for (const item of revision.images) {
        if (!item.image.mediaAssetId)
          throw new ConflictException('Work image has not been migrated');
        ids.add(item.image.mediaAssetId);
      }
    }
    if (target.profileId && restore) {
      let cursor: string | undefined;
      for (;;) {
        const works = await tx.product.findMany({
          where: {
            sellerProfileId: target.profileId,
            status: 'APPROVED',
            publishedRevisionId: { not: null },
          },
          orderBy: { id: 'asc' },
          take: 100,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          select: {
            id: true,
            publishedRevision: {
              select: {
                images: {
                  select: { image: { select: { mediaAssetId: true } } },
                },
              },
            },
          },
        });
        if (!works.length) break;
        for (const work of works)
          for (const item of work.publishedRevision?.images ?? []) {
            if (!item.image.mediaAssetId)
              throw new ConflictException(
                'Published Work media has not been migrated',
              );
            ids.add(item.image.mediaAssetId);
          }
        cursor = works.at(-1)!.id;
      }
    }
    return [...ids];
  }
  async cancelPublication(
    tx: Prisma.TransactionClient,
    target: { profileId?: string; productId?: string },
  ) {
    const operations = await tx.mediaOperation.findMany({
      where: { ...target, kind: 'PUBLISH', state: { in: [...activeStates] } },
      include: objectInclude,
    });
    for (const operation of operations) {
      await tx.mediaOperation.update({
        where: { id: operation.id },
        data: { state: 'CANCELLED' },
      });
      await tx.mediaOperation.create({
        data: {
          kind: 'REVOKE',
          identity: `cancel:${operation.id}`,
          objects: {
            create: operation.objects.map((item) => ({
              objectId: item.objectId,
            })),
          },
        },
      });
      this.arm();
    }
  }

  async enqueueRevoke(
    tx: Prisma.TransactionClient,
    target: { profileId?: string; productId?: string },
  ) {
    await tx.mediaOperation.updateMany({
      where: { ...target, kind: 'PUBLISH', state: { in: [...activeStates] } },
      data: { state: 'CANCELLED' },
    });
    const objectWhere: Prisma.MediaObjectWhereInput = {
      tier: 'PUBLIC',
      asset: target.profileId
        ? { owner: { sellerProfile: { id: target.profileId } } }
        : { images: { some: { productId: target.productId! } } },
    };
    let cursor: string | undefined;
    for (;;) {
      const objects = await tx.mediaObject.findMany({
        where: objectWhere,
        take: 100,
        orderBy: { id: 'asc' },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: { id: true },
      });
      if (!objects.length) break;
      await tx.mediaOperation.create({
        data: {
          kind: 'REVOKE',
          identity: `revoke:${randomUUID()}`,
          ...target,
          objects: {
            create: objects.map((object) => ({ objectId: object.id })),
          },
        },
      });
      cursor = objects.at(-1)!.id;
    }
    this.arm();
  }
  async enqueueCleanup(tx: Prisma.TransactionClient, assetIds: string[]) {
    const objects = await tx.mediaObject.findMany({
      where: { assetId: { in: assetIds } },
      select: { id: true },
    });
    if (objects.length)
      await tx.mediaOperation.create({
        data: {
          kind: 'CLEANUP',
          identity: `cleanup:${randomUUID()}`,
          objects: {
            create: objects.map((object) => ({ objectId: object.id })),
          },
        },
      });
    this.arm();
  }
  async readPreview(assetId: string) {
    const preview = await this.prisma.mediaObject.findFirstOrThrow({
      where: { assetId, tier: 'PRIVATE', variant: 'PREVIEW', state: 'READY' },
    });
    return this.store.get('PRIVATE', preview.objectKey);
  }
  private async claim(id: string) {
    const now = new Date();
    const token = randomUUID();
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await tx.$queryRaw`SELECT id FROM media_operations WHERE id = ${id}::uuid FOR UPDATE`;
      const operation = await tx.mediaOperation.findUniqueOrThrow({
        where: { id },
        select: { objects: { select: { objectId: true } } },
      });
      const ids = operation.objects.map((item) => item.objectId).sort();
      for (const objectId of ids)
        await tx.$queryRaw`SELECT id FROM media_objects WHERE id = ${objectId}::uuid FOR UPDATE`;
      if (
        await tx.mediaObject.count({
          where: { id: { in: ids }, leaseUntil: { gt: now } },
        })
      )
        return null;
      const leaseUntil = new Date(Date.now() + 5 * 60_000);
      const result = await tx.mediaOperation.updateMany({
        where: {
          id,
          OR: [
            { state: { in: ['PENDING', 'FAILED'] } },
            { state: 'RUNNING', leaseUntil: { lt: now } },
          ],
        },
        data: {
          state: 'RUNNING',
          leaseToken: token,
          leaseUntil,
          attemptCount: { increment: 1 },
        },
      });
      if (!result.count) return null;
      await tx.mediaObject.updateMany({
        where: { id: { in: ids } },
        data: { leaseToken: token, leaseUntil },
      });
      return token;
    });
  }
  private async release(token: string) {
    await this.prisma.mediaObject.updateMany({
      where: { leaseToken: token },
      data: { leaseToken: null, leaseUntil: null },
    });
  }
  private async fail(
    id: string,
    token: string,
    errorCode = 'MEDIA_DELIVERY_FAILED',
  ) {
    await this.prisma.mediaOperation.updateMany({
      where: { id, leaseToken: token, state: 'RUNNING' },
      data: {
        state: 'FAILED',
        errorCode,
        nextAttemptAt: new Date(Date.now() + 15_000),
        leaseUntil: null,
        leaseToken: null,
      },
    });
  }
  private async writeVerified(
    object: {
      tier: 'PRIVATE' | 'PUBLIC';
      objectKey: string;
      sha256: string;
      byteLength: number;
      mimeType: string;
    },
    bytes: Uint8Array,
  ) {
    if (
      bytes.byteLength !== object.byteLength ||
      mediaChecksum(bytes) !== object.sha256
    )
      throw new Error('Media checksum mismatch');
    const existing = await this.store.get(object.tier, object.objectKey);
    if (!existing) {
      try {
        await this.store.put(
          object.tier,
          object.objectKey,
          { bytes, mimeType: object.mimeType },
          object,
        );
      } catch (error) {
        const written = await this.store.get(object.tier, object.objectKey);
        if (!written) throw error;
      }
    }
    const verified = await this.store.get(object.tier, object.objectKey);
    if (
      !verified ||
      verified.mimeType !== object.mimeType ||
      verified.bytes.byteLength !== object.byteLength ||
      mediaChecksum(verified.bytes) !== object.sha256
    )
      throw new Error('Stored media identity mismatch');
  }
  async run(id: string) {
    const token = await this.claim(id);
    if (!token) return;
    const operation = await this.prisma.mediaOperation.findUniqueOrThrow({
      where: { id },
      include: objectInclude,
    });
    try {
      if (operation.kind === 'PUBLISH') await this.publish(operation, token);
      else if (operation.kind === 'UPLOAD') {
        const source = operation.objects.find(
          (x) => x.object.variant === 'SOURCE',
        )?.object;
        if (!source) throw new Error('Missing SOURCE manifest');
        const bytes = await this.store.get('PRIVATE', source.objectKey);
        if (!bytes) throw new Error('SOURCE_RESEND_REQUIRED');
        const asset = await this.prisma.mediaAsset.findUniqueOrThrow({
          where: { id: source.assetId },
        });
        const values = await buildMediaPipeline(
          { buffer: Buffer.from(bytes.bytes), mimetype: source.mimeType },
          asset.purpose,
        );
        for (const item of operation.objects) {
          const value = values.find((x) => x.variant === item.object.variant);
          if (!value) throw new Error('Missing variant');
          await this.writeVerified(item.object, value.bytes);
          await this.prisma.mediaObject.update({
            where: { id: item.objectId },
            data: { state: 'READY' },
          });
        }
      } else await this.remove(operation);
      await this.prisma.mediaOperation.updateMany({
        where: { id, leaseToken: token, state: 'RUNNING' },
        data: {
          state: 'DONE',
          leaseUntil: null,
          leaseToken: null,
          errorCode: null,
        },
      });
    } catch (error) {
      await this.fail(
        id,
        token,
        error instanceof Error && error.message === 'SOURCE_RESEND_REQUIRED'
          ? 'SOURCE_RESEND_REQUIRED'
          : 'MEDIA_DELIVERY_FAILED',
      );
    } finally {
      await this.release(token);
      const fresh = await this.prisma.mediaOperation.findUnique({
        where: { id },
      });
      if (operation.kind === 'PUBLISH' && fresh?.state === 'CANCELLED')
        await this.prisma.mediaOperation.upsert({
          where: { identity: `late-cancel:${id}:${token}` },
          create: {
            kind: 'REVOKE',
            identity: `late-cancel:${id}:${token}`,
            objects: {
              create: operation.objects.map((item) => ({
                objectId: item.objectId,
              })),
            },
          },
          update: {},
        });
    }
  }
  private async publish(operation: Operation, token: string) {
    for (const item of operation.objects) {
      const fresh = await this.prisma.mediaOperation.findUniqueOrThrow({
        where: { id: operation.id },
      });
      if (fresh.state !== 'RUNNING' || fresh.leaseToken !== token) break;
      await this.prisma.mediaOperation.updateMany({
        where: { id: operation.id, leaseToken: token, state: 'RUNNING' },
        data: { leaseUntil: new Date(Date.now() + 5 * 60_000) },
      });
      await this.prisma.mediaObject.updateMany({
        where: { leaseToken: token },
        data: { leaseUntil: new Date(Date.now() + 5 * 60_000) },
      });
      const value = await this.store.get('PRIVATE', item.object.objectKey);
      if (!value) throw new Error('Private derivative is missing');
      await this.writeVerified(item.object, value.bytes);
    }
    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const fresh = await tx.mediaOperation.findUniqueOrThrow({
        where: { id: operation.id },
      });
      if (fresh.leaseToken !== token && fresh.state !== 'CANCELLED') return;
      if (
        fresh.state !== 'RUNNING' ||
        !(await this.switchPublication(tx, operation))
      ) {
        await tx.mediaOperation.update({
          where: { id: operation.id },
          data: { state: 'CANCELLED', leaseUntil: null, leaseToken: null },
        });
        await tx.mediaOperation.create({
          data: {
            kind: 'REVOKE',
            identity: `cancel:${operation.id}:${token}`,
            objects: {
              create: operation.objects.map((item) => ({
                objectId: item.objectId,
              })),
            },
          },
        });
        return;
      }
      await tx.mediaObject.updateMany({
        where: { id: { in: operation.objects.map((x) => x.objectId) } },
        data: { state: 'READY' },
      });
      await tx.mediaOperationObject.updateMany({
        where: { operationId: operation.id },
        data: { state: 'READY' },
      });
      await tx.mediaOperation.update({
        where: { id: operation.id },
        data: {
          state: 'DONE',
          leaseUntil: null,
          leaseToken: null,
          errorCode: null,
        },
      });
      await this.enqueueRevoke(
        tx,
        operation.profileId
          ? { profileId: operation.profileId }
          : { productId: operation.productId! },
      );
    });
  }
  private async switchPublication(
    tx: Prisma.TransactionClient,
    operation: MediaOperation,
  ) {
    if (!operation.revisionId || !operation.expectedRevisionAt) return false;
    if (operation.profileId) {
      await tx.$queryRaw`SELECT id FROM seller_profiles WHERE id = ${operation.profileId}::uuid FOR UPDATE`;
      const profile = await tx.sellerProfile.findUnique({
        where: { id: operation.profileId },
        include: { user: { select: { status: true } }, editingRevision: true },
      });
      const revision =
        operation.restore && profile
          ? await tx.sellerProfileRevision.findUnique({
              where: { id: operation.revisionId },
            })
          : profile?.editingRevision;
      if (
        !profile ||
        profile.user.status !== 'active' ||
        (!operation.restore && profile.status === 'SUSPENDED') ||
        !revision ||
        revision.id !== operation.revisionId ||
        revision.status !==
          (operation.restore ? 'APPROVED' : 'PENDING_REVIEW') ||
        revision.updatedAt.getTime() !==
          operation.expectedRevisionAt.getTime() ||
        profile.publishedRevisionId !== operation.previousRevisionId
      )
        return false;
      const data = {
        ...publishedSellerProfileData(revision),
        profilePhotoAssetId: revision.profilePhotoAssetId,
        profilePhotoObjectKey: revision.profilePhotoObjectKey,
        profilePhotoMimeType: revision.profilePhotoMimeType,
        profilePhotoByteLength: revision.profilePhotoByteLength,
        profilePhotoChecksum: revision.profilePhotoChecksum,
      };
      if (
        !data.profilePhotoMimeType ||
        !data.profilePhotoByteLength ||
        !data.profilePhotoChecksum ||
        !data.profilePhotoAssetId
      )
        throw new Error('Published photo is missing');
      if (!operation.restore)
        await tx.sellerProfileRevision.update({
          where: { id: revision.id },
          data: { status: 'APPROVED', reviewedAt: new Date() },
        });
      await tx.sellerProfile.update({
        where: { id: profile.id },
        data: {
          ...data,
          profilePhotoMimeType: data.profilePhotoMimeType,
          profilePhotoByteLength: data.profilePhotoByteLength,
          profilePhotoChecksum: data.profilePhotoChecksum,
          profilePhotoData: operation.restore
            ? profile.profilePhotoData
            : new Uint8Array(0),
          publishedRevisionId: revision.id,
          status: 'APPROVED',
        },
      });
    } else if (operation.productId) {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${operation.productId}::uuid FOR UPDATE`;
      const product = await tx.product.findUnique({
        where: { id: operation.productId },
        include: {
          sellerProfile: { include: { user: { select: { status: true } } } },
          editingRevision: true,
        },
      });
      const revision =
        operation.restore && product
          ? await tx.productRevision.findUnique({
              where: { id: operation.revisionId },
            })
          : product?.editingRevision;
      if (
        !product ||
        product.sellerProfile.status !== 'APPROVED' ||
        product.sellerProfile.user.status !== 'active' ||
        (!operation.restore && product.status === 'ARCHIVED') ||
        !revision ||
        revision.id !== operation.revisionId ||
        revision.status !==
          (operation.restore ? 'APPROVED' : 'PENDING_REVIEW') ||
        revision.updatedAt.getTime() !==
          operation.expectedRevisionAt.getTime() ||
        product.publishedRevisionId !== operation.previousRevisionId
      )
        return false;
      const data = publishedProductData(revision);
      if (!operation.restore)
        await tx.productRevision.update({
          where: { id: revision.id },
          data: { status: 'APPROVED', reviewedAt: new Date() },
        });
      await tx.product.update({
        where: { id: product.id },
        data: {
          ...data,
          status: 'APPROVED',
          publishedRevisionId: revision.id,
          publishedAt: product.publishedAt ?? new Date(),
        },
      });
    } else return false;
    await tx.auditEvent.create({
      data: {
        actorUserId: operation.actorUserId!,
        targetType: operation.profileId ? 'SELLER_PROFILE' : 'PRODUCT',
        targetId: operation.profileId ?? operation.productId!,
        oldStatus: operation.restore ? 'HIDDEN' : 'PENDING_REVIEW',
        newStatus: 'APPROVED',
      },
    });
    return true;
  }
  private async isPublic(assetId: string) {
    return Boolean(
      (await this.prisma.productImage.count({
        where: {
          mediaAssetId: assetId,
          revisions: {
            some: {
              revision: {
                publishedFor: {
                  status: 'APPROVED',
                  sellerProfile: {
                    status: 'APPROVED',
                    user: { status: 'active' },
                  },
                },
              },
            },
          },
        },
      })) ||
      (await this.prisma.sellerProfileRevision.count({
        where: {
          profilePhotoAssetId: assetId,
          publishedFor: { status: 'APPROVED', user: { status: 'active' } },
        },
      })) ||
      (await this.prisma.sellerProfileRevisionAchievement.count({
        where: {
          mediaAssetId: assetId,
          revision: {
            publishedFor: { status: 'APPROVED', user: { status: 'active' } },
          },
        },
      })),
    );
  }
  private async remove(operation: Operation) {
    for (const item of operation.objects) {
      if (
        item.object.tier === 'PUBLIC' &&
        (await this.isPublic(item.object.assetId))
      )
        continue;
      if (
        await this.prisma.mediaOperationObject.count({
          where: {
            objectId: item.objectId,
            operation: {
              id: { not: operation.id },
              OR: [
                { state: 'RUNNING', leaseUntil: { gt: new Date() } },
                { kind: 'PUBLISH', state: { in: ['PENDING', 'FAILED'] } },
              ],
            },
          },
        })
      )
        throw new Error('Media write is still active');
      if (
        operation.kind === 'CLEANUP' &&
        (await this.hasReference(this.prisma, item.object.assetId))
      )
        continue;
      if (
        item.object.variant === 'SOURCE' &&
        (
          await this.prisma.mediaAsset.findUniqueOrThrow({
            where: { id: item.object.assetId },
          })
        ).state === 'READY'
      )
        continue;
      await this.store.delete(item.object.tier, item.object.objectKey);
      if (item.object.publicUrl)
        await this.cache.purge([item.object.publicUrl]);
      await this.prisma.mediaObject.update({
        where: { id: item.objectId },
        data: { state: 'DELETED' },
      });
      await this.prisma.mediaOperationObject.update({
        where: {
          operationId_objectId: {
            operationId: operation.id,
            objectId: item.objectId,
          },
        },
        data: { state: 'DELETED' },
      });
    }
  }
  async deliver(id: string) {
    await this.run(id);
    const operation = await this.prisma.mediaOperation.findUniqueOrThrow({
      where: { id },
    });
    if (operation.state === 'DONE') {
      if (
        operation.kind === 'PUBLISH' &&
        !(await this.publicationApplied(operation))
      )
        throw new ConflictException('Publication was not applied');
      if (operation.kind === 'PUBLISH')
        await this.deliverOutstanding(
          operation.profileId
            ? { profileId: operation.profileId }
            : { productId: operation.productId! },
          'REVOKE',
        );
      return;
    }
    if (operation.state === 'FAILED')
      throw new ConflictException(
        operation.errorCode === 'SOURCE_RESEND_REQUIRED'
          ? 'Upload source must be resent'
          : 'Media delivery failed; retry this action',
      );
    if (operation.state === 'CANCELLED')
      throw new ConflictException('Publication was cancelled');
    throw new ConflictException(
      'Publication is in progress; retry to confirm the result',
    );
  }
  async deliverOutstanding(
    target: { profileId?: string; productId?: string },
    kind: 'REVOKE' | 'PUBLISH',
  ) {
    const operations = await this.prisma.mediaOperation.findMany({
      where: {
        ...target,
        kind,
        state: { in: ['PENDING', 'FAILED', 'RUNNING'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    for (const operation of operations) await this.deliver(operation.id);
  }
  private async publicationApplied(operation: {
    revisionId: string | null;
    profileId: string | null;
    productId: string | null;
  }) {
    if (!operation.revisionId) return false;
    if (operation.profileId) {
      const profile = await this.prisma.sellerProfile.findUnique({
        where: { id: operation.profileId },
        select: { publishedRevisionId: true, status: true },
      });
      return (
        profile?.publishedRevisionId === operation.revisionId &&
        profile.status === 'APPROVED'
      );
    }
    if (!operation.productId) return false;
    const product = await this.prisma.product.findUnique({
      where: { id: operation.productId },
      select: { publishedRevisionId: true, status: true },
    });
    return (
      product?.publishedRevisionId === operation.revisionId &&
      product.status === 'APPROVED'
    );
  }
}

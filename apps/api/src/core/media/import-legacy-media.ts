import type { MediaPurpose, Prisma } from '@bidplace/database';
import { PrismaService, runReadCommittedTransaction } from '../database';
import { ImageStore, imageKey } from '../image-store';
import { MediaLifecycleService } from './media-lifecycle.service';
import { mediaChecksum } from './media-object-store';

const page = { orderBy: { id: 'asc' as const }, take: 5 };
const after = (cursor?: string) => (cursor ? { id: { gt: cursor } } : {});
async function* rows<T extends { id: string }>(
  read: (cursor?: string) => Promise<T[]>,
) {
  let cursor: string | undefined;
  for (;;) {
    const batch = await read(cursor);
    if (!batch.length) return;
    for (const row of batch) yield row;
    cursor = batch.at(-1)!.id;
  }
}

// One-time maintenance cutover. Application writes and public reads must be stopped
// until imported references and their public derivatives have both been verified.
export async function importLegacyMedia(
  prisma: PrismaService,
  media: MediaLifecycleService,
  store: ImageStore,
  apply = false,
) {
  if (!media.enabled) throw new Error('R2 lifecycle configuration is required');
  let inspected = 0;
  let imported = 0;
  async function importOne(record: {
    key: string;
    bytes: Uint8Array | null;
    mimeType: string | null;
    byteLength: number | null;
    checksum: string | null;
    userId: string;
    purpose: MediaPurpose;
    attach: (
      tx: Prisma.TransactionClient,
      assetId: string,
    ) => Promise<{ count: number }>;
  }) {
    const stored = record.bytes?.byteLength
      ? { bytes: record.bytes, mimeType: record.mimeType }
      : await store.get(record.key);
    if (
      !stored ||
      !record.mimeType ||
      stored.mimeType !== record.mimeType ||
      stored.bytes.byteLength !== record.byteLength ||
      mediaChecksum(stored.bytes) !== record.checksum
    )
      throw new Error(`Legacy media verification failed: ${record.key}`);
    inspected++;
    if (!apply) return;
    const asset = await media.stage(
      record.userId,
      record.purpose,
      { buffer: Buffer.from(stored.bytes), mimetype: record.mimeType },
      `legacy:${mediaChecksum(Buffer.from(record.key))}`,
    );
    await runReadCommittedTransaction(prisma, async (tx) => {
      const result = await record.attach(tx, asset.id);
      if (result.count !== 1)
        throw new Error(`Legacy owner changed during import: ${record.key}`);
      await media.attach(tx, asset.id);
      await tx.mediaAsset.update({
        where: { id: asset.id },
        data: { sourceProvenance: 'LEGACY_NORMALIZED' },
      });
    });
    imported++;
  }

  for await (const row of rows((cursor) =>
    prisma.productImage.findMany({
      ...page,
      where: { ...after(cursor), mediaAssetId: null },
      include: {
        product: { select: { sellerProfile: { select: { userId: true } } } },
      },
    }),
  ))
    await importOne({
      key: row.objectKey ?? imageKey.productImage(row.id),
      bytes: row.data,
      mimeType: row.mimeType,
      byteLength: row.byteLength,
      checksum: row.checksum,
      userId: row.product.sellerProfile.userId,
      purpose: 'WORK_IMAGE',
      attach: (tx, assetId) =>
        tx.productImage.updateMany({
          where: { id: row.id, mediaAssetId: null, checksum: row.checksum },
          data: { mediaAssetId: assetId },
        }),
    });
  for await (const row of rows((cursor) =>
    prisma.sellerProfile.findMany({
      ...page,
      where: {
        ...after(cursor),
        profilePhotoAssetId: null,
        profilePhotoByteLength: { gt: 0 },
      },
    }),
  ))
    await importOne({
      key: row.profilePhotoObjectKey ?? imageKey.sellerPhoto(row.id),
      bytes: row.profilePhotoData,
      mimeType: row.profilePhotoMimeType,
      byteLength: row.profilePhotoByteLength,
      checksum: row.profilePhotoChecksum,
      userId: row.userId,
      purpose: 'AUTHOR_PHOTO',
      attach: (tx, assetId) =>
        tx.sellerProfile.updateMany({
          where: {
            id: row.id,
            profilePhotoAssetId: null,
            profilePhotoChecksum: row.profilePhotoChecksum,
          },
          data: { profilePhotoAssetId: assetId },
        }),
    });
  for await (const row of rows((cursor) =>
    prisma.sellerProfileRevision.findMany({
      ...page,
      where: {
        ...after(cursor),
        profilePhotoAssetId: null,
        profilePhotoMimeType: { not: null },
      },
      include: { sellerProfile: { select: { userId: true } } },
    }),
  ))
    await importOne({
      key: row.profilePhotoObjectKey ?? imageKey.sellerProfileRevision(row.id),
      bytes: row.profilePhotoData,
      mimeType: row.profilePhotoMimeType,
      byteLength: row.profilePhotoByteLength,
      checksum: row.profilePhotoChecksum,
      userId: row.sellerProfile.userId,
      purpose: 'AUTHOR_PHOTO',
      attach: (tx, assetId) =>
        tx.sellerProfileRevision.updateMany({
          where: {
            id: row.id,
            profilePhotoAssetId: null,
            profilePhotoChecksum: row.profilePhotoChecksum,
          },
          data: { profilePhotoAssetId: assetId },
        }),
    });
  for await (const row of rows((cursor) =>
    prisma.sellerProfileRevisionAchievement.findMany({
      ...page,
      where: { ...after(cursor), mediaAssetId: null, mimeType: { not: null } },
      include: {
        revision: { select: { sellerProfile: { select: { userId: true } } } },
      },
    }),
  ))
    await importOne({
      key: row.objectKey ?? imageKey.sellerAchievement(row.id),
      bytes: row.data,
      mimeType: row.mimeType,
      byteLength: row.byteLength,
      checksum: row.checksum,
      userId: row.revision.sellerProfile.userId,
      purpose: 'ACHIEVEMENT',
      attach: (tx, assetId) =>
        tx.sellerProfileRevisionAchievement.updateMany({
          where: { id: row.id, mediaAssetId: null, checksum: row.checksum },
          data: { mediaAssetId: assetId },
        }),
    });
  for await (const row of rows((cursor) =>
    prisma.productCreationStep.findMany({
      ...page,
      where: { ...after(cursor), mediaAssetId: null, mimeType: { not: null } },
      include: {
        product: { select: { sellerProfile: { select: { userId: true } } } },
      },
    }),
  ))
    await importOne({
      key: row.objectKey ?? imageKey.creationStep(row.id),
      bytes: row.data,
      mimeType: row.mimeType,
      byteLength: row.byteLength,
      checksum: row.checksum,
      userId: row.product.sellerProfile.userId,
      purpose: 'LEGACY_CREATION_STEP',
      attach: (tx, assetId) =>
        tx.productCreationStep.updateMany({
          where: { id: row.id, mediaAssetId: null, checksum: row.checksum },
          data: { mediaAssetId: assetId },
        }),
    });

  let publications = 0;
  if (apply)
    for await (const profile of rows((cursor) =>
      prisma.sellerProfile.findMany({
        ...page,
        where: {
          ...after(cursor),
          status: 'APPROVED',
          user: { status: 'active' },
          publishedRevisionId: { not: null },
        },
        include: { publishedRevision: true },
      }),
    )) {
      const revision = profile.publishedRevision!;
      const operation = await runReadCommittedTransaction(
        prisma,
        async (tx) => {
          const pending = await tx.mediaOperation.findFirst({
            where: {
              profileId: profile.id,
              kind: 'PUBLISH',
              state: { in: ['PENDING', 'RUNNING', 'FAILED'] },
            },
          });
          return (
            pending ??
            media.enqueuePublication(
              tx,
              { profileId: profile.id },
              revision,
              revision.id,
              profile.userId,
              true,
            )
          );
        },
      );
      await media.run(operation.id);
      const state = await prisma.mediaOperation.findUniqueOrThrow({
        where: { id: operation.id },
        select: { state: true },
      });
      if (state.state !== 'DONE')
        throw new Error(
          'Legacy public delivery is incomplete; keep maintenance enabled and retry',
        );
      publications++;
    }
  return { inspected, imported, publications };
}

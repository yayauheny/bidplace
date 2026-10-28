import { createHash } from 'node:crypto';
import { ImageProcessor } from './image-processor';

import {
  Inject,
  ServiceUnavailableException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  STORY_LIMITS,
  photoCropSchema,
  workPhotoResultSchema,
  type WorkPhotoResult,
  type WorkPhotoEditRequest,
  type ProductStatus,
  type SellerStatus,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import {
  MediaLifecycleService,
  mediaUploadIdentity,
} from '../core/media/media-lifecycle.service';
import {
  mediaChecksum,
  mediaInputChecksum,
} from '../core/media/media-object-store';
import { PrismaService, runReadCommittedTransaction } from '../core/database';
import { emptyImageBytes, ImageStore, imageKey } from '../core/image-store';
import {
  assertProductImageCapacity,
  assertProductImageCount,
  productImageUploadLimits,
  type RawImageUpload,
  validateAndNormalizeProductImageUploads,
} from './image-policy';
import {
  assertProductWritable,
  lockProductRowForUpdate,
  type ProductWriteGuardKind,
} from '../products/product-write-guard';
import { canAuthorEditRevision } from '../products/product-revision-state';
import { assertApprovedSeller } from '../sellers/seller-capability';

export const productImageAuthorizationSelect = {
  mediaAssetId: true,
  revisions: { select: { revisionId: true } },
  product: {
    select: {
      status: true,
      publishedRevisionId: true,
      sellerProfile: {
        select: {
          userId: true,
          status: true,
          user: { select: { status: true } },
        },
      },
    },
  },
} satisfies Prisma.ProductImageSelect;

export type ProductImageAuthorizationRecord = Prisma.ProductImageGetPayload<{
  select: typeof productImageAuthorizationSelect;
}>;

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStore: ImageStore,
    @Inject(MediaLifecycleService)
    private readonly media?: MediaLifecycleService,
    @Inject(ImageProcessor) private readonly processor?: ImageProcessor,
  ) {}

  async add(
    userId: string,
    productId: string,
    files: readonly RawImageUpload[],
    idempotencyKey?: string,
    expectedRevisionId?: string,
  ) {
    if (
      idempotencyKey !== undefined &&
      (!/^[a-zA-Z0-9:_-]{1,100}$/.test(idempotencyKey) || files.length !== 1)
    )
      throw new BadRequestException(
        'An idempotent upload requires one image and a valid key',
      );
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
    );

    if (expectedRevisionId && product.editingRevisionId !== expectedRevisionId)
      throw new ConflictException('Product editing revision changed');
    const uploadIdentity = idempotencyKey
      ? createHash('sha256')
          .update(`${userId}:${productId}:${idempotencyKey}`)
          .digest('hex')
      : null;
    const inputChecksum = uploadIdentity ? mediaInputChecksum(files[0]!) : null;
    const replay = async (
      client: Prisma.TransactionClient,
      revisionId: string | null,
    ) => {
      if (!uploadIdentity || !idempotencyKey || !revisionId) return false;
      const recorded = await this.replayPhotoOperation(
        client,
        this.photoOperationIdentity(userId, productId, idempotencyKey),
        revisionId,
        inputChecksum ?? undefined,
      );
      if (recorded) return true;
      const existing = await client.productImage.findUnique({
        where: { uploadIdentity },
        select: {
          inputChecksum: true,
          revisions: { select: { revisionId: true } },
        },
      });
      if (!existing) return false;
      if (existing.inputChecksum !== inputChecksum)
        throw new ConflictException(
          'Idempotency identity has different content',
        );
      if (
        !existing.revisions.some(
          (revision) => revision.revisionId === revisionId,
        )
      )
        throw new ConflictException(
          'Upload identity belongs to an earlier revision',
        );
      return true;
    };
    if (await replay(this.prisma, product.editingRevisionId))
      return { ok: true as const };
    if (this.media?.enabled) {
      return this.addMedia(
        userId,
        productId,
        product,
        files,
        idempotencyKey,
        expectedRevisionId,
      );
    }
    assertProductImageCount(product.images.length, files.length);
    let validated;
    if (uploadIdentity) {
      if (!this.processor) throw new Error('Image processor is missing');
      const processed = await this.processor.process(files[0]!, 'WORK_IMAGE');
      // Legacy ImageStore is publicly served: persist the metadata-stripped variant.
      const preview = processed.find((image) => image.variant === 'PREVIEW');
      if (!preview) throw new Error('Processed image preview is missing');
      validated = [
        {
          buffer: preview.bytes,
          mimeType: preview.mimeType,
          width: preview.width,
          height: preview.height,
        },
      ];
    } else {
      validated = await validateAndNormalizeProductImageUploads(files);
    }

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const freshProduct = await this.requireWritableOwnerInTx(
        tx,
        userId,
        productId,
      );

      if (
        expectedRevisionId &&
        freshProduct.editingRevisionId !== expectedRevisionId
      )
        throw new ConflictException('Product editing revision changed');
      if (await replay(tx, freshProduct.editingRevisionId)) return;
      assertProductImageCapacity(
        freshProduct.images,
        validated.map((file) => ({ byteLength: file.buffer.byteLength })),
      );

      const start = freshProduct.images.length;

      for (const [index, file] of validated.entries()) {
        const row = await tx.productImage.create({
          data: {
            productId,
            uploadIdentity,
            inputChecksum,
            position: freshProduct.nextProductImagePosition + index,
            mimeType: file.mimeType,
            byteLength: file.buffer.byteLength,
            data: emptyImageBytes,
            checksum: createHash('sha256').update(file.buffer).digest('hex'),
            width: file.width ?? null,
            height: file.height ?? null,
          },
        });

        const key = imageKey.productImage(row.id);
        await tx.productImage.update({
          where: { id: row.id },
          data: { objectKey: key },
        });

        await this.imageStore.put(
          key,
          {
            bytes: file.buffer,
            mimeType: file.mimeType,
          },
          tx,
        );
        if (!freshProduct.editingRevisionId) {
          throw new ConflictException('Product editing revision is missing');
        }
        const slot = await tx.productRevisionImage.create({
          data: {
            revisionId: freshProduct.editingRevisionId,
            imageId: row.id,
            position: start + index,
          },
        });
        if (idempotencyKey)
          await this.recordPhotoOperation(
            tx,
            userId,
            productId,
            idempotencyKey,
            this.photoResult(slot),
            inputChecksum,
          );
      }
    });

    return { ok: true as const };
  }

  private async addMedia(
    userId: string,
    productId: string,
    product: {
      editingRevisionId: string | null;
      images: readonly { byteLength: number }[];
    },
    files: readonly RawImageUpload[],
    idempotencyKey?: string,
    expectedRevisionId?: string,
  ) {
    const media = this.media!;
    if (
      await this.replayAttachedWorkUpload(
        userId,
        productId,
        product.editingRevisionId,
        files,
        idempotencyKey,
      )
    ) {
      return { ok: true as const };
    }
    assertProductImageCount(product.images.length, files.length);
    if (
      product.images.reduce((total, image) => total + image.byteLength, 0) >=
      productImageUploadLimits.maxTotalBytes
    ) {
      throw new BadRequestException(
        `A Product cannot exceed ${productImageUploadLimits.maxTotalBytes} total image bytes`,
      );
    }
    const scopedKey = idempotencyKey
      ? createHash('sha256')
          .update(`${productId}:${idempotencyKey}`)
          .digest('hex')
      : undefined;
    const assets: Array<Awaited<ReturnType<MediaLifecycleService['stage']>>> =
      [];
    for (const file of files) {
      assets.push(await media.stage(userId, 'WORK_IMAGE', file, scopedKey));
    }
    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const product = await this.requireWritableOwnerInTx(
        tx,
        userId,
        productId,
      );
      if (
        expectedRevisionId &&
        product.editingRevisionId !== expectedRevisionId
      )
        throw new ConflictException('Product editing revision changed');
      await media.assertNotPending(tx, { productId });
      const attached = await tx.productImage.findMany({
        where: {
          productId,
          mediaAssetId: { in: assets.map((asset) => asset.id) },
        },
        select: {
          mediaAssetId: true,
          revisions: { select: { revisionId: true } },
        },
      });
      if (
        attached.some(
          (image) =>
            !image.revisions.some(
              (revision) => revision.revisionId === product.editingRevisionId,
            ),
        )
      )
        throw new ConflictException(
          'Upload identity belongs to an earlier revision',
        );
      const pending = assets.filter(
        (asset) => !attached.some((image) => image.mediaAssetId === asset.id),
      );
      assertProductImageCapacity(
        product.images,
        pending.map((asset) => ({ byteLength: asset.source.byteLength })),
      );
      if (!product.editingRevisionId)
        throw new ConflictException('Product editing revision is missing');
      for (const [index, asset] of pending.entries()) {
        await media.attach(tx, asset.id);
        const row = await tx.productImage.create({
          data: {
            productId,
            position: product.nextProductImagePosition + index,
            mediaAssetId: asset.id,
            uploadIdentity: idempotencyKey
              ? createHash('sha256')
                  .update(`${userId}:${productId}:${idempotencyKey}`)
                  .digest('hex')
              : null,
            inputChecksum: idempotencyKey
              ? mediaInputChecksum(files[index]!)
              : null,
            objectKey: asset.preview.objectKey,
            mimeType: asset.preview.mimeType,
            byteLength: asset.source.byteLength,
            checksum: asset.preview.sha256,
            width: asset.preview.width,
            height: asset.preview.height,
            data: emptyImageBytes,
          },
        });
        const slot = await tx.productRevisionImage.create({
          data: {
            revisionId: product.editingRevisionId,
            imageId: row.id,
            position: product.images.length + index,
          },
        });
        if (idempotencyKey)
          await this.recordPhotoOperation(
            tx,
            userId,
            productId,
            idempotencyKey,
            this.photoResult(slot),
            mediaInputChecksum(files[index]!),
          );
      }
    });
    return { ok: true as const };
  }

  private async replayAttachedWorkUpload(
    userId: string,
    productId: string,
    editingRevisionId: string | null,
    files: readonly RawImageUpload[],
    idempotencyKey?: string,
  ): Promise<boolean> {
    if (!idempotencyKey) return false;
    const file = files[0];
    if (!file) return false;
    const operation = await this.prisma.mediaOperation.findUnique({
      where: {
        identity: mediaUploadIdentity(
          userId,
          'WORK_IMAGE',
          createHash('sha256')
            .update(`${productId}:${idempotencyKey}`)
            .digest('hex'),
        ),
      },
      include: { objects: { include: { object: true } } },
    });
    if (!operation) return false;
    const source = operation.objects.find(
      (item) => item.object.variant === 'SOURCE',
    )?.object;
    if (
      !source ||
      (operation.inputChecksum
        ? operation.inputChecksum !== mediaInputChecksum(file)
        : source.sha256 !== mediaChecksum(file.buffer) ||
          source.mimeType !== file.mimetype)
    ) {
      throw new ConflictException('Idempotency identity has different content');
    }
    if (operation.state === 'CANCELLED') {
      throw new ConflictException('Media upload was cancelled');
    }
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: source.assetId },
      select: { state: true },
    });
    if (asset?.state === 'FAILED') {
      throw new ConflictException(
        'Media upload expired; retry with a new identity',
      );
    }
    const attached = await this.prisma.productImage.findMany({
      where: { productId, mediaAssetId: source.assetId },
      select: { revisions: { select: { revisionId: true } } },
    });
    if (
      attached.some(
        (image) =>
          !image.revisions.some(
            (revision) => revision.revisionId === editingRevisionId,
          ),
      )
    ) {
      throw new ConflictException(
        'Upload identity belongs to an earlier revision',
      );
    }
    return attached.length > 0;
  }

  private photoOperationIdentity(
    userId: string,
    productId: string,
    key: string,
    slotId?: string,
  ) {
    const scoped = createHash('sha256')
      .update(
        slotId
          ? `${userId}:${productId}:${slotId}:${key}`
          : `${productId}:${key}`,
      )
      .digest('hex');
    return mediaUploadIdentity(userId, 'WORK_IMAGE', scoped);
  }

  private async replayPhotoOperation(
    client: Pick<
      Prisma.TransactionClient,
      'mediaOperation' | 'productRevisionImage'
    >,
    identity: string,
    revisionId: string,
    inputChecksum?: string,
    requestChecksum?: string,
  ) {
    const operation = await client.mediaOperation.findUnique({
      where: { identity },
    });
    if (!operation?.photoResult) return undefined;
    if (
      (inputChecksum && operation.inputChecksum !== inputChecksum) ||
      (requestChecksum && operation.photoRequestChecksum !== requestChecksum)
    )
      throw new ConflictException('Idempotency identity has different content');
    if (operation.revisionId !== revisionId)
      throw new ConflictException(
        'Upload identity belongs to an earlier revision',
      );
    const result = workPhotoResultSchema.parse(operation.photoResult);
    if (
      !(await client.productRevisionImage.findUnique({
        where: { slotId: result.slotId },
      }))
    )
      throw new ConflictException('Photo slot was removed');
    return result;
  }

  private async recordPhotoOperation(
    tx: Prisma.TransactionClient,
    userId: string,
    productId: string,
    key: string,
    result: WorkPhotoResult,
    inputChecksum: string | null,
    requestChecksum?: string,
    slotId?: string,
  ) {
    const identity = this.photoOperationIdentity(
      userId,
      productId,
      key,
      slotId,
    );
    const data = {
      productId,
      revisionId: result.revisionId,
      photoResult: result,
      photoRequestChecksum: requestChecksum ?? null,
    };
    await tx.mediaOperation.upsert({
      where: { identity },
      create: {
        ...data,
        identity,
        kind: 'UPLOAD',
        state: 'DONE',
        inputChecksum,
      },
      update: {},
    });
    await tx.mediaOperation.updateMany({
      where: { identity, photoResult: { equals: Prisma.DbNull } },
      data,
    });
    const stored = await tx.mediaOperation.findUniqueOrThrow({
      where: { identity },
    });
    return workPhotoResultSchema.parse(stored.photoResult);
  }

  private photoResult(slot: {
    revisionId: string;
    slotId: string;
    imageId: string;
    version: number;
    crop: Prisma.JsonValue;
  }) {
    return {
      revisionId: slot.revisionId,
      slotId: slot.slotId,
      imageId: slot.imageId,
      version: slot.version,
      crop: photoCropSchema.nullable().parse(slot.crop),
    };
  }

  async photoOperation(
    userId: string,
    productId: string,
    key: string,
    slotId?: string,
  ) {
    if (!/^[a-zA-Z0-9:_-]{1,100}$/.test(key))
      throw new BadRequestException('Invalid image operation');
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        editingRevisionId: true,
        sellerProfile: { select: { userId: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerProfile.userId !== userId)
      throw new ForbiddenException('Product is not owned by user');
    if (!product.editingRevisionId)
      throw new ConflictException('Product editing revision is missing');
    const recorded = await this.replayPhotoOperation(
      this.prisma,
      this.photoOperationIdentity(userId, productId, key, slotId),
      product.editingRevisionId,
    );
    if (recorded) return { photo: recorded };
    const identity = createHash('sha256')
      .update(
        slotId
          ? `${userId}:${productId}:${slotId}:${key}`
          : `${userId}:${productId}:${key}`,
      )
      .digest('hex');
    const manifest = await this.prisma.mediaOperation.findUnique({
      where: {
        identity: this.photoOperationIdentity(userId, productId, key, slotId),
      },
      include: { objects: { include: { object: true } } },
    });
    const assetId = manifest?.objects.find(
      (item) => item.object.variant === 'SOURCE',
    )?.object.assetId;
    const slot = await this.prisma.productRevisionImage.findFirst({
      where: slotId
        ? { slotId, operationKey: identity }
        : {
            image: {
              productId,
              OR: [
                { uploadIdentity: identity },
                ...(assetId ? [{ mediaAssetId: assetId }] : []),
              ],
            },
          },
      include: { image: { select: { inputChecksum: true } } },
      orderBy: { revision: { version: 'asc' } },
    });
    if (!slot) return { photo: null };
    if (slot.revisionId !== product.editingRevisionId)
      throw new ConflictException(
        'Upload identity belongs to an earlier revision',
      );
    const photo = this.photoResult(slot);
    const recordedPhoto = await runReadCommittedTransaction(this.prisma, (tx) =>
      this.recordPhotoOperation(
        tx,
        userId,
        productId,
        key,
        photo,
        manifest?.inputChecksum ?? slot.image.inputChecksum,
        undefined,
        slotId,
      ),
    );
    return { photo: recordedPhoto };
  }

  async editPhoto(
    userId: string,
    productId: string,
    slotId: string,
    request: WorkPhotoEditRequest,
    file?: RawImageUpload,
  ) {
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
    );
    if (product.editingRevisionId !== request.revisionId)
      throw new ConflictException('Product editing revision changed');
    const operationKey = createHash('sha256')
      .update(`${userId}:${productId}:${slotId}:${request.operationKey}`)
      .digest('hex');
    const operationChecksum = createHash('sha256')
      .update(JSON.stringify(request))
      .update(file ? mediaInputChecksum(file) : 'crop-only')
      .digest('hex');
    const checkSlot = (
      slot: {
        revisionId: string;
        version: number;
        operationKey: string | null;
        operationChecksum: string | null;
      } | null,
    ) => {
      if (!slot || slot.revisionId !== request.revisionId)
        throw new NotFoundException('Photo slot not found');
      if (slot.operationKey === operationKey) {
        if (slot.operationChecksum !== operationChecksum)
          throw new ConflictException(
            'Idempotency identity has different content',
          );
        return true;
      }
      if (slot.version !== request.version)
        throw new ConflictException('Photo slot changed');
      return false;
    };
    if (file && !this.media?.enabled && !this.imageStore.transactionalWrites)
      throw new ServiceUnavailableException(
        'Photo replacement requires media lifecycle storage',
      );
    const identity = this.photoOperationIdentity(
      userId,
      productId,
      request.operationKey,
      slotId,
    );
    const recorded = await this.replayPhotoOperation(
      this.prisma,
      identity,
      request.revisionId,
      undefined,
      operationChecksum,
    );
    if (recorded) return { ok: true as const, photo: recorded };
    const initial = await this.prisma.productRevisionImage.findUnique({
      where: { slotId },
    });
    if (checkSlot(initial))
      return { ok: true as const, photo: this.photoResult(initial!) };
    let staged: Awaited<ReturnType<MediaLifecycleService['stage']>> | undefined;
    let processed: Awaited<ReturnType<ImageProcessor['process']>> | undefined;
    if (file) {
      if (this.media?.enabled)
        staged = await this.media.stage(
          userId,
          'WORK_IMAGE',
          file,
          operationKey,
        );
      else {
        if (!this.processor) throw new Error('Image processor is missing');
        processed = await this.processor.process(file, 'WORK_IMAGE');
      }
    }
    try {
      return await runReadCommittedTransaction(this.prisma, async (tx) => {
        const fresh = await this.requireWritableOwnerInTx(
          tx,
          userId,
          productId,
        );
        if (fresh.editingRevisionId !== request.revisionId)
          throw new ConflictException('Product editing revision changed');
        if (this.media?.enabled)
          await this.media.assertNotPending(tx, { productId });
        const replay = await this.replayPhotoOperation(
          tx,
          identity,
          request.revisionId,
          undefined,
          operationChecksum,
        );
        if (replay) return { ok: true as const, photo: replay };
        const slot = await tx.productRevisionImage.findUnique({
          where: { slotId },
        });
        if (checkSlot(slot))
          return { ok: true as const, photo: this.photoResult(slot!) };
        const current = slot!;
        let imageId = current.imageId;
        if (file) {
          const legacyPreview = processed?.find(
            (image) => image.variant === 'PREVIEW',
          );
          const preview = staged?.preview ?? legacyPreview;
          const sourceBytes =
            staged?.source.byteLength ?? legacyPreview?.bytes.byteLength;
          if (!preview || !sourceBytes)
            throw new Error('Processed image preview is missing');
          assertProductImageCapacity(
            fresh.images.filter((image) => image.id !== current.imageId),
            [{ byteLength: sourceBytes }],
          );
          if (staged) await this.media!.attach(tx, staged.id);
          const next = await tx.productImage.create({
            data: {
              productId,
              position: fresh.nextProductImagePosition,
              mediaAssetId: staged?.id ?? null,
              objectKey: staged?.preview.objectKey ?? null,
              mimeType: preview.mimeType,
              byteLength: sourceBytes,
              checksum: staged
                ? staged.preview.sha256
                : mediaChecksum(legacyPreview!.bytes),
              width: preview.width,
              height: preview.height,
              data: emptyImageBytes,
            },
          });
          imageId = next.id;
          if (!staged) {
            const bytes = legacyPreview!.bytes;
            const key = imageKey.productImage(imageId);
            await tx.productImage.update({
              where: { id: imageId },
              data: { objectKey: key },
            });
            await this.imageStore.put(
              key,
              { bytes, mimeType: preview.mimeType },
              tx,
            );
          }
        }
        const updated = await tx.productRevisionImage.update({
          where: { slotId },
          data: {
            imageId,
            crop: request.crop ?? Prisma.DbNull,
            version: { increment: 1 },
            operationKey,
            operationChecksum,
          },
        });
        if (
          imageId !== current.imageId &&
          !(await tx.productRevisionImage.count({
            where: { imageId: current.imageId },
          }))
        ) {
          const previous = await tx.productImage.findUniqueOrThrow({
            where: { id: current.imageId },
            select: { mediaAssetId: true },
          });
          await tx.productImage.delete({ where: { id: current.imageId } });
          if (previous.mediaAssetId && this.media?.enabled)
            await this.media.enqueueCleanup(tx, [previous.mediaAssetId]);
          else
            await this.imageStore.delete(
              imageKey.productImage(current.imageId),
              tx,
            );
        }
        const result = this.photoResult(updated);
        await this.recordPhotoOperation(
          tx,
          userId,
          productId,
          request.operationKey,
          result,
          file ? mediaInputChecksum(file) : null,
          operationChecksum,
          slotId,
        );
        return { ok: true as const, photo: result };
      });
    } catch (error) {
      if (staged)
        await runReadCommittedTransaction(this.prisma, (tx) =>
          this.media!.enqueueCleanup(tx, [staged!.id]),
        );
      throw error;
    }
  }

  async remove(
    userId: string,
    productId: string,
    imageId: string,
    revisionId?: string,
  ) {
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
    );

    if (revisionId && product.editingRevisionId !== revisionId)
      throw new ConflictException('Product editing revision changed');
    if (!product.images.some((image) => image.id === imageId)) {
      throw new NotFoundException('Image not found');
    }

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const locked = await this.requireWritableOwnerInTx(tx, userId, productId);
      if (revisionId && locked.editingRevisionId !== revisionId)
        throw new ConflictException('Product editing revision changed');
      if (!locked.images.some((image) => image.id === imageId)) {
        throw new NotFoundException('Image not found');
      }
      if (!locked.editingRevisionId) {
        throw new ConflictException('Product editing revision is missing');
      }
      const remaining = await tx.productImage.findMany({
        where: { productId, id: { not: imageId } },
        select: { id: true },
        orderBy: { position: 'asc' },
      });

      await tx.productRevisionImage.deleteMany({
        where: {
          revisionId: locked.editingRevisionId,
          imageId,
        },
      });
      const revisionReferences = await tx.productRevisionImage.count({
        where: { imageId },
      });
      const remainingRevisionImages = await tx.productRevisionImage.findMany({
        where: { revisionId: locked.editingRevisionId },
        select: { imageId: true },
        orderBy: { position: 'asc' },
      });
      if (revisionReferences === 0) {
        if (this.media?.enabled) {
          const image = await tx.productImage.findUniqueOrThrow({
            where: { id: imageId },
            select: { mediaAssetId: true },
          });
          if (image.mediaAssetId)
            await this.media.enqueueCleanup(tx, [image.mediaAssetId]);
        } else await this.imageStore.delete(imageKey.productImage(imageId), tx);
        await tx.productImage.delete({ where: { id: imageId } });
        if (!locked.usesRevisionImageOrder) {
          const temporaryBase = remaining.length + 1;

          await Promise.all(
            remaining.map((image, index) =>
              tx.productImage.update({
                where: { id: image.id },
                data: { position: temporaryBase + index },
              }),
            ),
          );

          await Promise.all(
            remaining.map((image, index) =>
              tx.productImage.update({
                where: { id: image.id },
                data: { position: index },
              }),
            ),
          );
        }
      }

      await this.reindexRevisionImages(
        tx,
        locked.editingRevisionId,
        remainingRevisionImages.map((image) => image.imageId),
      );
    });

    return { ok: true as const };
  }

  async reorder(
    userId: string,
    productId: string,
    imageIds: string[],
    revisionId?: string,
  ) {
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
    );

    if (revisionId && product.editingRevisionId !== revisionId)
      throw new ConflictException('Product editing revision changed');
    const knownIds = new Set(product.images.map((image) => image.id));
    if (
      imageIds.length !== knownIds.size ||
      new Set(imageIds).size !== imageIds.length ||
      imageIds.some((id) => !knownIds.has(id))
    ) {
      throw new BadRequestException(
        'Image order must include every Product image exactly once',
      );
    }

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const locked = await this.requireWritableOwnerInTx(tx, userId, productId);
      if (revisionId && locked.editingRevisionId !== revisionId)
        throw new ConflictException('Product editing revision changed');
      const knownLockedIds = new Set(locked.images.map((image) => image.id));
      if (
        imageIds.length !== knownLockedIds.size ||
        new Set(imageIds).size !== imageIds.length ||
        imageIds.some((id) => !knownLockedIds.has(id))
      ) {
        throw new ConflictException(
          'Product images changed while saving order',
        );
      }
      if (!locked.editingRevisionId) {
        throw new ConflictException('Product editing revision is missing');
      }
      if (!locked.usesRevisionImageOrder) {
        const temporaryBase = locked.images.length;

        await Promise.all(
          imageIds.map((id, index) =>
            tx.productImage.update({
              where: { id },
              data: { position: temporaryBase + index },
            }),
          ),
        );
      }

      await this.reindexRevisionImages(tx, locked.editingRevisionId, imageIds);

      if (!locked.usesRevisionImageOrder) {
        await Promise.all(
          imageIds.map((id, index) =>
            tx.productImage.update({
              where: { id },
              data: { position: index },
            }),
          ),
        );
      }
    });

    return { ok: true as const };
  }

  async addCreationStepImage(
    userId: string,
    productId: string,
    stepId: string,
    file: RawImageUpload,
  ) {
    await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
      'creation-story',
    );
    const step = await this.prisma.productCreationStep.findFirst({
      where: { id: stepId, productId },
      select: { id: true },
    });
    if (!step) throw new NotFoundException('Creation step not found');

    if (this.media?.enabled) {
      const asset = await this.media.stage(
        userId,
        'LEGACY_CREATION_STEP',
        file,
      );
      await runReadCommittedTransaction(this.prisma, async (tx) => {
        await this.requireWritableOwnerInTx(
          tx,
          userId,
          productId,
          'creation-story',
        );
        await this.media!.assertNotPending(tx, { productId });
        const current = await tx.productCreationStep.findFirst({
          where: { id: stepId, productId },
        });
        if (!current) throw new NotFoundException('Creation step not found');
        await this.media!.attach(tx, asset.id);
        await tx.productCreationStep.update({
          where: { id: stepId },
          data: {
            mediaAssetId: asset.id,
            objectKey: asset.preview.objectKey,
            mimeType: asset.preview.mimeType,
            byteLength: asset.preview.byteLength,
            checksum: asset.preview.sha256,
            width: asset.preview.width,
            height: asset.preview.height,
            data: null,
          },
        });
        if (current.mediaAssetId)
          await this.media!.enqueueCleanup(tx, [current.mediaAssetId]);
      });
      return { ok: true as const };
    }

    const validatedFiles = await validateAndNormalizeProductImageUploads([
      file,
    ]);
    const validated = validatedFiles[0];
    if (!validated) {
      throw new BadRequestException('An image is required');
    }

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      await this.requireWritableOwnerInTx(
        tx,
        userId,
        productId,
        'creation-story',
      );
      const currentStep = await tx.productCreationStep.findFirst({
        where: { id: stepId, productId },
        select: { id: true },
      });
      if (!currentStep) throw new NotFoundException('Creation step not found');

      await tx.productCreationStep.update({
        where: { id: currentStep.id },
        data: {
          mimeType: validated.mimeType,
          byteLength: validated.buffer.byteLength,
          checksum: createHash('sha256').update(validated.buffer).digest('hex'),
          width: validated.width ?? null,
          height: validated.height ?? null,
          objectKey: imageKey.creationStep(currentStep.id),
        },
      });

      await this.imageStore.put(
        imageKey.creationStep(currentStep.id),
        {
          bytes: validated.buffer,
          mimeType: validated.mimeType,
        },
        tx,
      );
    });

    return { ok: true as const };
  }

  async getCreationStepImage(stepId: string, userId?: string, role?: string) {
    const step = await this.prisma.productCreationStep.findUnique({
      where: { id: stepId },
      select: {
        id: true,
        mimeType: true,
        byteLength: true,
        checksum: true,
        mediaAssetId: true,
        product: {
          select: {
            status: true,
            sellerProfile: {
              select: {
                userId: true,
                status: true,
                user: { select: { status: true } },
              },
            },
          },
        },
      },
    });
    if (!step || !step.mimeType || !step.byteLength || !step.checksum) {
      throw new NotFoundException('Creation step image not found');
    }

    const isOwner = step.product.sellerProfile.userId === userId;
    const isAdmin = role === 'admin';
    const isPublic =
      step.product.status === 'APPROVED' &&
      step.product.sellerProfile.status === 'APPROVED' &&
      step.product.sellerProfile.user.status === 'active';
    if (!isOwner && !isAdmin && !isPublic) {
      throw new NotFoundException('Creation step image not found');
    }

    const stored =
      step.mediaAssetId && this.media?.enabled
        ? await this.media.readPreview(step.mediaAssetId)
        : await this.imageStore.get(imageKey.creationStep(stepId));
    if (!stored) {
      throw new NotFoundException('Creation step image not found');
    }

    return {
      mimeType: stored.mimeType,
      data: stored.bytes,
      isPublic,
    };
  }

  async get(imageId: string, userId?: string, role?: string, source = false) {
    const image: ProductImageAuthorizationRecord | null =
      await this.prisma.productImage.findUnique({
        where: { id: imageId },
        select: productImageAuthorizationSelect,
      });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    const isOwner = image.product.sellerProfile.userId === userId;
    const isAdmin = role === 'admin';
    const isPublic =
      image.product.status === 'APPROVED' &&
      image.product.sellerProfile.status === 'APPROVED' &&
      image.product.sellerProfile.user.status === 'active' &&
      image.product.publishedRevisionId !== null &&
      image.revisions.some(
        ({ revisionId }) => revisionId === image.product.publishedRevisionId,
      );

    if (!isOwner && !isAdmin && !isPublic) {
      throw new NotFoundException('Image not found');
    }

    if (source && !isOwner && !isAdmin)
      throw new NotFoundException('Image not found');
    const stored =
      image.mediaAssetId && this.media?.enabled
        ? source
          ? await this.media.readSource(image.mediaAssetId)
          : await this.media.readPreview(image.mediaAssetId)
        : await this.imageStore.get(imageKey.productImage(imageId));
    if (!stored) {
      throw new NotFoundException('Image not found');
    }

    return {
      mimeType: stored.mimeType,
      data: stored.bytes,
      isPublic: source ? false : isPublic,
    };
  }

  async addStoryImage(
    userId: string,
    productId: string,
    file: RawImageUpload,
    idempotencyKey: string | undefined,
    expectedRevisionId: string,
  ) {
    if (!this.media?.enabled) {
      throw new ConflictException('Story images require the media pipeline');
    }
    if (
      idempotencyKey !== undefined &&
      !/^[a-zA-Z0-9:_-]{1,100}$/.test(idempotencyKey)
    ) {
      throw new BadRequestException('Invalid idempotency key');
    }
    // Match gallery uploads: reject non-owners before staging bytes in R2.
    const product = await this.requireEditableOwner(this.prisma, userId, productId);
    if (product.editingRevisionId !== expectedRevisionId) {
      throw new ConflictException('Product editing revision changed');
    }
    const media = this.media;
    // The idempotency identity stays stable across retries. The revision is a
    // separate check: putting it only in this hash would make a later revision
    // look like a new upload and create a hold there.
    const scopedKey = idempotencyKey
      ? createHash('sha256')
          .update(`${productId}:story:${idempotencyKey}`)
          .digest('hex')
      : undefined;
    const uploadIdentity = scopedKey
      ? mediaUploadIdentity(userId, 'STORY_IMAGE', scopedKey)
      : undefined;
    if (uploadIdentity) {
      const prior = await this.prisma.mediaOperation.findUnique({
        where: { identity: uploadIdentity },
        select: { revisionId: true },
      });
      if (prior?.revisionId && prior.revisionId !== expectedRevisionId) {
        throw new ConflictException(
          'Upload identity belongs to an earlier revision',
        );
      }
    }
    const holds = await this.prisma.productRevisionStoryAsset.count({
      where: { revisionId: expectedRevisionId },
    });
    if (holds >= STORY_LIMITS.maxImages) {
      const operation = uploadIdentity
        ? await this.prisma.mediaOperation.findUnique({
            where: { identity: uploadIdentity },
            include: { objects: { include: { object: true } } },
          })
        : null;
      const source = operation?.objects.find(
        (item) => item.object.variant === 'SOURCE',
      )?.object;
      const held =
        source &&
        (await this.prisma.productRevisionStoryAsset.findUnique({
          where: {
            revisionId_mediaAssetId: {
              revisionId: expectedRevisionId,
              mediaAssetId: source.assetId,
            },
          },
        }));
      if (!held) throw new ConflictException('Story image holds are full');
    }
    const asset = await media.stage(userId, 'STORY_IMAGE', file, scopedKey);
    if (uploadIdentity) {
      const bound = await this.prisma.mediaOperation.updateMany({
        where: {
          identity: uploadIdentity,
          OR: [{ revisionId: null }, { revisionId: expectedRevisionId }],
        },
        data: { revisionId: expectedRevisionId },
      });
      if (bound.count !== 1) {
        throw new ConflictException(
          'Upload identity belongs to an earlier revision',
        );
      }
    }
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const locked = await this.requireWritableOwnerInTx(tx, userId, productId);
      if (locked.editingRevisionId !== expectedRevisionId) {
        throw new ConflictException('Product editing revision changed');
      }
      if (uploadIdentity) {
        const operation = await tx.mediaOperation.findUnique({
          where: { identity: uploadIdentity },
          select: { revisionId: true },
        });
        if (operation?.revisionId && operation.revisionId !== expectedRevisionId) {
          throw new ConflictException(
            'Upload identity belongs to an earlier revision',
          );
        }
      }
      await media.assertNotPending(tx, { productId });
      const held = await tx.productRevisionStoryAsset.findUnique({
        where: {
          revisionId_mediaAssetId: {
            revisionId: expectedRevisionId,
            mediaAssetId: asset.id,
          },
        },
      });
      if (!held) {
        const holds = await tx.productRevisionStoryAsset.count({
          where: { revisionId: expectedRevisionId },
        });
        if (holds >= STORY_LIMITS.maxImages) {
          throw new ConflictException('Story image holds are full');
        }
        await tx.productRevisionStoryAsset.create({
          data: { revisionId: expectedRevisionId, mediaAssetId: asset.id },
        });
      }
      await media.attach(tx, asset.id);
      return { mediaAssetId: asset.id };
    });
  }

  async removeStoryImage(userId: string, productId: string, assetId: string) {
    if (!this.media?.enabled) {
      throw new ConflictException('Story images require the media pipeline');
    }
    const media = this.media;
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const product = await this.requireWritableOwnerInTx(
        tx,
        userId,
        productId,
      );
      if (!product.editingRevisionId) {
        throw new ConflictException('Product editing revision is missing');
      }
      const revisionId = product.editingRevisionId;
      const used = await tx.productRevisionStoryBlock.count({
        where: { revisionId, mediaAssetId: assetId },
      });
      if (used > 0) {
        throw new ConflictException('Story image is used by a block');
      }
      const hold = await tx.productRevisionStoryAsset.findUnique({
        where: {
          revisionId_mediaAssetId: { revisionId, mediaAssetId: assetId },
        },
      });
      // A gallery image is also allowed in Story, but it has no story hold.
      // Never enqueue cleanup for a gallery asset or another revision's hold.
      if (!hold) return { ok: true as const };
      const asset = await tx.mediaAsset.findUnique({
        where: { id: assetId },
        select: { purpose: true },
      });
      if (asset?.purpose !== 'STORY_IMAGE') {
        throw new ConflictException('Only story-owned images can be released');
      }
      await tx.productRevisionStoryAsset.delete({
        where: {
          revisionId_mediaAssetId: { revisionId, mediaAssetId: assetId },
        },
      });
      await media.enqueueCleanup(tx, [assetId]);
      return { ok: true as const };
    });
  }

  async getStoryImage(
    productId: string,
    assetId: string,
    userId?: string,
    role?: string,
  ) {
    const links = await this.prisma.productRevisionStoryBlock.findMany({
      where: { mediaAssetId: assetId, type: 'IMAGE', revision: { productId } },
      select: {
        revisionId: true,
        revision: {
          select: {
            product: {
              select: {
                status: true,
                publishedRevisionId: true,
                editingRevisionId: true,
                sellerProfile: {
                  select: {
                    userId: true,
                    status: true,
                    user: { select: { status: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    const holds = await this.prisma.productRevisionStoryAsset.findMany({
      where: { mediaAssetId: assetId, revision: { productId } },
      select: {
        revisionId: true,
        revision: {
          select: {
            product: {
              select: {
                status: true,
                publishedRevisionId: true,
                editingRevisionId: true,
                sellerProfile: {
                  select: {
                    userId: true,
                    status: true,
                    user: { select: { status: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!links.length && !holds.length) {
      throw new NotFoundException('Story image not found');
    }
    const isPublishedImage = (row: (typeof links)[number]) => {
      const product = row.revision.product;
      return (
        product.status === 'APPROVED' &&
        product.sellerProfile.status === 'APPROVED' &&
        product.sellerProfile.user.status === 'active' &&
        product.publishedRevisionId === row.revisionId
      );
    };
    const isDraftOwner = (
      row: (typeof links)[number] | (typeof holds)[number],
    ) => {
      const product = row.revision.product;
      return (
        product.sellerProfile.userId === userId &&
        product.editingRevisionId === row.revisionId
      );
    };
    const isPublic = links.some(isPublishedImage);
    const isAdmin = role === 'admin';
    const visible =
      isAdmin ||
      isPublic ||
      links.some(isDraftOwner) ||
      holds.some(isDraftOwner);
    if (!visible) throw new NotFoundException('Story image not found');
    if (!this.media?.enabled) {
      throw new NotFoundException('Story image not found');
    }
    const stored = await this.media.readPreview(assetId);
    if (!stored) throw new NotFoundException('Story image not found');
    return { mimeType: stored.mimeType, data: stored.bytes, isPublic };
  }

  private async requireWritableOwnerInTx(
    tx: Prisma.TransactionClient,
    userId: string,
    productId: string,
    kind: ProductWriteGuardKind = 'images',
  ) {
    await lockProductRowForUpdate(tx, productId);
    return this.requireEditableOwner(tx, userId, productId, kind);
  }

  private async reindexRevisionImages(
    tx: Prisma.TransactionClient,
    revisionId: string,
    imageIds: string[],
  ): Promise<void> {
    const temporaryBase = imageIds.length + 1;

    await Promise.all(
      imageIds.map((imageId, index) =>
        tx.productRevisionImage.update({
          where: { revisionId_imageId: { revisionId, imageId } },
          data: { position: temporaryBase + index },
        }),
      ),
    );
    await Promise.all(
      imageIds.map((imageId, index) =>
        tx.productRevisionImage.update({
          where: { revisionId_imageId: { revisionId, imageId } },
          data: { position: index },
        }),
      ),
    );
  }

  private async requireEditableOwner(
    client: Pick<Prisma.TransactionClient, 'product'>,
    userId: string,
    productId: string,
    kind: ProductWriteGuardKind = 'images',
  ) {
    const product = await client.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        status: true,
        sellerProfile: { select: { userId: true, status: true } },
        listings: {
          where: { status: { in: ['SCHEDULED', 'LIVE'] } },
          select: { id: true },
          take: 1,
        },
        editingRevisionId: true,
        publishedRevisionId: true,
        images: {
          select: { id: true, position: true, byteLength: true },
        },
        editingRevision: {
          select: {
            status: true,
            images: {
              orderBy: { position: 'asc' },
              select: {
                position: true,
                image: {
                  select: { id: true, position: true, byteLength: true },
                },
              },
            },
          },
        },
      },
    });

    if (
      product &&
      (product.status === 'APPROVED' || product.status === 'ARCHIVED')
    ) {
      if (product.sellerProfile.userId !== userId) {
        throw new ForbiddenException('Product is not owned by user');
      }
      assertApprovedSeller(product.sellerProfile.status as SellerStatus);
      if (product.listings.length > 0) {
        throw new ConflictException('Product is locked by an active Listing');
      }
      if (
        kind !== 'images' ||
        !product.editingRevisionId ||
        product.editingRevisionId === product.publishedRevisionId ||
        !product.editingRevision ||
        !canAuthorEditRevision(product.editingRevision.status as ProductStatus)
      ) {
        throw new ForbiddenException('Product images are locked');
      }
    } else {
      assertProductWritable(product, userId, kind);
    }

    const revisionImages = product.editingRevision?.images.map(
      ({ position, image }) => ({
        ...image,
        position,
      }),
    );
    const images = revisionImages ?? product.images;
    const nextProductImagePosition = product.images.reduce(
      (next, image) => Math.max(next, image.position + 1),
      0,
    );

    return {
      ...product,
      images,
      nextProductImagePosition,
      usesRevisionImageOrder: Boolean(product.editingRevision),
    };
  }
}

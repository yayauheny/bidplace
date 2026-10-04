import { createHash } from 'node:crypto';

import {
  Inject,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type ProductStatus, type SellerStatus } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { MediaLifecycleService } from '../core/media/media-lifecycle.service';
import { PrismaService, runReadCommittedTransaction } from '../core/database';
import { emptyImageBytes, ImageStore, imageKey } from '../core/image-store';
import {
  assertProductImageCapacity,
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
  ) {}

  async add(
    userId: string,
    productId: string,
    files: readonly RawImageUpload[],
  ) {
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
    );

    assertProductImageCapacity(
      product.images,
      files.map((file) => ({ byteLength: file.buffer.byteLength })),
    );

    if (this.media?.enabled) return this.addMedia(userId, productId, files);

    const validated = await validateAndNormalizeProductImageUploads(files);

    assertProductImageCapacity(
      product.images,
      validated.map((file) => ({ byteLength: file.buffer.byteLength })),
    );

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const freshProduct = await this.requireWritableOwnerInTx(
        tx,
        userId,
        productId,
      );

      assertProductImageCapacity(
        freshProduct.images,
        validated.map((file) => ({ byteLength: file.buffer.byteLength })),
      );

      const start = freshProduct.images.length;

      for (const [index, file] of validated.entries()) {
        const row = await tx.productImage.create({
          data: {
            productId,
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
        await tx.productRevisionImage.create({
          data: {
            revisionId: freshProduct.editingRevisionId,
            imageId: row.id,
            position: start + index,
          },
        });
      }
    });

    return { ok: true as const };
  }

  private async addMedia(
    userId: string,
    productId: string,
    files: readonly RawImageUpload[],
  ) {
    const media = this.media!;
    const assets: Array<Awaited<ReturnType<MediaLifecycleService['stage']>>> =
      [];
    for (const file of files)
      assets.push(await media.stage(userId, 'WORK_IMAGE', file));
    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const product = await this.requireWritableOwnerInTx(
        tx,
        userId,
        productId,
      );
      await media.assertNotPending(tx, { productId });
      assertProductImageCapacity(
        product.images,
        assets.map((asset) => ({ byteLength: asset.source.byteLength })),
      );
      if (!product.editingRevisionId)
        throw new ConflictException('Product editing revision is missing');
      for (const [index, asset] of assets.entries()) {
        await media.attach(tx, asset.id);
        const row = await tx.productImage.create({
          data: {
            productId,
            position: product.nextProductImagePosition + index,
            mediaAssetId: asset.id,
            objectKey: asset.preview.objectKey,
            mimeType: asset.preview.mimeType,
            byteLength: asset.source.byteLength,
            checksum: asset.preview.sha256,
            width: asset.preview.width,
            height: asset.preview.height,
            data: emptyImageBytes,
          },
        });
        await tx.productRevisionImage.create({
          data: {
            revisionId: product.editingRevisionId,
            imageId: row.id,
            position: product.images.length + index,
          },
        });
      }
    });
    return { ok: true as const };
  }

  async remove(userId: string, productId: string, imageId: string) {
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
    );

    if (!product.images.some((image) => image.id === imageId)) {
      throw new NotFoundException('Image not found');
    }

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const locked = await this.requireWritableOwnerInTx(tx, userId, productId);
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

  async reorder(userId: string, productId: string, imageIds: string[]) {
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
    );

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
      const knownLockedIds = new Set(locked.images.map((image) => image.id));
      if (
        imageIds.length !== knownLockedIds.size ||
        new Set(imageIds).size !== imageIds.length ||
        imageIds.some((id) => !knownLockedIds.has(id))
      ) {
        throw new BadRequestException(
          'Image order must include every Product image exactly once',
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
            sellerProfile: { select: { userId: true, status: true } },
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
      step.product.sellerProfile.status === 'APPROVED';
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

  async get(imageId: string, userId?: string, role?: string) {
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
      image.product.publishedRevisionId !== null &&
      image.revisions.some(
        ({ revisionId }) => revisionId === image.product.publishedRevisionId,
      );

    if (!isOwner && !isAdmin && !isPublic) {
      throw new NotFoundException('Image not found');
    }

    const stored =
      image.mediaAssetId && this.media?.enabled
        ? await this.media.readPreview(image.mediaAssetId)
        : await this.imageStore.get(imageKey.productImage(imageId));
    if (!stored) {
      throw new NotFoundException('Image not found');
    }

    return {
      mimeType: stored.mimeType,
      data: stored.bytes,
      isPublic,
    };
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
      usesRevisionImageOrder:
        product.status === 'APPROVED' || product.status === 'ARCHIVED',
    };
  }
}

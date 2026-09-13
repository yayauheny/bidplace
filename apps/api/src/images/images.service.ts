import { createHash } from 'node:crypto';

import {
  ConflictException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type Prisma } from '@bidplace/database';

import { PrismaService, runReadCommittedTransaction } from '../core/database';
import { emptyImageBytes, ImageStore, imageKey } from '../core/image-store';
import {
  assertProductImageCapacity,
  type RawImageUpload,
  validateAndNormalizeProductImageUploads,
} from './image-policy';
import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';
import {
  assertProductImagesMutable,
  ensureAuthorEditingRevision,
  type AuthorEditingProduct,
} from '../products/product-revision-write';
import {
  assertProductWritable,
  lockProductRowForUpdate,
  productWriteGuardSelect,
  type ProductWriteGuardKind,
} from '../products/product-write-guard';

type GalleryImageRow = {
  id: string;
  position: number;
  byteLength: number;
};

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStore: ImageStore,
  ) {}

  async add(
    userId: string,
    productId: string,
    files: readonly RawImageUpload[],
  ) {
    const product = await this.requireMutableGalleryOwner(
      this.prisma,
      userId,
      productId,
    );

    assertProductImageCapacity(
      product.images,
      files.map((file) => ({ byteLength: file.buffer.byteLength })),
    );

    const validated = await validateAndNormalizeProductImageUploads(files);

    assertProductImageCapacity(
      product.images,
      validated.map((file) => ({ byteLength: file.buffer.byteLength })),
    );

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const freshProduct = await this.requireWritableGalleryOwnerInTx(
        tx,
        userId,
        productId,
      );

      assertProductImageCapacity(
        freshProduct.images,
        validated.map((file) => ({ byteLength: file.buffer.byteLength })),
      );

      const aggregated = await tx.productImage.aggregate({
        where: { productId },
        _max: { position: true },
      });
      const storageStart = (aggregated._max.position ?? -1) + 1;
      const galleryStart = freshProduct.images.length;

      for (const [index, file] of validated.entries()) {
        const row = await tx.productImage.create({
          data: {
            productId,
            position: storageStart + index,
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
        await tx.productRevisionImage.create({
          data: {
            revisionId: freshProduct.editingRevisionId,
            imageId: row.id,
            position: galleryStart + index,
          },
        });
      }
    });

    return { ok: true as const };
  }

  async remove(userId: string, productId: string, imageId: string) {
    const product = await this.requireMutableGalleryOwner(
      this.prisma,
      userId,
      productId,
    );

    if (!product.images.some((image) => image.id === imageId)) {
      throw new NotFoundException('Image not found');
    }

    const objectKeyToDelete = await runReadCommittedTransaction(
      this.prisma,
      async (tx) => {
        const locked = await this.requireWritableGalleryOwnerInTx(
          tx,
          userId,
          productId,
        );
        if (!locked.images.some((image) => image.id === imageId)) {
          throw new NotFoundException('Image not found');
        }

        await tx.productRevisionImage.deleteMany({
          where: {
            revisionId: locked.editingRevisionId,
            imageId,
          },
        });
        const revisionReferences = await tx.productRevisionImage.count({
          where: { imageId },
        });
        const remainingRevisionImages = await tx.productRevisionImage.findMany(
          {
            where: { revisionId: locked.editingRevisionId },
            select: { imageId: true },
            orderBy: { position: 'asc' },
          },
        );
        let deletedKey: string | null = null;
        if (revisionReferences === 0) {
          await tx.productImage.delete({ where: { id: imageId } });
          deletedKey = imageKey.productImage(imageId);
        }

        await this.reindexRevisionImages(
          tx,
          locked.editingRevisionId,
          remainingRevisionImages.map((image) => image.imageId),
        );
        return deletedKey;
      },
    );
    if (objectKeyToDelete) {
      try {
        await this.imageStore.delete(objectKeyToDelete);
      } catch (error) {
        this.logger.warn(
          `Failed to delete unreferenced product image ${objectKeyToDelete}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return { ok: true as const };
  }

  async reorder(userId: string, productId: string, imageIds: string[]) {
    const product = await this.requireMutableGalleryOwner(
      this.prisma,
      userId,
      productId,
    );

    this.assertEditingRevisionOrder(product.images, imageIds);

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const locked = await this.requireWritableGalleryOwnerInTx(
        tx,
        userId,
        productId,
      );
      this.assertEditingRevisionOrder(locked.images, imageIds);
      await this.reindexRevisionImages(
        tx,
        locked.editingRevisionId,
        imageIds,
      );
    });

    return { ok: true as const };
  }

  async addCreationStepImage(
    userId: string,
    productId: string,
    stepId: string,
    file: RawImageUpload,
  ) {
    await this.requireEditableOwner(this.prisma, userId, productId, {
      id: true,
    });
    const step = await this.prisma.productCreationStep.findFirst({
      where: { id: stepId, productId },
      select: { id: true },
    });
    if (!step) throw new NotFoundException('Creation step not found');

    const validatedFiles = await validateAndNormalizeProductImageUploads([file]);
    const validated = validatedFiles[0];
    if (!validated) {
      throw new BadRequestException('An image is required');
    }

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      await this.requireWritableOwnerInTx(tx, userId, productId, { id: true });
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
        product: {
          select: {
            status: true,
            sellerProfile: { select: { userId: true, status: true } },
          },
        },
      },
    });
    if (
      !step ||
      !step.mimeType ||
      !step.byteLength ||
      !step.checksum
    ) {
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

    const stored = await this.imageStore.get(imageKey.creationStep(stepId));
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
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        mimeType: true,
        revisions: { select: { revisionId: true } },
        product: {
          select: {
            status: true,
            publishedRevisionId: true,
            sellerProfile: {
              select: {
                userId: true,
                status: true,
                ...publicSellerProfileSelect,
              },
            },
          },
        },
      },
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
        ({ revisionId }) =>
          revisionId === image.product.publishedRevisionId,
      );

    if (!isOwner && !isAdmin && !isPublic) {
      throw new NotFoundException('Image not found');
    }

    const stored = await this.imageStore.get(imageKey.productImage(imageId));
    if (!stored) {
      throw new NotFoundException('Image not found');
    }

    return {
      mimeType: stored.mimeType,
      data: stored.bytes,
      isPublic,
    };
  }

  private assertEditingRevisionOrder(
    images: readonly { id: string }[],
    imageIds: string[],
  ) {
    const knownIds = new Set(images.map((image) => image.id));
    if (
      imageIds.length !== knownIds.size ||
      new Set(imageIds).size !== imageIds.length ||
      imageIds.some((id) => !knownIds.has(id))
    ) {
      throw new BadRequestException(
        'Image order must include every editing revision image exactly once',
      );
    }
  }

  private async requireWritableOwnerInTx(
    tx: Prisma.TransactionClient,
    userId: string,
    productId: string,
    imageSelect: { id?: true; position?: true; byteLength?: true },
  ) {
    await lockProductRowForUpdate(tx, productId);
    return this.requireEditableOwner(tx, userId, productId, imageSelect);
  }

  private async requireWritableGalleryOwnerInTx(
    tx: Prisma.TransactionClient,
    userId: string,
    productId: string,
  ) {
    await lockProductRowForUpdate(tx, productId);
    const product = await this.requireMutableGalleryOwner(tx, userId, productId);
    const editingRevisionId = await ensureAuthorEditingRevision(
      tx,
      product,
      userId,
      'images',
    );
    if (editingRevisionId === product.editingRevisionId) {
      return product;
    }

    const revisionImages = await tx.productRevisionImage.findMany({
      where: { revisionId: editingRevisionId },
      orderBy: { position: 'asc' },
      select: {
        position: true,
        image: { select: { id: true, byteLength: true } },
      },
    });
    return {
      ...product,
      editingRevisionId,
      images: revisionImages.map(({ position, image }) => ({
        id: image.id,
        position,
        byteLength: image.byteLength,
      })),
    };
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
    imageSelect: { id?: true; position?: true; byteLength?: true },
    kind: ProductWriteGuardKind = 'images',
  ) {
    const product = await client.product.findUnique({
      where: { id: productId },
      select: {
        ...productWriteGuardSelect,
        editingRevisionId: true,
        images: { select: imageSelect },
      },
    });

    assertProductWritable(product, userId, kind);
    return product;
  }

  private async requireMutableGalleryOwner(
    client: Pick<Prisma.TransactionClient, 'product'>,
    userId: string,
    productId: string,
  ): Promise<AuthorEditingProduct & { images: GalleryImageRow[]; editingRevisionId: string }> {
    const product = await client.product.findUnique({
      where: { id: productId },
      select: {
        ...productWriteGuardSelect,
        editingRevisionId: true,
        publishedRevisionId: true,
        editingRevision: {
          select: {
            images: {
              orderBy: { position: 'asc' as const },
              select: {
                position: true,
                image: { select: { id: true, byteLength: true } },
              },
            },
          },
        },
      },
    });
    assertProductImagesMutable(product, userId);
    if (!product.editingRevisionId) {
      throw new ConflictException('Product editing revision is missing');
    }

    return {
      ...product,
      editingRevisionId: product.editingRevisionId,
      images: (product.editingRevision?.images ?? []).map(({ position, image }) => ({
        id: image.id,
        position,
        byteLength: image.byteLength,
      })),
    };
  }
}

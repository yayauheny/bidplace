import { createHash } from 'node:crypto';

import {
  ConflictException,
  BadRequestException,
  Injectable,
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
  assertProductWritable,
  lockProductRowForUpdate,
  productWriteGuardSelect,
  type ProductWriteGuardKind,
} from '../products/product-write-guard';

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStore: ImageStore,
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
      {
        position: true,
        byteLength: true,
      },
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
      const freshProduct = await this.requireWritableOwnerInTx(
        tx,
        userId,
        productId,
        {
          position: true,
          byteLength: true,
        },
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
            position: start + index,
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

  async remove(userId: string, productId: string, imageId: string) {
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
      {
        id: true,
        position: true,
      },
    );

    if (!product.images.some((image) => image.id === imageId)) {
      throw new NotFoundException('Image not found');
    }

    await runReadCommittedTransaction(this.prisma, async (tx) => {
      const locked = await this.requireWritableOwnerInTx(tx, userId, productId, {
        id: true,
        position: true,
      });
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
      const remainingRevisionImages =
        await tx.productRevisionImage.findMany({
          where: { revisionId: locked.editingRevisionId },
          select: { imageId: true },
          orderBy: { position: 'asc' },
        });
      if (revisionReferences === 0) {
        await this.imageStore.delete(imageKey.productImage(imageId), tx);
        await tx.productImage.delete({ where: { id: imageId } });
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
      { id: true },
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
      const locked = await this.requireWritableOwnerInTx(tx, userId, productId, {
        id: true,
      });
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
      const temporaryBase = locked.images.length;

      await Promise.all(
        imageIds.map((id, index) =>
          tx.productImage.update({
            where: { id },
            data: { position: temporaryBase + index },
          }),
        ),
      );

      await this.reindexRevisionImages(
        tx,
        locked.editingRevisionId,
        imageIds,
      );

      await Promise.all(
        imageIds.map((id, index) =>
          tx.productImage.update({
            where: { id },
            data: { position: index },
          }),
        ),
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

  private async requireWritableOwnerInTx(
    tx: Prisma.TransactionClient,
    userId: string,
    productId: string,
    imageSelect: { id?: true; position?: true; byteLength?: true },
  ) {
    await lockProductRowForUpdate(tx, productId);
    return this.requireEditableOwner(tx, userId, productId, imageSelect);
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
}

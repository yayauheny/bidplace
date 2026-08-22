import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type SellerStatus } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { PrismaService, runSerializableTransaction } from '../core/database';
import { emptyImageBytes, ImageStore, imageKey } from '../core/image-store';
import {
  assertProductImageCapacity,
  type RawImageUpload,
  validateAndNormalizeProductImageUploads,
} from './image-policy';
import { assertApprovedSeller } from '../sellers/seller-capability';
import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';
import { isEditableProductStatus } from '../products/product-state';

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

    assertApprovedSeller(product.sellerProfile.status as SellerStatus);

    assertProductImageCapacity(
      product.images,
      files.map((file) => ({ byteLength: file.buffer.byteLength })),
    );

    const validated = await validateAndNormalizeProductImageUploads(files);

    assertProductImageCapacity(
      product.images,
      validated.map((file) => ({ byteLength: file.buffer.byteLength })),
    );

    await runSerializableTransaction(this.prisma, async (tx) => {
      const freshProduct = await this.requireEditableOwner(
        tx,
        userId,
        productId,
        {
          position: true,
          byteLength: true,
        },
      );

      assertApprovedSeller(freshProduct.sellerProfile.status as SellerStatus);

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

        await this.imageStore.put(
          imageKey.productImage(row.id),
          {
            bytes: file.buffer,
            mimeType: file.mimeType,
          },
          tx,
        );
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

    assertApprovedSeller(product.sellerProfile.status as SellerStatus);

    if (!product.images.some((image) => image.id === imageId)) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const remaining = await tx.productImage.findMany({
        where: { productId, id: { not: imageId } },
        select: { id: true },
        orderBy: { position: 'asc' },
      });

      await this.imageStore.delete(imageKey.productImage(imageId), tx);
      await tx.productImage.delete({ where: { id: imageId } });

      const temporaryBase = product.images.length;

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

    assertApprovedSeller(product.sellerProfile.status as SellerStatus);

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

    await this.prisma.$transaction(async (tx) => {
      const temporaryBase = product.images.length;

      await Promise.all(
        imageIds.map((id, index) =>
          tx.productImage.update({
            where: { id },
            data: { position: temporaryBase + index },
          }),
        ),
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
    const product = await this.requireEditableOwner(
      this.prisma,
      userId,
      productId,
      {
        id: true,
      },
    );
    assertApprovedSeller(product.sellerProfile.status as SellerStatus);
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

    await this.prisma.$transaction(async (tx) => {
      await tx.productCreationStep.update({
        where: { id: step.id },
        data: {
          mimeType: validated.mimeType,
          byteLength: validated.buffer.byteLength,
          checksum: createHash('sha256').update(validated.buffer).digest('hex'),
          width: validated.width ?? null,
          height: validated.height ?? null,
        },
      });

      await this.imageStore.put(
        imageKey.creationStep(step.id),
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
            listings: {
              where: { status: { in: ['SCHEDULED', 'LIVE', 'ENDED'] } },
              select: { id: true },
              take: 1,
            },
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
      step.product.sellerProfile.status === 'APPROVED' &&
      step.product.listings.length > 0;
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
        product: {
          select: {
            status: true,
            sellerProfile: {
              select: {
                userId: true,
                status: true,
                ...publicSellerProfileSelect,
              },
            },
            listings: {
              where: { status: { in: ['SCHEDULED', 'LIVE', 'ENDED'] } },
              select: { id: true, status: true },
              take: 1,
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
      image.product.listings.length > 0;

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

  private async requireEditableOwner(
    client: Pick<Prisma.TransactionClient, 'product'>,
    userId: string,
    productId: string,
    imageSelect: { id?: true; position?: true; byteLength?: true },
  ) {
    const product = await client.product.findUnique({
      where: { id: productId },
      include: {
        sellerProfile: {
          select: {
            userId: true,
            status: true,
          },
        },
        images: { select: imageSelect },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Product is not owned by user');
    }

    if (!isEditableProductStatus(product.status)) {
      throw new ForbiddenException('Product images are locked');
    }

    return product;
  }
}

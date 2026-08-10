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
import {
  assertProductImageCapacity,
  type ValidatedImageUpload,
} from './image-policy';
import { assertApprovedSeller } from '../sellers/seller-capability';
import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';
import { isEditableProductStatus } from '../products/product-state';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(
    userId: string,
    productId: string,
    files: readonly ValidatedImageUpload[],
  ) {
    await runSerializableTransaction(this.prisma, async (tx) => {
      const product = await this.requireEditableOwner(tx, userId, productId, {
        position: true,
        byteLength: true,
      });

      assertApprovedSeller(product.sellerProfile.status as SellerStatus);
      assertProductImageCapacity(
        product.images,
        files.map((file) => ({ byteLength: file.buffer.byteLength })),
      );

      const start = product.images.length;

      await tx.productImage.createMany({
        data: files.map((file, index) => ({
          productId,
          position: start + index,
          mimeType: file.mimeType,
          byteLength: file.buffer.byteLength,
          data: Uint8Array.from(file.buffer),
          checksum: createHash('sha256').update(file.buffer).digest('hex'),
        })),
      });
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

  async get(imageId: string, userId?: string, role?: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      include: {
        product: {
          include: {
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

    return { ...image, isPublic };
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

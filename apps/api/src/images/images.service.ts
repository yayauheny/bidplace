import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../core/database';
import { type ValidatedImageUpload } from './image-policy';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(
    userId: string,
    productId: string,
    files: readonly ValidatedImageUpload[],
  ) {
    const product = await this.requireDraftOwner(userId, productId, {
      position: true,
    });
    const start = product.images.length;
    await this.prisma.productImage.createMany({
      data: files.map((file, index) => ({
        productId,
        position: start + index,
        mimeType: file.mimeType,
        byteLength: file.buffer.byteLength,
        data: Uint8Array.from(file.buffer),
        checksum: createHash('sha256').update(file.buffer).digest('hex'),
      })),
    });
    return { ok: true as const };
  }

  async remove(userId: string, productId: string, imageId: string) {
    const product = await this.requireDraftOwner(userId, productId, {
      id: true,
      position: true,
    });
    if (!product.images.some((image) => image.id === imageId))
      throw new NotFoundException('Image not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });
      const remaining = await tx.productImage.findMany({
        where: { productId },
        select: { id: true },
        orderBy: { position: 'asc' },
      });
      await Promise.all(
        remaining.map((image, index) =>
          tx.productImage.update({
            where: { id: image.id },
            data: { position: product.images.length + index },
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
    const product = await this.requireDraftOwner(userId, productId, {
      id: true,
    });
    const knownIds = new Set(product.images.map((image) => image.id));
    if (
      imageIds.length !== knownIds.size ||
      new Set(imageIds).size !== imageIds.length ||
      imageIds.some((id) => !knownIds.has(id))
    )
      throw new BadRequestException(
        'Image order must include every Product image exactly once',
      );
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        imageIds.map((id, index) =>
          tx.productImage.update({
            where: { id },
            data: { position: imageIds.length + index },
          }),
        ),
      );
      await Promise.all(
        imageIds.map((id, index) =>
          tx.productImage.update({ where: { id }, data: { position: index } }),
        ),
      );
    });
    return { ok: true as const };
  }

  async get(imageId: string, userId?: string, role?: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      include: { product: { include: { sellerProfile: true } } },
    });
    if (!image) throw new NotFoundException('Image not found');
    if (
      image.product.status !== 'APPROVED' &&
      image.product.sellerProfile.userId !== userId &&
      role !== 'admin'
    )
      throw new NotFoundException('Image not found');
    return image;
  }

  private async requireDraftOwner(
    userId: string,
    productId: string,
    imageSelect: { id?: true; position?: true },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { sellerProfile: true, images: { select: imageSelect } },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerProfile.userId !== userId)
      throw new ForbiddenException('Product is not owned by user');
    if (product.status !== 'DRAFT')
      throw new ForbiddenException('Product images are locked');
    return product;
  }
}

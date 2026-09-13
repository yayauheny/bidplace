import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { SellerStatus } from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { assertApprovedSeller } from '../sellers/seller-capability';
import {
  assertProductWritable,
  type ProductWriteGuardKind,
  type ProductWriteGuardSnapshot,
} from './product-write-guard';

const PRODUCT_REVISION_FORK_SELECT = {
  id: true,
  productId: true,
  version: true,
  status: true,
  title: true,
  story: true,
  categoryId: true,
  technique: true,
  materials: true,
  dimensions: true,
  weight: true,
  year: true,
  condition: true,
  uniqueness: true,
  provenance: true,
  city: true,
  packaging: true,
  deliveryInfo: true,
  creationIntro: true,
  images: {
    orderBy: { position: 'asc' as const },
    select: { imageId: true, position: true },
  },
} satisfies Prisma.ProductRevisionSelect;

export type AuthorEditingProduct = ProductWriteGuardSnapshot & {
  editingRevisionId: string | null;
  publishedRevisionId: string | null;
};

export async function forkPublishedRevision(
  tx: Prisma.TransactionClient,
  productId: string,
  publishedRevisionId: string,
): Promise<string> {
  const publishedRevision = await tx.productRevision.findUniqueOrThrow({
    where: { id: publishedRevisionId },
    select: PRODUCT_REVISION_FORK_SELECT,
  });

  const draftRevision = await tx.productRevision.create({
    data: {
      productId,
      version: publishedRevision.version + 1,
      status: 'DRAFT',
      title: publishedRevision.title,
      story: publishedRevision.story,
      categoryId: publishedRevision.categoryId,
      technique: publishedRevision.technique,
      materials: publishedRevision.materials,
      dimensions: publishedRevision.dimensions,
      weight: publishedRevision.weight,
      year: publishedRevision.year,
      condition: publishedRevision.condition,
      uniqueness: publishedRevision.uniqueness,
      provenance: publishedRevision.provenance,
      city: publishedRevision.city,
      packaging: publishedRevision.packaging,
      deliveryInfo: publishedRevision.deliveryInfo,
      creationIntro: publishedRevision.creationIntro,
      images: {
        createMany: {
          data: publishedRevision.images.map((image) => ({
            imageId: image.imageId,
            position: image.position,
          })),
        },
      },
    },
    select: { id: true },
  });

  await tx.product.update({
    where: { id: productId },
    data: { editingRevisionId: draftRevision.id },
  });

  return draftRevision.id;
}

export function assertProductImagesMutable(
  product: AuthorEditingProduct | null,
  userId: string,
): asserts product is AuthorEditingProduct {
  if (!product) {
    throw new NotFoundException('Product not found');
  }
  if (product.sellerProfile.userId !== userId) {
    throw new ForbiddenException('Product is not owned by user');
  }
  assertApprovedSeller(product.sellerProfile.status as SellerStatus);

  const publishedRevisionId = product.publishedRevisionId;
  const editingRevisionId = product.editingRevisionId;
  const canEditPublishedGallery =
    (product.status === 'APPROVED' || product.status === 'ARCHIVED') &&
    publishedRevisionId != null &&
    editingRevisionId != null;
  if (canEditPublishedGallery) {
    return;
  }

  assertProductWritable(product, userId, 'images');
}

export async function ensureAuthorEditingRevision(
  tx: Prisma.TransactionClient,
  product: AuthorEditingProduct | null,
  userId: string,
  kind: ProductWriteGuardKind,
): Promise<string> {
  if (!product) {
    throw new NotFoundException('Product not found');
  }
  if (product.sellerProfile.userId !== userId) {
    throw new ForbiddenException('Product is not owned by user');
  }
  assertApprovedSeller(product.sellerProfile.status as SellerStatus);

  const publishedRevisionId = product.publishedRevisionId;
  const editingRevisionId = product.editingRevisionId;
  const canForkPublished =
    (product.status === 'APPROVED' || product.status === 'ARCHIVED') &&
    publishedRevisionId != null &&
    editingRevisionId != null;

  if (canForkPublished) {
    if (editingRevisionId === publishedRevisionId) {
      return forkPublishedRevision(tx, product.id, publishedRevisionId);
    }
    return editingRevisionId;
  }

  assertProductWritable(product, userId, kind);
  if (!product.editingRevisionId) {
    throw new ConflictException('Product editing revision is missing');
  }
  return product.editingRevisionId;
}

import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  EDITABLE_PRODUCT_STATUSES,
  isEditableProductStatus,
  type ProductStatus,
  type SellerStatus,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { assertApprovedSeller } from '../sellers/seller-capability';

export const productWriteGuardSelect = {
  id: true,
  status: true,
  sellerProfile: { select: { userId: true, status: true } },
} satisfies Prisma.ProductSelect;

export const writableProductWhere = {
  status: { in: [...EDITABLE_PRODUCT_STATUSES] },
} satisfies Prisma.ProductWhereInput;

export type ProductWriteGuardKind =
  | 'edit'
  | 'submit'
  | 'images'
  | 'creation-story';

export type ProductWriteGuardSnapshot = {
  id: string;
  status: string;
  sellerProfile: { userId: string; status: string };
};

export async function lockProductRowForUpdate(
  tx: Pick<Prisma.TransactionClient, '$queryRaw'>,
  productId: string,
): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT id FROM "products" WHERE id = ${productId}::uuid FOR UPDATE`,
  );
  if (rows.length === 0) {
    throw new NotFoundException('Product not found');
  }
}

export function assertProductWritable<T extends ProductWriteGuardSnapshot>(
  product: T | null,
  userId: string,
  kind: ProductWriteGuardKind,
): asserts product is T {
  if (!product) {
    throw new NotFoundException('Product not found');
  }

  if (product.sellerProfile.userId !== userId) {
    throw new ForbiddenException('Product is not owned by user');
  }

  assertApprovedSeller(product.sellerProfile.status as SellerStatus);

  if (!isEditableProductStatus(product.status as ProductStatus)) {
    throw productWriteLockedError(kind);
  }
}

export function productWriteLockedError(kind: ProductWriteGuardKind) {
  switch (kind) {
    case 'submit':
      return new ConflictException('Product cannot be submitted for review');
    case 'images':
      return new ForbiddenException('Product images are locked');
    case 'creation-story':
      return new ForbiddenException('Product creation story is locked');
    default:
      return new ForbiddenException('Product cannot be edited');
  }
}

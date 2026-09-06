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

export const PRODUCT_EDIT_LOCK_LISTING_STATUSES = ['SCHEDULED', 'LIVE'] as const;

export const productWriteGuardSelect = {
  id: true,
  status: true,
  sellerProfile: { select: { userId: true, status: true } },
  listings: {
    where: { status: { in: [...PRODUCT_EDIT_LOCK_LISTING_STATUSES] } },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

export const writableProductWhere = {
  status: { in: [...EDITABLE_PRODUCT_STATUSES] },
  listings: {
    none: { status: { in: [...PRODUCT_EDIT_LOCK_LISTING_STATUSES] } },
  },
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
  listings: Array<{ id: string }>;
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

  if (product.listings.length > 0) {
    throw new ConflictException('Product is locked by an active Listing');
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

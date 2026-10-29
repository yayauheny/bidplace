import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiErrorCode,
  EDITABLE_PRODUCT_STATUSES,
  isEditableProductStatus,
  type ProductStatus,
  type SellerStatus,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { AppException } from '../core/errors/app.exception';
import { assertApprovedSeller } from '../sellers/seller-capability';

export const PRODUCT_EDIT_LOCK_LISTING_STATUSES = [
  'SCHEDULED',
  'LIVE',
] as const;

export const productInSaleWhere = {
  listings: {
    some: { status: { in: [...PRODUCT_EDIT_LOCK_LISTING_STATUSES] } },
  },
} satisfies Prisma.ProductWhereInput;

export const productWriteGuardSelect = {
  id: true,
  status: true,
  sellerProfile: { select: { userId: true, status: true } },
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

export function assertProductOwner<T extends ProductWriteGuardSnapshot>(
  product: T | null,
  userId: string,
): asserts product is T {
  if (!product) {
    throw new NotFoundException('Product not found');
  }

  if (product.sellerProfile.userId !== userId) {
    throw new ForbiddenException('Product is not owned by user');
  }

  assertApprovedSeller(product.sellerProfile.status as SellerStatus);
}

export async function assertProductWritable<
  T extends ProductWriteGuardSnapshot,
>(
  tx: Prisma.TransactionClient,
  product: T | null,
  userId: string,
  kind: ProductWriteGuardKind,
): Promise<T> {
  assertProductOwner(product, userId);

  if (!isEditableProductStatus(product.status as ProductStatus)) {
    throw productWriteLockedError(kind);
  }

  await assertProductNotInSale(tx, product.id);
  return product;
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

export async function assertProductNotInSale(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  await lockProductRowForUpdate(tx, productId);
  const listing = await tx.listing.findFirst({
    where: {
      productId,
      status: { in: [...PRODUCT_EDIT_LOCK_LISTING_STATUSES] },
    },
    select: { id: true },
  });
  if (listing) {
    throw new AppException({
      status: 409,
      code: ApiErrorCode.PRODUCT_IN_SALE,
      message: 'Product is in sale',
    });
  }
}

export async function findSellerProductIdsInSale(
  tx: Prisma.TransactionClient,
  sellerId: string,
): Promise<string[]> {
  const products = await tx.product.findMany({
    where: { sellerProfileId: sellerId, ...productInSaleWhere },
    select: { id: true },
  });
  return products.map(({ id }) => id);
}

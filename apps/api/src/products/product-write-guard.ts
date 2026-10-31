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

import { OPEN_LISTING_STATUSES } from '../commerce/listing-state';
import { AppException } from '../core/errors/app.exception';
import { assertApprovedSeller } from '../sellers/seller-capability';

export const PRODUCT_EDIT_LOCK_LISTING_STATUSES = OPEN_LISTING_STATUSES;

export const OPEN_ORDER_STATUSES = ['OFFERED', 'ACTIVE'] as const;

export const productInSaleWhere = {
  OR: [
    {
      listings: {
        some: { status: { in: [...PRODUCT_EDIT_LOCK_LISTING_STATUSES] } },
      },
    },
    {
      orders: {
        some: { status: { in: [...OPEN_ORDER_STATUSES] } },
      },
    },
  ],
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
  orders: {
    none: { status: { in: [...OPEN_ORDER_STATUSES] } },
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
  const [previous] = await tx.$queryRaw<Array<{ timeout: string }>>`
    WITH previous AS MATERIALIZED (SELECT current_setting('lock_timeout') AS timeout)
    SELECT timeout, set_config('lock_timeout', '4s', true) FROM previous
  `;
  let rows: Array<{ id: string }>;
  try {
    rows = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM "products" WHERE id = ${productId}::uuid FOR UPDATE`,
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2010' && error.meta?.code === '55P03') {
      throw new AppException({
        status: 409,
        code: ApiErrorCode.PRODUCT_STATE_CONFLICT,
        message: 'Product is being updated; retry this action',
      });
    }
    throw error;
  }
  await tx.$queryRaw`SELECT set_config('lock_timeout', ${previous!.timeout}, true)`;
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
    throw productInSaleError();
  }
  const order = await tx.order.findFirst({
    where: {
      productId,
      status: { in: [...OPEN_ORDER_STATUSES] },
    },
    select: { id: true },
  });
  if (order) {
    throw productInSaleError();
  }
}

function productInSaleError(): AppException {
  return new AppException({
    status: 409,
    code: ApiErrorCode.PRODUCT_IN_SALE,
    message: 'Product is in sale',
  });
}

/**
 * Caller holds the product row lock. A completed order means the work is sold.
 * A scheduled or live listing means it is already on sale again.
 */
export async function assertWorkCanTakeNextOffer(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  const sold = await tx.order.findFirst({
    where: { productId, status: 'COMPLETED' },
    select: { id: true },
  });
  if (sold) {
    throw new AppException({
      status: 409,
      code: ApiErrorCode.PRODUCT_ALREADY_SOLD,
      message: 'Product is already sold',
    });
  }
  await assertNoOpenListing(tx, productId);
}

/** Caller holds the product row lock. */
export async function assertNoOpenListing(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  const listing = await tx.listing.findFirst({
    where: {
      productId,
      status: { in: [...PRODUCT_EDIT_LOCK_LISTING_STATUSES] },
    },
    select: { id: true },
  });
  if (listing) throw productInSaleError();
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

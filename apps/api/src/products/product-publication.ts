import { ApiErrorCode, type ProductStatus } from '@bidplace/contracts';
import type { Prisma } from '@bidplace/database';

import { AppException } from '../core/errors/app.exception';
import { assertProductNotInSale, lockProductRowForUpdate } from './product-write-guard';

export type PublicationActor = 'author' | 'admin' | 'media';

const revisionTransitions: Readonly<
  Record<ProductStatus, readonly ProductStatus[]>
> = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  CHANGES_REQUESTED: ['PENDING_REVIEW'],
  APPROVED: [],
  REJECTED: ['PENDING_REVIEW'],
  ARCHIVED: [],
};

const visibilityTransitions: Readonly<
  Record<
    PublicationActor,
    Readonly<Partial<Record<ProductStatus, readonly ProductStatus[]>>>
  >
> = {
  author: {
    DRAFT: ['PENDING_REVIEW'],
    CHANGES_REQUESTED: ['PENDING_REVIEW'],
    REJECTED: ['PENDING_REVIEW'],
    APPROVED: ['ARCHIVED'],
    ARCHIVED: ['APPROVED'],
  },
  admin: {
    PENDING_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
    APPROVED: ['ARCHIVED'],
    ARCHIVED: ['APPROVED'],
  },
  media: {},
};

function stateConflict() {
  return new AppException({
    status: 409,
    code: ApiErrorCode.PRODUCT_STATE_CONFLICT,
    message: 'Product transition is not allowed',
  });
}

export function assertRevisionTransition(
  from: ProductStatus,
  to: ProductStatus,
): void {
  if (!revisionTransitions[from].includes(to)) throw stateConflict();
}

export async function deleteProduct(
  tx: Prisma.TransactionClient,
  input: { productId: string; actor: 'author' },
): Promise<void> {
  await assertProductNotInSale(tx, input.productId);
  await tx.product.updateMany({
    where: { id: input.productId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function transitionProductVisibility(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    expected: ProductStatus[];
    next: ProductStatus;
    actor: PublicationActor;
  },
): Promise<void> {
  if (
    !input.expected.length ||
    input.expected.some(
      (from) => !visibilityTransitions[input.actor][from]?.includes(input.next),
    )
  ) {
    throw stateConflict();
  }
  if (input.next === 'ARCHIVED')
    await assertProductNotInSale(tx, input.productId);
  else await lockProductRowForUpdate(tx, input.productId);
  const moved = await tx.product.updateMany({
    where: {
      id: input.productId,
      deletedAt: null,
      status: { in: input.expected },
    },
    data: { status: input.next },
  });
  if (moved.count !== 1) throw stateConflict();
}

export async function publishRevision(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    revisionId: string;
    expectedPublishedRevisionId: string | null;
    expectedRevisionAt: Date;
  },
): Promise<'published' | 'stale'> {
  await lockProductRowForUpdate(tx, input.productId);
  const product = await tx.product.findUnique({
    where: { id: input.productId },
    include: {
      sellerProfile: { include: { user: { select: { status: true } } } },
    },
  });
  const revision = await tx.productRevision.findUnique({
    where: { id: input.revisionId },
  });
  if (
    !product ||
    product.deletedAt !== null ||
    !revision ||
    product.sellerProfile.status !== 'APPROVED' ||
    product.sellerProfile.user.status !== 'active' ||
    !['PENDING_REVIEW', 'APPROVED', 'ARCHIVED'].includes(product.status) ||
    revision.id !== input.revisionId ||
    revision.productId !== product.id ||
    revision.updatedAt.getTime() !== input.expectedRevisionAt.getTime() ||
    product.publishedRevisionId !== input.expectedPublishedRevisionId
  )
    return 'stale';

  const restoring =
    revision.status === 'APPROVED' &&
    revision.id === product.publishedRevisionId;
  if (
    !restoring &&
    (revision.status !== 'PENDING_REVIEW' ||
      revision.id !== product.editingRevisionId)
  )
    return 'stale';

  if (!restoring) {
    await assertProductNotInSale(tx, product.id);
    const approved = await tx.productRevision.updateMany({
      where: {
        id: revision.id,
        productId: product.id,
        status: 'PENDING_REVIEW',
        updatedAt: input.expectedRevisionAt,
      },
      data: { status: 'APPROVED', reviewedAt: new Date() },
    });
    if (approved.count !== 1) throw stateConflict();
  }
  const published = await tx.product.updateMany({
    where: {
      id: product.id,
      status: product.status,
      publishedRevisionId: input.expectedPublishedRevisionId,
    },
    data: {
      ...publishedProductData(revision),
      status:
        product.status === 'ARCHIVED' && !restoring ? 'ARCHIVED' : 'APPROVED',
      publishedRevisionId: revision.id,
      publishedAt: product.publishedAt ?? new Date(),
    },
  });
  if (published.count !== 1) throw stateConflict();
  return 'published';
}

function publishedProductData(revision: {
  categoryId: string | null;
  title: string | null;
  story: string | null;
  technique: string | null;
  materials: string | null;
  dimensions: string | null;
  weight: string | null;
  year: number | null;
  condition: string | null;
  uniqueness: string | null;
  provenance: string | null;
  city: string | null;
  packaging: string | null;
  deliveryInfo: string | null;
  creationIntro: string | null;
}) {
  return {
    categoryId: revision.categoryId,
    title: revision.title,
    story: revision.story,
    technique: revision.technique,
    materials: revision.materials,
    dimensions: revision.dimensions,
    weight: revision.weight,
    year: revision.year,
    condition: revision.condition,
    uniqueness: revision.uniqueness,
    provenance: revision.provenance,
    city: revision.city,
    packaging: revision.packaging,
    deliveryInfo: revision.deliveryInfo,
    creationIntro: revision.creationIntro,
  };
}

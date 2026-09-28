import type { AdminProduct, AdminSellerProfile } from '@bidplace/contracts';

export type ModerationFilter =
  | 'ALL'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export type ModerationTarget =
  | { kind: 'revision'; id: string; updatedAt: string }
  | { kind: 'parent'; status: string; updatedAt: string };

export function sellerMatchesFilter(
  seller: AdminSellerProfile,
  filter: ModerationFilter,
) {
  if (filter === 'ALL') return true;
  if (filter === 'APPROVED') return seller.parentStatus === 'APPROVED';
  if (seller.reviewTarget) return seller.reviewTarget.status === filter;
  return seller.parentStatus === filter;
}

export function productMatchesFilter(
  product: AdminProduct,
  filter: ModerationFilter,
) {
  if (filter === 'ALL') return true;
  if (filter === 'APPROVED') return product.parentStatus === 'APPROVED';
  return product.reviewTarget?.status === filter;
}

export function sellerSearchText(seller: AdminSellerProfile) {
  const source = seller.reviewTarget?.content ?? seller.parent;
  return `${source.fullName} ${source.slug} ${source.discipline ?? ''}`;
}

export function productSearchText(product: AdminProduct) {
  const source = product.reviewTarget?.content ?? product.parent;
  return `${source.title ?? ''} ${product.sellerProfile.fullName} ${product.sellerProfile.slug}`;
}

export function displayedSeller(seller: AdminSellerProfile) {
  return seller.reviewTarget?.content ?? seller.parent;
}

export function displayedProduct(product: AdminProduct) {
  return product.reviewTarget?.content ?? product.parent;
}

export function revisionTarget(input: {
  id: string;
  updatedAt: string;
}) {
  return { kind: 'revision' as const, id: input.id, updatedAt: input.updatedAt };
}

export function parentTarget<Status extends string>(input: {
  status: Status;
  updatedAt: string;
}) {
  return {
    kind: 'parent' as const,
    status: input.status,
    updatedAt: input.updatedAt,
  };
}

export function pendingRevision(status: string | undefined) {
  return status === 'PENDING_REVIEW';
}

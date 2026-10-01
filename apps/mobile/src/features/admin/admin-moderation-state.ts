import type { AdminProduct, AdminSellerProfile } from '@bidplace/contracts';

export type ModerationFilter =
  | 'ALL'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export function moderationListQueryKey(
  resource: 'seller-profiles' | 'products',
  filter: ModerationFilter,
  search: string,
) {
  return ['admin', resource, filter, search.trim()] as const;
}

export function displayedSeller(seller: AdminSellerProfile) {
  return seller.reviewTarget?.content ?? seller.parent;
}

export function displayedProduct(product: AdminProduct) {
  return product.reviewTarget?.content ?? product.parent;
}

export function revisionTarget(input: { id: string; updatedAt: string }) {
  return {
    kind: 'revision' as const,
    id: input.id,
    updatedAt: input.updatedAt,
  };
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

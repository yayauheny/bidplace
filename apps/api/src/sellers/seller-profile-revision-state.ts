import { ConflictException } from '@nestjs/common';
import type { SellerProfileRevisionStatus } from '@bidplace/contracts';

const authorTransitions: Readonly<
  Record<SellerProfileRevisionStatus, readonly SellerProfileRevisionStatus[]>
> = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: [],
  APPROVED: [],
  CHANGES_REQUESTED: ['PENDING_REVIEW'],
  REJECTED: ['PENDING_REVIEW'],
};

const adminTransitions: Readonly<
  Record<SellerProfileRevisionStatus, readonly SellerProfileRevisionStatus[]>
> = {
  DRAFT: [],
  PENDING_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  APPROVED: [],
  CHANGES_REQUESTED: [],
  REJECTED: [],
};

export function assertSellerProfileRevisionTransition(
  actor: 'author' | 'admin',
  current: SellerProfileRevisionStatus,
  next: SellerProfileRevisionStatus,
): void {
  const transitions = actor === 'author' ? authorTransitions : adminTransitions;
  if (!transitions[current].includes(next)) {
    throw new ConflictException(
      'Seller profile revision transition is not allowed',
    );
  }
}

export function canAuthorEditSellerProfileRevision(
  status: SellerProfileRevisionStatus,
): boolean {
  return (
    status === 'DRAFT' ||
    status === 'CHANGES_REQUESTED' ||
    status === 'REJECTED'
  );
}

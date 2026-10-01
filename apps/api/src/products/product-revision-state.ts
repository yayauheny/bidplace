import { ConflictException } from '@nestjs/common';
import type { ProductStatus } from '@bidplace/contracts';

const authorTransitions: Readonly<Record<ProductStatus, readonly ProductStatus[]>> = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: [],
  CHANGES_REQUESTED: ['PENDING_REVIEW'],
  APPROVED: ['ARCHIVED'],
  REJECTED: ['PENDING_REVIEW'],
  ARCHIVED: ['APPROVED'],
};

const adminTransitions: Readonly<Record<ProductStatus, readonly ProductStatus[]>> = {
  DRAFT: [],
  PENDING_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  CHANGES_REQUESTED: [],
  APPROVED: ['ARCHIVED'],
  REJECTED: [],
  ARCHIVED: ['APPROVED'],
};

export function assertProductRevisionTransition(
  actor: 'author' | 'admin',
  current: ProductStatus,
  next: ProductStatus,
): void {
  const transitions = actor === 'author' ? authorTransitions : adminTransitions;
  if (!transitions[current].includes(next)) {
    throw new ConflictException('Product transition is not allowed');
  }
}

export function canAuthorEditRevision(status: ProductStatus): boolean {
  return status === 'DRAFT' || status === 'CHANGES_REQUESTED' || status === 'REJECTED';
}

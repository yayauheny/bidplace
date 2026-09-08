import { ConflictException } from '@nestjs/common';
import type { SellerStatus } from '@bidplace/contracts';

const authorTransitions: Readonly<
  Record<SellerStatus, readonly SellerStatus[]>
> = {
  PENDING_REVIEW: [],
  APPROVED: [],
  CHANGES_REQUESTED: ['PENDING_REVIEW'],
  REJECTED: ['PENDING_REVIEW'],
  SUSPENDED: [],
};

const adminTransitions: Readonly<
  Record<SellerStatus, readonly SellerStatus[]>
> = {
  PENDING_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  APPROVED: [],
  CHANGES_REQUESTED: [],
  REJECTED: [],
  SUSPENDED: [],
};

export function assertSellerProfileRevisionTransition(
  actor: 'author' | 'admin',
  current: SellerStatus,
  next: SellerStatus,
): void {
  const transitions = actor === 'author' ? authorTransitions : adminTransitions;
  if (!transitions[current].includes(next)) {
    throw new ConflictException(
      'Seller profile revision transition is not allowed',
    );
  }
}

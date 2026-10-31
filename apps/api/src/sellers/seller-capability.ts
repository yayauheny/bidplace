import { ForbiddenException } from '@nestjs/common';
import { type SellerStatus, type UserStatus } from '@bidplace/contracts';

export function assertApprovedSeller(status: SellerStatus): void {
  if (status !== 'APPROVED') {
    throw new ForbiddenException('Approved SellerProfile is required');
  }
}

export function sellerMayAcceptOrders(input: {
  userStatus: UserStatus;
  sellerStatus: SellerStatus;
}): boolean {
  return input.userStatus === 'active' && input.sellerStatus === 'APPROVED';
}

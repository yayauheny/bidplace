import { ForbiddenException } from '@nestjs/common';
import { type SellerStatus } from '@bidplace/contracts';

export function assertApprovedSeller(status: SellerStatus): void {
  if (status !== 'APPROVED') {
    throw new ForbiddenException('Approved SellerProfile is required');
  }
}

export function assertSellerHistoryAccess(status: SellerStatus | undefined): void {
  if (status !== 'APPROVED' && status !== 'SUSPENDED') {
    throw new ForbiddenException('Seller history access required');
  }
}

import { ForbiddenException } from '@nestjs/common';
import { type SellerStatus } from '@bidplace/contracts';

export function assertApprovedSeller(status: SellerStatus): void {
  if (status !== 'APPROVED') {
    throw new ForbiddenException('Approved SellerProfile is required');
  }
}

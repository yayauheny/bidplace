import { type Lot } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { parseLotStatus } from '../core/contracts';

export const lotContractSelect = {
  id: true,
  sellerProfileId: true,
  categoryId: true,
  title: true,
  description: true,
  condition: true,
  images: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LotSelect;

export type LotContractRecord = Prisma.LotGetPayload<{
  select: typeof lotContractSelect;
}>;

export function toContractLot(lot: LotContractRecord): Lot {
  return {
    id: lot.id,
    sellerProfileId: lot.sellerProfileId,
    categoryId: lot.categoryId,
    title: lot.title,
    description: lot.description,
    condition: lot.condition,
    images: lot.images,
    status: parseLotStatus(lot.status, lot.id),
    createdAt: lot.createdAt.toISOString(),
    updatedAt: lot.updatedAt.toISOString(),
  };
}

import { type Lot } from '@bidplace/contracts';

import { parseLotStatus } from '../core/contracts';

export type RawLotRecord = {
  id: string;
  sellerProfileId: string;
  categoryId: string;
  title: string;
  description: string;
  condition: string;
  images: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toContractLot(lot: RawLotRecord): Lot {
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

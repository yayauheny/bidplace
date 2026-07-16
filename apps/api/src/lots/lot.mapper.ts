import { type Lot } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { parseLotStatus } from '../core/contracts';
import { buildImageUrl } from '../images/image-url';

const lotImagesForContract = {
  select: {
    id: true,
    position: true,
  },
  orderBy: [{ position: 'asc' }, { id: 'asc' }],
} satisfies Prisma.Lot$lotImagesArgs;

export const lotContractSelect = {
  id: true,
  sellerProfileId: true,
  categoryId: true,
  title: true,
  description: true,
  condition: true,
  lotImages: lotImagesForContract,
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
    images: lot.lotImages.map((image) => buildImageUrl(image.id)),
    status: parseLotStatus(lot.status, lot.id),
    createdAt: lot.createdAt.toISOString(),
    updatedAt: lot.updatedAt.toISOString(),
  };
}

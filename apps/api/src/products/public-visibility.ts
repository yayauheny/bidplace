import { type Prisma } from '@bidplace/database';

export const publicCatalogProductWhere = {
  status: 'APPROVED',
  listings: {
    some: {
      status: {
        in: ['SCHEDULED', 'LIVE'],
      },
    },
  },
} satisfies Prisma.ProductWhereInput;

export const publicDirectProductWhere = {
  status: 'APPROVED',
  listings: {
    some: {
      status: {
        in: ['SCHEDULED', 'LIVE', 'ENDED'],
      },
    },
  },
} satisfies Prisma.ProductWhereInput;

import { type Prisma } from '@bidplace/database';

export const publicListingStatuses = ['LIVE', 'SCHEDULED', 'ENDED'] as const;
export type PublicListingStatus = (typeof publicListingStatuses)[number];

const publicListingPriority: Record<PublicListingStatus, number> = {
  LIVE: 0,
  SCHEDULED: 1,
  ENDED: 2,
};

export function selectPublicListing<T extends { id: string; status: PublicListingStatus; createdAt: Date }>(
  listings: T[],
): T | null {
  return [...listings].sort(
    (left, right) =>
      publicListingPriority[left.status] - publicListingPriority[right.status] ||
      right.createdAt.getTime() - left.createdAt.getTime() ||
      right.id.localeCompare(left.id),
  )[0] ?? null;
}

export const publicCatalogProductWhere = {
  status: 'APPROVED',
  listings: {
    some: {
      status: {
        in: publicListingStatuses,
      },
    },
  },
} satisfies Prisma.ProductWhereInput;

export const publicDirectProductWhere = {
  status: 'APPROVED',
  listings: {
    some: {
      status: {
        in: publicListingStatuses,
      },
    },
  },
} satisfies Prisma.ProductWhereInput;

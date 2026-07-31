import { type ListingStatus } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

export const publicListingStatuses: ListingStatus[] = [
  'LIVE',
  'SCHEDULED',
  'ENDED',
];
export type PublicListingStatus = Extract<
  ListingStatus,
  'LIVE' | 'SCHEDULED' | 'ENDED'
>;

const publicListingPriority: Partial<Record<ListingStatus, number>> = {
  LIVE: 0,
  SCHEDULED: 1,
  ENDED: 2,
};

export function selectPublicListing<T extends { id: string; status: ListingStatus; createdAt: Date }>(
  listings: T[],
): T | null {
  return [...listings].sort(
    (left, right) =>
      (publicListingPriority[left.status] ?? Number.MAX_SAFE_INTEGER) -
        (publicListingPriority[right.status] ?? Number.MAX_SAFE_INTEGER) ||
      right.createdAt.getTime() - left.createdAt.getTime() ||
      right.id.localeCompare(left.id),
  )[0] ?? null;
}

export const publicCatalogProductWhere = {
  status: 'APPROVED',
  sellerProfile: { status: 'APPROVED' },
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
  sellerProfile: { status: 'APPROVED' },
  listings: {
    some: {
      status: {
        in: publicListingStatuses,
      },
    },
  },
} satisfies Prisma.ProductWhereInput;

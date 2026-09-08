import { type ListingStatus } from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

export type PublicListingStatus = Extract<
  ListingStatus,
  'LIVE' | 'SCHEDULED' | 'ENDED'
>;
export const publicListingStatuses: PublicListingStatus[] = [
  'LIVE',
  'SCHEDULED',
  'ENDED',
];

export const publicProductContentWhere = {
  publishedRevisionId: { not: null },
  categoryId: { not: null },
  title: { not: '' },
  images: { some: {} },
} satisfies Prisma.ProductWhereInput;

export const publicProductContentSql: Prisma.Sql = Prisma.sql`
  p."published_revision_id" IS NOT NULL
  AND
  p."category_id" IS NOT NULL
  AND NULLIF(BTRIM(p."title"), '') IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "product_images" pi WHERE pi."product_id" = p."id"
  )
`;

export function publicListingWhere(
  statuses: PublicListingStatus[] = publicListingStatuses,
): Prisma.ListingWhereInput {
  return {
    status: { in: statuses },
    product: {
      status: 'APPROVED',
      sellerProfile: { status: 'APPROVED' },
      ...publicProductContentWhere,
    },
  };
}

const publicListingPriority: Partial<Record<ListingStatus, number>> = {
  LIVE: 0,
  SCHEDULED: 1,
  ENDED: 2,
};

export function selectPublicListing<
  T extends { id: string; status: ListingStatus; createdAt: Date },
>(listings: T[]): T | null {
  return (
    [...listings].sort(
      (left, right) =>
        (publicListingPriority[left.status] ?? Number.MAX_SAFE_INTEGER) -
          (publicListingPriority[right.status] ?? Number.MAX_SAFE_INTEGER) ||
        right.createdAt.getTime() - left.createdAt.getTime() ||
        right.id.localeCompare(left.id),
    )[0] ?? null
  );
}

export const publicCatalogProductWhere = {
  status: 'APPROVED',
  sellerProfile: { status: 'APPROVED' },
  ...publicProductContentWhere,
} satisfies Prisma.ProductWhereInput;

export const publicDirectProductWhere = {
  status: 'APPROVED',
  sellerProfile: { status: 'APPROVED' },
  ...publicProductContentWhere,
} satisfies Prisma.ProductWhereInput;

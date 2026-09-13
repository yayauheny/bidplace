import { Prisma } from '@bidplace/database';

export const publicAuthorCityWhere = {
  not: '',
} satisfies Prisma.SellerProfileWhereInput['city'];

export const publicProductContentWhere = {
  publishedRevisionId: { not: null },
  publishedAt: { not: null },
  categoryId: { not: null },
  title: { not: '' },
  publishedRevision: {
    is: {
      title: { not: '' },
      categoryId: { not: null },
      images: { some: {} },
    },
  },
} satisfies Prisma.ProductWhereInput;

export const publicProductContentSql: Prisma.Sql = Prisma.sql`
  p."published_revision_id" IS NOT NULL
  AND p."published_at" IS NOT NULL
  AND p."category_id" IS NOT NULL
  AND NULLIF(BTRIM(p."title"), '') IS NOT NULL
  AND NULLIF(BTRIM(sp."city"), '') IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "product_revisions" pr
    WHERE pr."id" = p."published_revision_id"
      AND NULLIF(BTRIM(pr."title"), '') IS NOT NULL
      AND pr."category_id" IS NOT NULL
  )
  AND EXISTS (
    SELECT 1
    FROM "product_revision_images" pri
    WHERE pri."revision_id" = p."published_revision_id"
  )
`;

export const publicCatalogProductWhere = {
  status: 'APPROVED',
  sellerProfile: {
    status: 'APPROVED',
    city: publicAuthorCityWhere,
  },
  ...publicProductContentWhere,
} satisfies Prisma.ProductWhereInput;

export const publicDirectProductWhere = {
  status: 'APPROVED',
  sellerProfile: {
    status: 'APPROVED',
    city: publicAuthorCityWhere,
  },
  ...publicProductContentWhere,
} satisfies Prisma.ProductWhereInput;

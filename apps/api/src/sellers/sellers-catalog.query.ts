import type { PortfolioAuthorsQuery } from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { escapeLikePattern } from '../products/products-catalog.query';
import { portfolioProductContentSql } from '../products/public-visibility';

export type PublicAuthorPageRow = { id: string; total: number | bigint };
export type PublicAuthorFacetRow = {
  city: string | null;
  discipline: string;
};

export function publicAuthorOrderBy(
  sort: PortfolioAuthorsQuery['sort'],
): string {
  if (sort === 'name') {
    return 'filtered."full_name" ASC, filtered."id" ASC';
  }
  return 'filtered."latest_product_at" DESC NULLS LAST, filtered."id" ASC';
}

export function publicAuthorCte(
  query: PortfolioAuthorsQuery,
  options: { requireCity?: boolean } = {},
): Prisma.Sql {
  const filters: Prisma.Sql[] = [Prisma.sql`author."status" = 'APPROVED'`];

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    filters.push(Prisma.sql`(
      author."full_name" ILIKE ${pattern} ESCAPE '\\'
      OR author."slug" ILIKE ${pattern} ESCAPE '\\'
      OR author."short_description" ILIKE ${pattern} ESCAPE '\\'
    )`);
  }

  if (query.tag) {
    const pattern = `%${escapeLikePattern(query.tag)}%`;
    filters.push(
      Prisma.sql`author."discipline" ILIKE ${pattern} ESCAPE '\\'`,
    );
  }

  if (query.city) {
    filters.push(Prisma.sql`LOWER(author."city") = LOWER(${query.city})`);
  } else if (options.requireCity) {
    filters.push(Prisma.sql`NULLIF(BTRIM(author."city"), '') IS NOT NULL`);
  }

  return Prisma.sql`WITH filtered AS (
    SELECT
      author."id",
      author."full_name",
      author."city",
      author."discipline",
      (
        SELECT p."created_at"
        FROM "products" p
        INNER JOIN "seller_profiles" sp ON sp."id" = p."seller_profile_id"
        WHERE p."seller_profile_id" = author."id"
          AND p."status" = 'APPROVED'
          AND ${portfolioProductContentSql}
        ORDER BY p."created_at" DESC, p."id" ASC
        LIMIT 1
      ) AS "latest_product_at"
    FROM "seller_profiles" author
    WHERE ${Prisma.join(filters, ' AND ')}
  )`;
}

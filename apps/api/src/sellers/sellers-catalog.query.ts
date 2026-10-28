import type { PortfolioAuthorsQuery } from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { escapeLikePattern } from '../products/products-catalog.query';

export type PublicAuthorPageRow = { id: string; total: number | bigint };

export function publicAuthorOrderBy(
  sort: PortfolioAuthorsQuery['sort'],
): string {
  if (sort === 'name') {
    return 'filtered."full_name" ASC, filtered."id" ASC';
  }
  return 'filtered."created_at" DESC, filtered."id" ASC';
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
      OR COALESCE(author_user."slug", author."slug") ILIKE ${pattern} ESCAPE '\\'
      OR author."short_description" ILIKE ${pattern} ESCAPE '\\'
    )`);
  }

  if (query.directionId) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1
      FROM "seller_profile_revision_directions" direction
      WHERE direction."revision_id" = author."published_revision_id"
        AND direction."category_id" = CAST(${query.directionId} AS uuid)
    )`);
  } else if (query.tag) {
    const pattern = `%${escapeLikePattern(query.tag)}%`;
    filters.push(
      Prisma.sql`EXISTS (
        SELECT 1
        FROM "seller_profile_revision_directions" direction
        INNER JOIN "categories" direction_category
          ON direction_category."id" = direction."category_id"
        WHERE direction."revision_id" = author."published_revision_id"
          AND direction_category."name" ILIKE ${pattern} ESCAPE '\\'
      )`,
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
      author."published_revision_id",
      author."created_at"
    FROM "seller_profiles" author
    INNER JOIN "users" author_user ON author_user."id" = author."user_id"
    WHERE author_user."status" = 'active'
      AND ${Prisma.join(filters, ' AND ')}
  )`;
}

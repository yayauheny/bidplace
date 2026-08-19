import type { PublicDiscoveryQuery } from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { publicProductContentSql } from './public-visibility';

export type PublicCatalogPageRow = { id: string; total: number | bigint };

export function escapeLikePattern(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

export function publicCatalogOrderBy(sort: PublicDiscoveryQuery['sort']): string {
  switch (sort) {
    case 'activity':
      return 'p.status_rank ASC, p.bid_count DESC, p.current_price DESC, p.ends_at ASC, p.id ASC';
    case 'endingSoon':
      return 'p.status_rank ASC, p.ends_at ASC, p.id ASC';
    case 'priceAsc':
      return 'p.current_price ASC, p.id ASC';
    case 'priceDesc':
      return 'p.current_price DESC, p.id ASC';
    case 'newest':
      return 'p.published_at DESC NULLS LAST, p.id ASC';
  }
}

export function publicCatalogCte(query: PublicDiscoveryQuery): Prisma.Sql {
  const filters: Prisma.Sql[] = [Prisma.sql`p."status" = 'APPROVED'`];

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    filters.push(Prisma.sql`(
      p."title" ILIKE ${pattern} ESCAPE '\\'
      OR p."story" ILIKE ${pattern} ESCAPE '\\'
      OR p."materials" ILIKE ${pattern} ESCAPE '\\'
      OR sp."full_name" ILIKE ${pattern} ESCAPE '\\'
    )`);
  }

  if (query.category) {
    filters.push(Prisma.sql`p."category_id" = CAST(${query.category} AS uuid)`);
  }

  if (query.author) {
    filters.push(Prisma.sql`sp."slug" = ${query.author}`);
  }

  if (query.yearFrom !== undefined) {
    filters.push(Prisma.sql`p."year" >= ${query.yearFrom}`);
  }

  if (query.yearTo !== undefined) {
    filters.push(Prisma.sql`p."year" <= ${query.yearTo}`);
  }

  for (const material of query.materials ?? []) {
    const pattern = `%${escapeLikePattern(material)}%`;
    filters.push(Prisma.sql`p."materials" ILIKE ${pattern} ESCAPE '\\'`);
  }

  if (query.status) {
    filters.push(
      Prisma.sql`c.status = CAST(${query.status} AS "ListingStatus")`,
    );
  }

  if (query.priceMin !== undefined) {
    filters.push(Prisma.sql`c.current_price >= ${query.priceMin}`);
  }

  if (query.priceMax !== undefined) {
    filters.push(Prisma.sql`c.current_price <= ${query.priceMax}`);
  }

  if (query.uniqueness) {
    filters.push(Prisma.sql`p."uniqueness" = ${query.uniqueness}`);
  }

  return Prisma.sql`WITH canonical AS (
    SELECT DISTINCT ON (l."product_id")
      l."product_id",
      l."status",
      CASE l."status"
        WHEN 'LIVE' THEN 0
        WHEN 'SCHEDULED' THEN 1
        ELSE 2
      END AS status_rank,
      l."ends_at",
      l."current_price",
      l."bid_count",
      l."created_at"
    FROM "listings" l
    WHERE l."status" IN ('LIVE', 'SCHEDULED', 'ENDED')
    ORDER BY
      l."product_id",
      CASE l."status"
        WHEN 'LIVE' THEN 0
        WHEN 'SCHEDULED' THEN 1
        ELSE 2
      END,
      l."created_at" DESC,
      l."id" DESC
  ), filtered AS (
    SELECT p."id", p."category_id", p."seller_profile_id", p."materials", p."uniqueness", p."published_at", c."status", c.status_rank,
      c."ends_at", c."current_price", c."bid_count"
    FROM "products" p
    INNER JOIN "seller_profiles" sp ON sp."id" = p."seller_profile_id"
    INNER JOIN canonical c ON c."product_id" = p."id"
    WHERE sp."status" = 'APPROVED'
      AND ${publicProductContentSql}
      AND ${Prisma.join(filters, ' AND ')}
  )`;
}


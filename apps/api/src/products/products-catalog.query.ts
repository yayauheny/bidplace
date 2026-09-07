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
      return 'p."published_at" DESC NULLS LAST, p."id" ASC';
    case 'endingSoon':
      return 'p."published_at" DESC NULLS LAST, p."id" ASC';
    case 'priceAsc':
      return 'p."published_at" DESC NULLS LAST, p."id" ASC';
    case 'priceDesc':
      return 'p."published_at" DESC NULLS LAST, p."id" ASC';
    case 'newest':
      return 'p."published_at" DESC NULLS LAST, p."id" ASC';
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

  if (query.uniqueness) {
    filters.push(Prisma.sql`p."uniqueness" = ${query.uniqueness}`);
  }

  return Prisma.sql`WITH filtered AS (
    SELECT p."id", p."category_id", p."seller_profile_id", p."materials", p."uniqueness", p."published_at"
    FROM "products" p
    INNER JOIN "seller_profiles" sp ON sp."id" = p."seller_profile_id"
    WHERE sp."status" = 'APPROVED'
      AND ${publicProductContentSql}
      AND ${Prisma.join(filters, ' AND ')}
  )`;
}

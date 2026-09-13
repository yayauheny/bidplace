import type {
  PortfolioWorksQuery,
  PublicDiscoveryQuery,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import {
  portfolioProductContentSql,
  publicProductContentSql,
} from './public-visibility';

export type PublicCatalogPageRow = { id: string; total: number | bigint };
export type PublicWorkFacetRow = { materials: string | null };

export function escapeLikePattern(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

export function publicCatalogOrderBy(
  sort: PublicDiscoveryQuery['sort'],
): string {
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
    case 'oldest':
      return 'p."published_at" ASC NULLS LAST, p."id" ASC';
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

export function portfolioCatalogOrderBy(
  sort: PortfolioWorksQuery['sort'],
): string {
  if (sort === 'oldest') {
    return 'p."published_at" ASC NULLS LAST, p."id" ASC';
  }
  return 'p."published_at" DESC NULLS LAST, p."id" ASC';
}

export function portfolioCatalogCte(query: PortfolioWorksQuery): Prisma.Sql {
  const filters: Prisma.Sql[] = [Prisma.sql`p."status" = 'APPROVED'`];

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    filters.push(Prisma.sql`(
      published."title" ILIKE ${pattern} ESCAPE '\\'
      OR published."story" ILIKE ${pattern} ESCAPE '\\'
      OR published."materials" ILIKE ${pattern} ESCAPE '\\'
      OR sp."full_name" ILIKE ${pattern} ESCAPE '\\'
    )`);
  }

  if (query.category) {
    filters.push(
      Prisma.sql`published."category_id" = CAST(${query.category} AS uuid)`,
    );
  }

  if (query.author) {
    filters.push(Prisma.sql`sp."slug" = ${query.author}`);
  }

  for (const material of query.materials ?? []) {
    const pattern = `%${escapeLikePattern(material)}%`;
    filters.push(
      Prisma.sql`published."materials" ILIKE ${pattern} ESCAPE '\\'`,
    );
  }

  return Prisma.sql`WITH filtered AS (
    SELECT
      p."id",
      published."category_id",
      p."seller_profile_id",
      published."materials",
      p."published_at"
    FROM "products" p
    INNER JOIN "seller_profiles" sp ON sp."id" = p."seller_profile_id"
    INNER JOIN "product_revisions" published
      ON published."id" = p."published_revision_id"
    WHERE sp."status" = 'APPROVED'
      AND NULLIF(BTRIM(sp."city"), '') IS NOT NULL
      AND ${portfolioProductContentSql}
      AND ${Prisma.join(filters, ' AND ')}
  )`;
}

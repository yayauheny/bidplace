import type { PortfolioWorksQuery } from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { portfolioProductContentSql } from './public-visibility';

export type PublicCatalogPageRow = { id: string; total: number | bigint };
export type PublicWorkFacetRow = { materials: string | null };

export function escapeLikePattern(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
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
    INNER JOIN "users" author_user ON author_user."id" = sp."user_id"
    INNER JOIN "product_revisions" published
      ON published."id" = p."published_revision_id"
    WHERE sp."status" = 'APPROVED'
      AND author_user."status" = 'active'
      AND NULLIF(BTRIM(sp."city"), '') IS NOT NULL
      AND ${portfolioProductContentSql}
      AND ${Prisma.join(filters, ' AND ')}
  )`;
}

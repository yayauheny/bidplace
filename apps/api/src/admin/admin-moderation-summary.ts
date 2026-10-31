import { Prisma } from '@bidplace/database';
import {
  type AdminQueueQuery,
  parseAdminQueueCursor,
} from '@bidplace/contracts';
import { escapeLikePattern } from '../products/products-catalog.query';

export type ModerationResource = 'SELLER_PROFILE' | 'PRODUCT';
export type ModerationSummaryRow = {
  id: string;
  label: string | null;
  parentStatus: string;
  reviewStatus: string | null;
  reviewRevisionId: string | null;
  submittedAt: Date | null;
  sortId: string;
};

export function moderationSummarySql(
  resource: ModerationResource,
  query: AdminQueueQuery,
): Prisma.Sql {
  const seller = resource === 'SELLER_PROFILE';
  const table = Prisma.raw(seller ? 'seller_profiles' : 'products');
  const revisions = Prisma.raw(
    seller ? 'seller_profile_revisions' : 'product_revisions',
  );
  const label = Prisma.raw(seller ? 'r.full_name' : 'r.title');
  const fallbackLabel = Prisma.raw(seller ? 'p.full_name' : 'p.title');
  const filters: Prisma.Sql[] = [];
  if (seller) filters.push(Prisma.sql`p.status::text <> 'DRAFT'`);
  else filters.push(Prisma.sql`p.deleted_at IS NULL`);
  if (query.filter === 'APPROVED')
    filters.push(Prisma.sql`p.status::text = 'APPROVED'`);
  else if (query.filter !== 'ALL')
    filters.push(Prisma.sql`(
    r.status::text = ${query.filter} OR (r.id IS NULL AND p.status::text = ${query.filter})
  )`);
  if (query.search)
    filters.push(Prisma.sql`(
    COALESCE(${label}, ${fallbackLabel}, '') ILIKE ${`%${escapeLikePattern(query.search)}%`} ESCAPE '\\'
    ${seller ? Prisma.sql`OR p.slug ILIKE ${`%${escapeLikePattern(query.search)}%`} ESCAPE '\\'` : Prisma.empty}
  )`);
  const cursor = query.cursor ? parseAdminQueueCursor(query.cursor) : null;
  if (cursor)
    filters.push(
      cursor.submittedAt === null
        ? Prisma.sql`r.submitted_at IS NULL AND COALESCE(r.id, p.id) > ${cursor.id}::uuid`
        : Prisma.sql`(r.submitted_at IS NULL OR r.submitted_at > (${new Date(cursor.submittedAt)}::timestamptz AT TIME ZONE 'UTC')
        OR (r.submitted_at = (${new Date(cursor.submittedAt)}::timestamptz AT TIME ZONE 'UTC') AND COALESCE(r.id, p.id) > ${cursor.id}::uuid))`,
    );
  return Prisma.sql`
    SELECT p.id, COALESCE(${label}, ${fallbackLabel}) AS label, p.status::text AS "parentStatus",
      r.status::text AS "reviewStatus", r.id AS "reviewRevisionId", r.submitted_at AS "submittedAt",
      COALESCE(r.id, p.id) AS "sortId"
    FROM ${table} p LEFT JOIN ${revisions} r ON r.id = p.editing_revision_id
    ${filters.length ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}` : Prisma.empty}
    ORDER BY r.submitted_at ASC NULLS LAST, COALESCE(r.id, p.id) ASC LIMIT ${query.limit + 1}
  `;
}

import {
  type AdminModerationCursor,
  type AdminModerationListQuery,
  encodeAdminModerationCursor,
  parseAdminModerationCursor,
} from '@bidplace/contracts';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@bidplace/database';

import { escapeLikePattern } from '../products/products-catalog.query';

export const moderationListOrderBy = [
  { createdAt: 'asc' as const },
  { id: 'asc' as const },
];

export function readModerationCursor(
  value: string | undefined,
): AdminModerationCursor | null {
  if (!value) return null;
  const cursor = parseAdminModerationCursor(value);
  if (!cursor) {
    throw new BadRequestException('Invalid moderation cursor');
  }
  return cursor;
}

export function isAfterModerationCursor(
  row: { createdAt: Date; id: string },
  cursor: AdminModerationCursor,
): boolean {
  const createdAt = row.createdAt.toISOString();
  if (createdAt > cursor.createdAt) return true;
  if (createdAt < cursor.createdAt) return false;
  return row.id.toLowerCase() > cursor.id;
}

export function moderationKeysetWhere(cursor: AdminModerationCursor | null):
  | {
      OR: [
        { createdAt: { gt: Date } },
        { AND: [{ createdAt: Date }, { id: { gt: string } }] },
      ];
    }
  | undefined {
  if (!cursor) return undefined;
  const createdAt = new Date(cursor.createdAt);
  return {
    OR: [
      { createdAt: { gt: createdAt } },
      { AND: [{ createdAt }, { id: { gt: cursor.id } }] },
    ],
  };
}

function sellerReviewOrLegacy(
  status: 'PENDING_REVIEW' | 'CHANGES_REQUESTED',
): Prisma.SellerProfileWhereInput {
  return {
    OR: [
      { editingRevision: { is: { status } } },
      { AND: [{ editingRevisionId: null }, { status }] },
    ],
  };
}

export function sellerModerationWhere(
  query: AdminModerationListQuery,
  cursor: AdminModerationCursor | null,
): Prisma.SellerProfileWhereInput {
  const filters: Prisma.SellerProfileWhereInput[] = [
    { status: { not: 'DRAFT' } },
  ];
  if (query.filter === 'APPROVED') {
    filters.push({ status: 'APPROVED' });
  } else if (
    query.filter === 'PENDING_REVIEW' ||
    query.filter === 'CHANGES_REQUESTED'
  ) {
    filters.push(sellerReviewOrLegacy(query.filter));
  }
  const keyset = moderationKeysetWhere(cursor);
  if (keyset) filters.push(keyset);
  return { AND: filters };
}

function productReviewStatus(
  status: 'PENDING_REVIEW' | 'CHANGES_REQUESTED',
): Prisma.ProductWhereInput {
  return { editingRevision: { is: { status } } };
}

export function productModerationWhere(
  query: AdminModerationListQuery,
  cursor: AdminModerationCursor | null,
): Prisma.ProductWhereInput {
  const filters: Prisma.ProductWhereInput[] = [];
  if (query.filter === 'APPROVED') {
    filters.push({ status: 'APPROVED' });
  } else if (
    query.filter === 'PENDING_REVIEW' ||
    query.filter === 'CHANGES_REQUESTED'
  ) {
    filters.push(productReviewStatus(query.filter));
  }
  const keyset = moderationKeysetWhere(cursor);
  if (keyset) filters.push(keyset);
  return filters.length > 0 ? { AND: filters } : {};
}

function moderationLikePattern(search: string): string {
  return `%${escapeLikePattern(search)}%`;
}

export function sellerModerationSearchSql(
  search: string,
  query: AdminModerationListQuery,
  cursor: AdminModerationCursor | null,
): Prisma.Sql {
  const filters: Prisma.Sql[] = [
    Prisma.sql`sp."status" <> CAST('DRAFT' AS "SellerProfileStatus")`,
    Prisma.sql`(
      CASE
        WHEN sp."editing_revision_id" IS NOT NULL THEN
          rev."full_name" || ' ' || rev."slug" || ' ' || COALESCE(rev."discipline", '')
        ELSE
          sp."full_name" || ' ' || sp."slug" || ' ' || COALESCE(sp."discipline", '')
      END
    ) ILIKE ${moderationLikePattern(search)} ESCAPE '\\'`,
  ];
  if (query.filter === 'APPROVED') {
    filters.push(
      Prisma.sql`sp."status" = CAST('APPROVED' AS "SellerProfileStatus")`,
    );
  } else if (
    query.filter === 'PENDING_REVIEW' ||
    query.filter === 'CHANGES_REQUESTED'
  ) {
    filters.push(Prisma.sql`(
      (
        sp."editing_revision_id" IS NOT NULL
        AND rev."status" = CAST(${query.filter} AS "SellerProfileRevisionStatus")
      )
      OR (
        sp."editing_revision_id" IS NULL
        AND sp."status" = CAST(${query.filter} AS "SellerProfileStatus")
      )
    )`);
  }
  if (cursor) {
    const createdAt = new Date(cursor.createdAt);
    filters.push(Prisma.sql`(
      sp."created_at" > ${createdAt}
      OR (
        sp."created_at" = ${createdAt}
        AND sp."id" > ${cursor.id}::uuid
      )
    )`);
  }
  return Prisma.sql`
    SELECT sp."id", sp."created_at"
    FROM "seller_profiles" sp
    LEFT JOIN "seller_profile_revisions" rev
      ON rev."id" = sp."editing_revision_id"
    WHERE ${Prisma.join(filters, ' AND ')}
    ORDER BY sp."created_at" ASC, sp."id" ASC
    LIMIT ${query.limit + 1}
  `;
}

export function productModerationSearchSql(
  search: string,
  query: AdminModerationListQuery,
  cursor: AdminModerationCursor | null,
): Prisma.Sql {
  const filters: Prisma.Sql[] = [
    Prisma.sql`(
      CASE
        WHEN p."editing_revision_id" IS NOT NULL THEN COALESCE(rev."title", '')
        ELSE COALESCE(p."title", '')
      END || ' ' || sp."full_name" || ' ' || sp."slug"
    ) ILIKE ${moderationLikePattern(search)} ESCAPE '\\'`,
  ];
  if (query.filter === 'APPROVED') {
    filters.push(Prisma.sql`p."status" = CAST('APPROVED' AS "ProductStatus")`);
  } else if (
    query.filter === 'PENDING_REVIEW' ||
    query.filter === 'CHANGES_REQUESTED'
  ) {
    filters.push(Prisma.sql`(
      p."editing_revision_id" IS NOT NULL
      AND rev."status" = CAST(${query.filter} AS "ProductStatus")
    )`);
  }
  if (cursor) {
    const createdAt = new Date(cursor.createdAt);
    filters.push(Prisma.sql`(
      p."created_at" > ${createdAt}
      OR (
        p."created_at" = ${createdAt}
        AND p."id" > ${cursor.id}::uuid
      )
    )`);
  }
  return Prisma.sql`
    SELECT p."id", p."created_at"
    FROM "products" p
    INNER JOIN "seller_profiles" sp
      ON sp."id" = p."seller_profile_id"
    LEFT JOIN "product_revisions" rev
      ON rev."id" = p."editing_revision_id"
    WHERE ${Prisma.join(filters, ' AND ')}
    ORDER BY p."created_at" ASC, p."id" ASC
    LIMIT ${query.limit + 1}
  `;
}

export function orderRowsByIds<T extends { id: string }>(
  ids: readonly string[],
  rows: readonly T[],
): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}

export function moderationPage<T extends { id: string; createdAt: Date }>(
  rows: T[],
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  if (!hasMore || !last) {
    return { page, nextCursor: null };
  }
  return {
    page,
    nextCursor: encodeAdminModerationCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    }),
  };
}

export function latestModerationReasonSql(
  targetType: 'SELLER_PROFILE' | 'PRODUCT',
  targetIds: readonly string[],
): Prisma.Sql {
  return Prisma.sql`
    SELECT DISTINCT ON ("target_id")
      "target_id",
      "reason"
    FROM "audit_events"
    WHERE "target_type" = CAST(${targetType} AS "AuditTargetType")
      AND "target_id" IN (${Prisma.join(
        targetIds.map((id) => Prisma.sql`${id}::uuid`),
      )})
      AND "reason" IS NOT NULL
      AND "reason" <> ''
    ORDER BY "target_id", "created_at" DESC, "id" DESC
  `;
}

import {
  type AdminModerationCursor,
  type AdminModerationListQuery,
  encodeAdminModerationCursor,
  parseAdminModerationCursor,
} from '@bidplace/contracts';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@bidplace/database';

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

function textContains(search: string): Prisma.StringFilter {
  return { contains: search, mode: 'insensitive' };
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
  const search = sellerSearchWhere(query.search);
  if (search) filters.push(search);
  const keyset = moderationKeysetWhere(cursor);
  if (keyset) filters.push(keyset);
  return { AND: filters };
}

function sellerSearchWhere(
  search: string | undefined,
): Prisma.SellerProfileWhereInput | undefined {
  if (!search) return undefined;
  const displayedText: Prisma.SellerProfileRevisionWhereInput = {
    OR: [
      { fullName: textContains(search) },
      { slug: textContains(search) },
      { discipline: textContains(search) },
    ],
  };
  return {
    OR: [
      { editingRevision: { is: displayedText } },
      {
        AND: [
          { editingRevisionId: null },
          {
            OR: [
              { fullName: textContains(search) },
              { slug: textContains(search) },
              { discipline: textContains(search) },
            ],
          },
        ],
      },
    ],
  };
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
  const search = productSearchWhere(query.search);
  if (search) filters.push(search);
  const keyset = moderationKeysetWhere(cursor);
  if (keyset) filters.push(keyset);
  return filters.length > 0 ? { AND: filters } : {};
}

function productSearchWhere(
  search: string | undefined,
): Prisma.ProductWhereInput | undefined {
  if (!search) return undefined;
  const title = textContains(search);
  return {
    OR: [
      { editingRevision: { is: { title } } },
      { AND: [{ editingRevisionId: null }, { title }] },
      { sellerProfile: { fullName: title } },
      { sellerProfile: { slug: title } },
    ],
  };
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

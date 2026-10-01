import { describe, expect, it } from 'vitest';

import {
  ADMIN_MODERATION_DEFAULT_LIMIT,
  ADMIN_MODERATION_MAX_LIMIT,
  adminModerationListQuerySchema,
  encodeAdminModerationCursor,
  type AdminModerationCursor,
} from '@bidplace/contracts';

import {
  isAfterModerationCursor,
  latestModerationReasonSql,
  moderationPage,
  productModerationSearchSql,
  productModerationWhere,
  sellerModerationSearchSql,
  sellerModerationWhere,
} from './admin-moderation-list';

const query = adminModerationListQuerySchema.parse({});

function row(id: string, createdAt: string) {
  return { id, createdAt: new Date(createdAt) };
}

function pagesOf(rows: Array<{ id: string; createdAt: Date }>, limit: number) {
  const sorted = [...rows].sort((left, right) => {
    const time = left.createdAt.getTime() - right.createdAt.getTime();
    if (time !== 0) return time;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
  const seen: string[] = [];
  let cursor: AdminModerationCursor | null = null;
  const pages: string[][] = [];
  for (;;) {
    const eligible = cursor
      ? sorted.filter((item) => isAfterModerationCursor(item, cursor!))
      : sorted;
    const taken = eligible.slice(0, limit + 1);
    const page = moderationPage(taken, limit);
    pages.push(page.page.map((item) => item.id));
    seen.push(...page.page.map((item) => item.id));
    if (!page.nextCursor) break;
    adminModerationListQuerySchema.parse({ cursor: page.nextCursor, limit });
    const last = page.page.at(-1);
    if (!last) break;
    cursor = { createdAt: last.createdAt.toISOString(), id: last.id };
  }
  return { pages, seen };
}

describe('admin moderation list queries', () => {
  it('walks empty, single, and tied-timestamp pages without skips or duplicates', () => {
    expect(pagesOf([], ADMIN_MODERATION_DEFAULT_LIMIT).pages).toEqual([[]]);

    const only = [
      row('00000000-0000-4000-8000-000000000001', '2026-09-26T12:00:00.000Z'),
    ];
    expect(pagesOf(only, 50)).toEqual({
      pages: [['00000000-0000-4000-8000-000000000001']],
      seen: ['00000000-0000-4000-8000-000000000001'],
    });

    const tied = [
      row('00000000-0000-4000-8000-00000000000b', '2026-09-26T12:00:00.000Z'),
      row('00000000-0000-4000-8000-00000000000a', '2026-09-26T12:00:00.000Z'),
      row('00000000-0000-4000-8000-00000000000c', '2026-09-26T12:00:00.000Z'),
      row('00000000-0000-4000-8000-00000000000d', '2026-09-27T12:00:00.000Z'),
    ];
    const walked = pagesOf(tied, 2);
    expect(walked.pages).toEqual([
      [
        '00000000-0000-4000-8000-00000000000a',
        '00000000-0000-4000-8000-00000000000b',
      ],
      [
        '00000000-0000-4000-8000-00000000000c',
        '00000000-0000-4000-8000-00000000000d',
      ],
    ]);
    expect(walked.seen).toEqual([
      '00000000-0000-4000-8000-00000000000a',
      '00000000-0000-4000-8000-00000000000b',
      '00000000-0000-4000-8000-00000000000c',
      '00000000-0000-4000-8000-00000000000d',
    ]);
    expect(new Set(walked.seen).size).toBe(tied.length);
  });

  it('uses the default and maximum page sizes and ends on an exact page', () => {
    expect(query.limit).toBe(ADMIN_MODERATION_DEFAULT_LIMIT);
    expect(
      adminModerationListQuerySchema.parse({
        limit: ADMIN_MODERATION_MAX_LIMIT,
      }).limit,
    ).toBe(100);
    const rows = Array.from({ length: 100 }, (_, index) =>
      row(
        `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        '2026-09-26T12:00:00.000Z',
      ),
    );
    const exact = moderationPage(rows, 100);
    expect(exact.page).toHaveLength(100);
    expect(exact.nextCursor).toBeNull();
    const more = moderationPage([...rows, rows[0]!], 100);
    expect(more.page).toHaveLength(100);
    expect(more.nextCursor).toEqual(expect.any(String));
  });

  it('keeps review status on the revision and visibility on the parent', () => {
    expect(sellerModerationWhere(query, null)).toEqual({
      AND: [{ status: { not: 'DRAFT' } }],
    });
    expect(
      sellerModerationWhere(
        adminModerationListQuerySchema.parse({ filter: 'APPROVED' }),
        null,
      ),
    ).toEqual({
      AND: [{ status: { not: 'DRAFT' } }, { status: 'APPROVED' }],
    });
    expect(
      sellerModerationWhere(
        adminModerationListQuerySchema.parse({ filter: 'PENDING_REVIEW' }),
        null,
      ),
    ).toEqual({
      AND: [
        { status: { not: 'DRAFT' } },
        {
          OR: [
            { editingRevision: { is: { status: 'PENDING_REVIEW' } } },
            {
              AND: [{ editingRevisionId: null }, { status: 'PENDING_REVIEW' }],
            },
          ],
        },
      ],
    });
    expect(
      productModerationWhere(
        adminModerationListQuerySchema.parse({ filter: 'PENDING_REVIEW' }),
        null,
      ),
    ).toEqual({
      AND: [{ editingRevision: { is: { status: 'PENDING_REVIEW' } } }],
    });
    expect(
      productModerationWhere(
        adminModerationListQuerySchema.parse({ filter: 'APPROVED' }),
        null,
      ),
    ).toEqual({ AND: [{ status: 'APPROVED' }] });
    expect(productModerationWhere(query, null)).toEqual({});
  });

  it('searches the joined display text with literal LIKE wildcards', () => {
    const sellers = adminModerationListQuerySchema.parse({
      search: 'Alpha%_\\ parent',
      filter: 'PENDING_REVIEW',
    });
    const sellerSql = sellerModerationSearchSql(sellers.search ?? '', sellers, {
      createdAt: '2026-09-26T12:00:00.000Z',
      id: '00000000-0000-4000-8000-000000000010',
    });
    const sellerText = sellerSql.strings.join(' ');
    expect(sellerText).toContain(
      `rev."full_name" || ' ' || rev."slug" || ' ' || COALESCE(rev."discipline", '')`,
    );
    expect(sellerText).toContain(
      `sp."full_name" || ' ' || sp."slug" || ' ' || COALESCE(sp."discipline", '')`,
    );
    expect(sellerText).toContain(`ILIKE`);
    expect(sellerText).toContain(`ESCAPE '\\'`);
    expect(sellerText).toContain('ORDER BY sp."created_at" ASC, sp."id" ASC');
    expect(sellerText).not.toContain('Alpha%');
    expect(sellerSql.values).toContain('%Alpha\\%\\_\\\\ parent%');
    expect(
      sellerModerationWhere(sellers, null).AND?.some((filter) =>
        JSON.stringify(filter).includes('contains'),
      ),
    ).toBe(false);

    const products = adminModerationListQuerySchema.parse({
      search: 'Vessel_title',
      filter: 'APPROVED',
    });
    const productSql = productModerationSearchSql(
      products.search ?? '',
      products,
      null,
    );
    const productText = productSql.strings.join(' ');
    expect(productText).toContain(`COALESCE(rev."title", '')`);
    expect(productText).toContain(
      `|| ' ' || sp."full_name" || ' ' || sp."slug"`,
    );
    expect(productText).toContain(`ESCAPE '\\'`);
    expect(productText).not.toContain('Vessel_title');
    expect(productSql.values).toContain('%Vessel\\_title%');
  });

  it('bounds the latest-reason query to the page targets', () => {
    const ids = [
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
    ];
    const sql = latestModerationReasonSql('SELLER_PROFILE', ids);
    expect(sql.strings.join(' ')).toContain('DISTINCT ON ("target_id")');
    expect(sql.strings.join(' ')).toContain('"reason" IS NOT NULL');
    expect(sql.strings.join(' ')).toContain('"reason" <> \'\'');
    expect(sql.strings.join(' ')).toContain(
      'ORDER BY "target_id", "created_at" DESC, "id" DESC',
    );
    expect(JSON.stringify(sql.values)).toContain(ids[0]);
    expect(JSON.stringify(sql.values)).toContain(ids[1]);
    expect(
      encodeAdminModerationCursor({
        createdAt: '2026-09-26T12:00:00.000Z',
        id: ids[0],
      }),
    ).toEqual(expect.any(String));
  });
});

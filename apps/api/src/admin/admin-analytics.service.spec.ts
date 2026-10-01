import { describe, expect, it, vi } from 'vitest';

import { AdminAnalyticsService } from './admin-analytics.service';
import { readSqlCount } from './admin-analytics.query';

const now = new Date('2026-08-20T15:00:00.000Z');
const sevenDayFrom = new Date('2026-08-13T15:00:00.000Z');

type SqlQuery = { strings: string[]; values: unknown[] };

function sqlText(query: SqlQuery): string {
  return query.strings.join(' ');
}

function emptyFindMany() {
  return vi.fn().mockResolvedValue([]);
}

function queryResult(query: SqlQuery): unknown[] {
  if (sqlText(query).includes('COUNT(DISTINCT')) {
    return [{ count: 0n }];
  }
  return [];
}

function createPrisma(
  queryRaw: (query: SqlQuery) => Promise<unknown> = async (query) =>
    queryResult(query),
) {
  return {
    user: {
      count: vi.fn().mockResolvedValue(0),
      findMany: emptyFindMany(),
    },
    sellerProfile: {
      count: vi.fn().mockResolvedValue(0),
      findMany: emptyFindMany(),
    },
    product: {
      count: vi.fn().mockResolvedValue(0),
      findMany: emptyFindMany(),
    },
    auditEvent: {
      count: vi.fn().mockResolvedValue(0),
    },
    analyticsEvent: {
      count: vi.fn().mockResolvedValue(0),
      findMany: emptyFindMany(),
    },
    acquisitionAttribution: {
      findMany: emptyFindMany(),
    },
    $queryRaw: vi.fn(queryRaw),
  };
}

describe('AdminAnalyticsService', () => {
  it('builds a 7d overview from aggregate rows', async () => {
    const prisma = createPrisma(async (query) => {
      const sql = sqlText(query);
      if (sql.includes('COUNT(DISTINCT')) {
        return [{ count: 2n }];
      }
      if (sql.includes('acquisition_attributions')) {
        return [
          { source: 'instagram', visitors: 1n, signups: 1n },
          { source: 'direct', visitors: 1n, signups: 0n },
        ];
      }
      if (sql.includes('"users"')) {
        return [{ date: '2026-08-15', count: 1n }];
      }
      return [];
    });
    prisma.user.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);
    prisma.sellerProfile.count.mockResolvedValue(3);
    prisma.product.count.mockResolvedValue(4);
    prisma.analyticsEvent.count.mockResolvedValue(7);
    const service = new AdminAnalyticsService(prisma as never);

    const overview = await service.buildOverview({ period: '7d' }, now);

    expect(overview.period).toBe('7d');
    expect(overview.from).toBe(sevenDayFrom.toISOString());
    expect(overview.to).toBe(now.toISOString());
    expect(overview.overview.users.value).toBe(10);
    expect(overview.overview.activeUsers.value).toBe(2);
    expect(overview.overview.activeUsers.definition).toBe(
      'Distinct User.id that emitted product analytics events in period',
    );
    expect(overview.overview.publishedWorks.value).toBe(4);
    expect(overview.acquisition.bySource).toEqual([
      { source: 'direct', visitors: 1, signups: 0 },
      { source: 'instagram', visitors: 1, signups: 1 },
    ]);
    expect(overview.acquisition.visitorToSignupRate).toBe(0.5);
    expect(overview.growth).toHaveLength(8);
    expect(overview.growth[0]).toEqual({
      date: '2026-08-13',
      newUsers: 0,
      listingViews: 0,
      newSellers: 0,
      newWorks: 0,
    });
    expect(overview.growth[2]).toEqual(
      expect.objectContaining({ date: '2026-08-15', newUsers: 1 }),
    );
    expect(prisma.analyticsEvent.findMany).not.toHaveBeenCalled();
    expect(prisma.acquisitionAttribution.findMany).not.toHaveBeenCalled();
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 8 }),
    );
    expect(prisma.sellerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 8 }),
    );
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 8 }),
    );

    const activeQuery = prisma.$queryRaw.mock.calls
      .map((call) => call[0] as SqlQuery)
      .find((query) => sqlText(query).includes('COUNT(DISTINCT'));
    expect(activeQuery?.values).toEqual([sevenDayFrom, now]);
    expect(sqlText(activeQuery!)).not.toContain('2026-08-13');
    expect(sqlText(activeQuery!)).toContain("::timestamptz AT TIME ZONE 'UTC'");
    expect(sqlText(activeQuery!)).not.toContain('created_at" AT TIME ZONE');
    expect(prisma.product.count).toHaveBeenCalledWith({
      where: {
        status: 'PENDING_REVIEW',
        updatedAt: { lt: new Date('2026-08-13T15:00:00.000Z') },
      },
    });
    expect(prisma.sellerProfile.count).toHaveBeenCalledWith({
      where: {
        status: 'PENDING_REVIEW',
        updatedAt: { lt: new Date('2026-08-13T15:00:00.000Z') },
      },
    });
  });

  it('fills every UTC bucket for today, 30d, 90d, and custom ranges', async () => {
    const prisma = createPrisma();
    const service = new AdminAnalyticsService(prisma as never);

    const today = await service.buildOverview({ period: 'today' }, now);
    expect(today.from).toBe('2026-08-20T00:00:00.000Z');
    expect(today.to).toBe(now.toISOString());
    expect(today.growth.map((row) => row.date)).toEqual(['2026-08-20']);

    const thirty = await service.buildOverview({ period: '30d' }, now);
    expect(thirty.from).toBe('2026-07-21T15:00:00.000Z');
    expect(thirty.growth).toHaveLength(31);
    expect(thirty.growth[0]?.date).toBe('2026-07-21');
    expect(thirty.growth.at(-1)?.date).toBe('2026-08-20');
    expect(thirty.growth.every((row) => row.newUsers === 0)).toBe(true);

    const ninety = await service.buildOverview({ period: '90d' }, now);
    expect(ninety.from).toBe('2026-05-22T15:00:00.000Z');
    expect(ninety.growth).toHaveLength(91);
    expect(ninety.growth[0]?.date).toBe('2026-05-22');
    expect(ninety.growth.at(-1)?.date).toBe('2026-08-20');

    const custom = await service.buildOverview(
      {
        period: 'custom',
        from: '2026-08-13T23:00:00.000Z',
        to: '2026-08-14T01:00:00.000Z',
      },
      now,
    );
    expect(custom.growth.map((row) => row.date)).toEqual([
      '2026-08-13',
      '2026-08-14',
    ]);

    const reversed = await service.buildOverview(
      {
        period: 'custom',
        from: '2026-08-21T00:00:00.000Z',
        to: '2026-08-20T00:00:00.000Z',
      },
      now,
    );
    expect(reversed.growth).toEqual([]);
  });

  it('keeps a zero rate and a null rate distinct', async () => {
    const prisma = createPrisma(async (query) => {
      if (sqlText(query).includes('acquisition_attributions')) {
        return [{ source: 'direct', visitors: 2n, signups: 0n }];
      }
      return queryResult(query);
    });
    const service = new AdminAnalyticsService(prisma as never);

    const withVisitors = await service.buildOverview({ period: '7d' }, now);
    expect(withVisitors.acquisition.visitorToSignupRate).toBe(0);

    prisma.$queryRaw.mockImplementation(async (query: SqlQuery) =>
      queryResult(query),
    );
    const empty = await service.buildOverview({ period: '7d' }, now);
    expect(empty.acquisition.bySource).toEqual([]);
    expect(empty.acquisition.visitorToSignupRate).toBeNull();
  });

  it('sorts equal visitor counts by source and keeps an empty source', async () => {
    const prisma = createPrisma(async (query) => {
      if (!sqlText(query).includes('acquisition_attributions')) {
        return queryResult(query);
      }
      return [
        { source: 'zoo', visitors: 2n, signups: 0n },
        { source: '', visitors: 1n, signups: 0n },
        { source: 'direct', visitors: 1n, signups: 1n },
      ];
    });
    const service = new AdminAnalyticsService(prisma as never);

    const overview = await service.buildOverview({ period: '7d' }, now);

    expect(overview.acquisition.bySource).toEqual([
      { source: 'zoo', visitors: 2, signups: 0 },
      { source: '', visitors: 1, signups: 0 },
      { source: 'direct', visitors: 1, signups: 1 },
    ]);
  });

  it('rejects an aggregate count that is not a safe integer', async () => {
    const prisma = createPrisma(async () => [{ count: 9007199254740993n }]);
    const service = new AdminAnalyticsService(prisma as never);

    await expect(service.buildOverview({ period: '7d' }, now)).rejects.toThrow(
      'Analytics aggregate count is outside the safe integer range',
    );
    expect(readSqlCount(0n)).toBe(0);
    expect(() => readSqlCount(-1n)).toThrow(/safe integer/);
    expect(() => readSqlCount(1.5)).toThrow(/safe integer/);
  });

  it('returns drilldown rows when requested', async () => {
    const prisma = createPrisma();
    prisma.user.findMany.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        displayName: 'Ada',
        createdAt: new Date('2026-08-19T12:00:00.000Z'),
      },
    ]);
    const service = new AdminAnalyticsService(prisma as never);

    const overview = await service.buildOverview(
      { period: '7d', drilldown: 'new_users' },
      now,
    );

    expect(overview.drilldown).toEqual([
      {
        id: '11111111-1111-4111-8111-111111111111',
        label: 'Ada',
        meta: '2026-08-19T12:00:00.000Z',
      },
    ]);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });
});

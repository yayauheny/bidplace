import { describe, expect, it, vi } from 'vitest';

import { AdminAnalyticsService } from './admin-analytics.service';

const now = new Date('2026-08-20T15:00:00.000Z');

function emptyFindMany() {
  return vi.fn().mockResolvedValue([]);
}

function createPrisma(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      count: vi.fn().mockResolvedValue(10),
      findMany: emptyFindMany(),
    },
    sellerProfile: {
      count: vi.fn().mockResolvedValue(3),
      findMany: emptyFindMany(),
    },
    listing: {
      count: vi.fn().mockResolvedValue(2),
      findMany: emptyFindMany(),
    },
    bid: {
      count: vi.fn().mockResolvedValue(5),
      findMany: emptyFindMany(),
    },
    order: {
      count: vi.fn().mockResolvedValue(1),
      findMany: emptyFindMany(),
    },
    product: {
      count: vi.fn().mockResolvedValue(4),
      findMany: emptyFindMany(),
    },
    auditEvent: {
      count: vi.fn().mockResolvedValue(2),
    },
    analyticsEvent: {
      count: vi.fn().mockResolvedValue(7),
      findMany: emptyFindMany(),
    },
    acquisitionAttribution: {
      findMany: emptyFindMany(),
    },
    ...overrides,
  };
}

describe('AdminAnalyticsService', () => {
  it('builds a 7d overview with UTC period bounds', async () => {
    const prisma = createPrisma({
      analyticsEvent: {
        count: vi.fn().mockResolvedValue(7),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
          .mockResolvedValue([]),
      },
      listing: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            { bidCount: 0 },
            { bidCount: 3 },
            { bidCount: 1 },
          ])
          .mockResolvedValue([]),
      },
      acquisitionAttribution: {
        findMany: vi.fn().mockResolvedValue([
          {
            source: 'instagram',
            userId: 'u1',
            linkedAt: new Date('2026-08-18T10:00:00.000Z'),
          },
          {
            source: null,
            userId: null,
            linkedAt: null,
          },
        ]),
      },
    });
    const service = new AdminAnalyticsService(prisma as never);

    const overview = await service.buildOverview({ period: '7d' }, now);

    expect(overview.period).toBe('7d');
    expect(overview.from).toBe('2026-08-13T15:00:00.000Z');
    expect(overview.to).toBe(now.toISOString());
    expect(overview.overview.users.value).toBe(10);
    expect(overview.overview.activeUsers.value).toBe(2);
    expect(overview.marketplace.auctionsWithZeroBids.value).toBe(1);
    expect(overview.marketplace.auctionsWithBids.value).toBe(2);
    expect(overview.marketplace.averageBidsPerEndedAuction).toBeCloseTo(
      4 / 3,
    );
    expect(overview.acquisition.bySource).toEqual([
      { source: 'instagram', visitors: 1, signups: 1 },
      { source: 'direct', visitors: 1, signups: 0 },
    ]);
    expect(overview.acquisition.visitorToSignupRate).toBe(0.5);
    expect(overview.growth).toHaveLength(8);
  });

  it('uses start of UTC day for today period', async () => {
    const prisma = createPrisma();
    const service = new AdminAnalyticsService(prisma as never);

    const overview = await service.buildOverview({ period: 'today' }, now);

    expect(overview.from).toBe('2026-08-20T00:00:00.000Z');
    expect(overview.to).toBe(now.toISOString());
  });

  it('returns drilldown rows when requested', async () => {
    const prisma = createPrisma({
      listing: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              id: 'listing-1',
              closedAt: new Date('2026-08-19T12:00:00.000Z'),
              product: { publicId: 'P1', title: 'Work' },
            },
          ]),
      },
    });
    const service = new AdminAnalyticsService(prisma as never);

    const overview = await service.buildOverview(
      { period: '7d', drilldown: 'auctions_without_bids' },
      now,
    );

    expect(overview.drilldown).toEqual([
      {
        id: 'listing-1',
        label: 'Work',
        meta: '2026-08-19T12:00:00.000Z',
        href: '/products/P1',
      },
    ]);
  });
});

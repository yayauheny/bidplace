import {
  type AdminAnalyticsOverview,
  type AdminAnalyticsQuery,
  adminAnalyticsOverviewSchema,
} from '@bidplace/contracts';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../core/database';
import {
  acquisitionBySourceSql,
  countActiveUsersSql,
  listingViewDaySql,
  publishedWorkDaySql,
  readSqlCount,
  sellerCreationDaySql,
  userCreationDaySql,
  type DayCountRow,
  type SourceCountRow,
} from './admin-analytics.query';

const DAY_MS = 86_400_000;
const STUCK_REVIEW_MS = 7 * DAY_MS;

type MetricSource = 'postgresql' | 'analytics';

function metric(
  value: number,
  definition: string,
  source: MetricSource,
): AdminAnalyticsOverview['overview']['users'] {
  return { value, definition, source };
}

function resolvePeriodRange(
  query: AdminAnalyticsQuery,
  now: Date,
): { from: Date; to: Date } {
  switch (query.period) {
    case 'today':
      return {
        from: new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        ),
        to: now,
      };
    case '7d':
      return { from: new Date(now.getTime() - 7 * DAY_MS), to: now };
    case '30d':
      return { from: new Date(now.getTime() - 30 * DAY_MS), to: now };
    case '90d':
      return { from: new Date(now.getTime() - 90 * DAY_MS), to: now };
    case 'custom':
      return {
        from: new Date(query.from as string),
        to: new Date(query.to as string),
      };
  }
}

function eachUtcDate(from: Date, to: Date): string[] {
  const dates: string[] = [];
  let cursor = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());

  while (cursor <= end) {
    dates.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += DAY_MS;
  }

  return dates;
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

function dayCountMap(rows: DayCountRow[]): Map<string, number> {
  return new Map(rows.map((row) => [row.date, readSqlCount(row.count)]));
}

function compareSources(
  left: { source: string; visitors: number },
  right: { source: string; visitors: number },
): number {
  if (left.visitors !== right.visitors) {
    return right.visitors - left.visitors;
  }
  if (left.source < right.source) {
    return -1;
  }
  if (left.source > right.source) {
    return 1;
  }
  return 0;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async buildOverview(
    query: AdminAnalyticsQuery,
    now: Date,
  ): Promise<AdminAnalyticsOverview> {
    const { from, to } = resolvePeriodRange(query, now);
    const periodFilter = { gte: from, lte: to };
    const stuckBefore = new Date(now.getTime() - STUCK_REVIEW_MS);

    const [
      users,
      newUsers,
      activeUserRows,
      creators,
      publishedWorks,
      attributionRows,
      listingViewed,
      sellerProfilesCreated,
      productsCreated,
      productsApproved,
      recentUsers,
      recentCreators,
      recentWorks,
      stuckProducts,
      stuckSellers,
      userDays,
      viewDays,
      sellerDays,
      workDays,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: periodFilter } }),
      this.prisma.$queryRaw<Array<{ count: number | bigint }>>(
        countActiveUsersSql(from, to),
      ),
      this.prisma.sellerProfile.count(),
      this.prisma.product.count({
        where: {
          status: 'APPROVED',
          publishedRevisionId: { not: null },
        },
      }),
      this.prisma.$queryRaw<SourceCountRow[]>(acquisitionBySourceSql(from, to)),
      this.prisma.analyticsEvent.count({
        where: { eventName: 'listing_viewed', createdAt: periodFilter },
      }),
      this.prisma.sellerProfile.count({
        where: { createdAt: periodFilter },
      }),
      this.prisma.product.count({ where: { createdAt: periodFilter } }),
      this.prisma.auditEvent.count({
        where: {
          targetType: 'PRODUCT',
          newStatus: 'APPROVED',
          createdAt: periodFilter,
        },
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, displayName: true, createdAt: true },
      }),
      this.prisma.sellerProfile.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          fullName: true,
          slug: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.product.findMany({
        where: { publishedAt: { not: null } },
        orderBy: { publishedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          publicId: true,
          title: true,
          publishedAt: true,
        },
      }),
      this.prisma.product.count({
        where: {
          status: 'PENDING_REVIEW',
          updatedAt: { lt: stuckBefore },
        },
      }),
      this.prisma.sellerProfile.count({
        where: {
          status: 'PENDING_REVIEW',
          updatedAt: { lt: stuckBefore },
        },
      }),
      this.prisma.$queryRaw<DayCountRow[]>(userCreationDaySql(from, to)),
      this.prisma.$queryRaw<DayCountRow[]>(listingViewDaySql(from, to)),
      this.prisma.$queryRaw<DayCountRow[]>(sellerCreationDaySql(from, to)),
      this.prisma.$queryRaw<DayCountRow[]>(publishedWorkDaySql(from, to)),
    ]);

    const bySource = attributionRows
      .map((row) => ({
        source: row.source,
        visitors: readSqlCount(row.visitors),
        signups: readSqlCount(row.signups),
      }))
      .sort(compareSources);
    const totalVisitors = bySource.reduce((sum, row) => sum + row.visitors, 0);
    const totalSignups = bySource.reduce((sum, row) => sum + row.signups, 0);
    const usersByDay = dayCountMap(userDays);
    const viewsByDay = dayCountMap(viewDays);
    const sellersByDay = dayCountMap(sellerDays);
    const worksByDay = dayCountMap(workDays);
    const growthDates = eachUtcDate(from, to);

    const overview: AdminAnalyticsOverview = {
      period: query.period,
      from: from.toISOString(),
      to: to.toISOString(),
      overview: {
        users: metric(users, 'Total User count all time', 'postgresql'),
        newUsers: metric(newUsers, 'Users created in period', 'postgresql'),
        activeUsers: metric(
          readSqlCount(activeUserRows[0]?.count),
          'Distinct User.id that emitted product analytics events in period',
          'analytics',
        ),
        creators: metric(
          creators,
          'Total SellerProfile count all time',
          'postgresql',
        ),
        publishedWorks: metric(
          publishedWorks,
          'Approved Products with a published revision',
          'postgresql',
        ),
      },
      acquisition: {
        bySource,
        visitorToSignupRate: rate(totalSignups, totalVisitors),
      },
      audience: {
        listingViewed: metric(
          listingViewed,
          'listing_viewed analytics events in period',
          'analytics',
        ),
      },
      sellerFunnel: {
        registeredUsers: metric(newUsers, 'New users in period', 'postgresql'),
        sellerProfiles: metric(
          sellerProfilesCreated,
          'SellerProfile created in period',
          'postgresql',
        ),
        productsCreated: metric(
          productsCreated,
          'Product created in period',
          'postgresql',
        ),
        productsApproved: metric(
          productsApproved,
          'AuditEvent PRODUCT newStatus APPROVED in period',
          'postgresql',
        ),
      },
      growth: growthDates.map((date) => ({
        date,
        newUsers: usersByDay.get(date) ?? 0,
        listingViews: viewsByDay.get(date) ?? 0,
        newSellers: sellersByDay.get(date) ?? 0,
        newWorks: worksByDay.get(date) ?? 0,
      })),
      recent: {
        users: recentUsers.map((user) => ({
          id: user.id,
          displayName: user.displayName,
          createdAt: user.createdAt.toISOString(),
        })),
        creators: recentCreators.map((creator) => ({
          id: creator.id,
          fullName: creator.fullName,
          slug: creator.slug,
          status: creator.status,
          createdAt: creator.createdAt.toISOString(),
        })),
        works: recentWorks.map((work) => ({
          id: work.id,
          publicId: work.publicId,
          title: work.title,
          publishedAt: work.publishedAt?.toISOString() ?? null,
        })),
      },
      attention: {
        stuckProducts,
        stuckSellers,
      },
    };

    if (query.drilldown) {
      overview.drilldown = await this.buildDrilldown(
        query.drilldown,
        from,
        to,
        stuckBefore,
      );
    }

    return adminAnalyticsOverviewSchema.parse(overview);
  }

  private async buildDrilldown(
    drilldown: NonNullable<AdminAnalyticsQuery['drilldown']>,
    from: Date,
    to: Date,
    stuckBefore: Date,
  ): Promise<NonNullable<AdminAnalyticsOverview['drilldown']>> {
    const periodFilter = { gte: from, lte: to };

    switch (drilldown) {
      case 'new_users': {
        const rows = await this.prisma.user.findMany({
          where: { createdAt: periodFilter },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, displayName: true, createdAt: true },
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.displayName,
          meta: row.createdAt.toISOString(),
        }));
      }
      case 'new_creators': {
        const rows = await this.prisma.sellerProfile.findMany({
          where: { createdAt: periodFilter },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            fullName: true,
            slug: true,
            createdAt: true,
          },
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.fullName,
          meta: row.createdAt.toISOString(),
          href: `/authors/${row.slug}`,
        }));
      }
      case 'recent_works': {
        const rows = await this.prisma.product.findMany({
          where: { publishedAt: periodFilter },
          orderBy: { publishedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            publicId: true,
            title: true,
            publishedAt: true,
          },
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.title ?? row.publicId,
          meta: row.publishedAt?.toISOString(),
          href: `/works/${row.publicId}`,
        }));
      }
      case 'stuck_products': {
        const rows = await this.prisma.product.findMany({
          where: {
            status: 'PENDING_REVIEW',
            updatedAt: { lt: stuckBefore },
          },
          orderBy: { updatedAt: 'asc' },
          take: 50,
          select: {
            id: true,
            publicId: true,
            title: true,
            updatedAt: true,
          },
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.title ?? row.publicId,
          meta: row.updatedAt.toISOString(),
          href: `/admin/products`,
        }));
      }
      case 'stuck_sellers': {
        const rows = await this.prisma.sellerProfile.findMany({
          where: {
            status: 'PENDING_REVIEW',
            updatedAt: { lt: stuckBefore },
          },
          orderBy: { updatedAt: 'asc' },
          take: 50,
          select: {
            id: true,
            fullName: true,
            slug: true,
            updatedAt: true,
          },
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.fullName,
          meta: row.updatedAt.toISOString(),
          href: `/authors/${row.slug}`,
        }));
      }
    }
  }
}

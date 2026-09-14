import {
  type AdminAnalyticsOverview,
  type AdminAnalyticsQuery,
  adminAnalyticsOverviewSchema,
} from '@bidplace/contracts';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../core/database';

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

function utcDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
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
      activeUsers,
      creators,
      publishedWorks,
      attributions,
      listingViewed,
      sellerProfilesCreated,
      productsCreated,
      productsApproved,
      recentUsers,
      recentCreators,
      recentWorks,
      stuckProducts,
      stuckSellers,
      growthUsers,
      growthViews,
      growthSellers,
      growthWorks,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: periodFilter } }),
      this.prisma.analyticsEvent.findMany({
        where: {
          createdAt: periodFilter,
          userId: { not: null },
        },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.sellerProfile.count(),
      this.prisma.product.count({
        where: {
          status: 'APPROVED',
          publishedRevisionId: { not: null },
        },
      }),
      this.prisma.acquisitionAttribution.findMany({
        where: { capturedAt: periodFilter },
        select: {
          source: true,
          userId: true,
          linkedAt: true,
        },
      }),
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
      this.prisma.user.findMany({
        where: { createdAt: periodFilter },
        select: { createdAt: true },
      }),
      this.prisma.analyticsEvent.findMany({
        where: { eventName: 'listing_viewed', createdAt: periodFilter },
        select: { createdAt: true },
      }),
      this.prisma.sellerProfile.findMany({
        where: { createdAt: periodFilter },
        select: { createdAt: true },
      }),
      this.prisma.product.findMany({
        where: { publishedAt: periodFilter },
        select: { publishedAt: true },
      }),
    ]);

    const acquisitionBySource = new Map<
      string,
      { visitors: number; signups: number }
    >();

    for (const row of attributions) {
      const source = row.source ?? 'direct';
      const bucket = acquisitionBySource.get(source) ?? {
        visitors: 0,
        signups: 0,
      };
      bucket.visitors += 1;
      if (
        row.userId &&
        row.linkedAt &&
        row.linkedAt >= from &&
        row.linkedAt <= to
      ) {
        bucket.signups += 1;
      }
      acquisitionBySource.set(source, bucket);
    }

    const bySource = [...acquisitionBySource.entries()]
      .map(([source, counts]) => ({
        source,
        visitors: counts.visitors,
        signups: counts.signups,
      }))
      .sort((left, right) => right.visitors - left.visitors);
    const totalVisitors = bySource.reduce((sum, row) => sum + row.visitors, 0);
    const totalSignups = bySource.reduce((sum, row) => sum + row.signups, 0);

    const growthDates = eachUtcDate(from, to);
    const growthMap = new Map(
      growthDates.map((date) => [
        date,
        {
          date,
          newUsers: 0,
          listingViews: 0,
          newSellers: 0,
          newWorks: 0,
        },
      ]),
    );

    const bump = (
      rows: Array<{ createdAt?: Date; publishedAt?: Date | null }>,
      key: 'newUsers' | 'listingViews' | 'newSellers' | 'newWorks',
      field: 'createdAt' | 'publishedAt' = 'createdAt',
    ) => {
      for (const row of rows) {
        const value = row[field];
        if (!value) {
          continue;
        }
        const bucket = growthMap.get(utcDateKey(value));
        if (bucket) {
          bucket[key] += 1;
        }
      }
    };

    bump(growthUsers, 'newUsers');
    bump(growthViews, 'listingViews');
    bump(growthSellers, 'newSellers');
    bump(growthWorks, 'newWorks', 'publishedAt');

    const overview: AdminAnalyticsOverview = {
      period: query.period,
      from: from.toISOString(),
      to: to.toISOString(),
      overview: {
        users: metric(users, 'Total User count all time', 'postgresql'),
        newUsers: metric(newUsers, 'Users created in period', 'postgresql'),
        activeUsers: metric(
          activeUsers.length,
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
        registeredUsers: metric(
          newUsers,
          'New users in period',
          'postgresql',
        ),
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
      growth: growthDates.map((date) => growthMap.get(date)!),
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

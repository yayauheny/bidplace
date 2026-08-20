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

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }

  return sorted[mid]!;
}

function moneyString(value: { toFixed(digits: number): string }): string {
  return value.toFixed(2);
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
      liveAuctions,
      bids,
      endedAuctions,
      successfulAuctions,
      attributions,
      listingViewed,
      bidCtaClicked,
      bidRejectedEvents,
      sellerProfilesCreated,
      productsCreated,
      productsApproved,
      auctionsStarted,
      endedInPeriod,
      uniqueBidders,
      activeSellerRows,
      firstBidListings,
      recentUsers,
      recentCreators,
      recentListings,
      recentBids,
      recentEnded,
      recentOrders,
      staleLiveListings,
      stuckProducts,
      stuckSellers,
      growthUsers,
      growthViews,
      growthSellers,
      growthListings,
      growthBids,
      growthOrders,
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
      this.prisma.listing.count({ where: { status: 'LIVE' } }),
      this.prisma.bid.count({ where: { createdAt: periodFilter } }),
      this.prisma.listing.count({
        where: { status: 'ENDED', closedAt: periodFilter },
      }),
      this.prisma.order.count({ where: { createdAt: periodFilter } }),
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
      this.prisma.analyticsEvent.count({
        where: { eventName: 'bid_cta_clicked', createdAt: periodFilter },
      }),
      this.prisma.analyticsEvent.count({
        where: { eventName: 'bid_rejected', createdAt: periodFilter },
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
      this.prisma.listing.count({
        where: {
          startsAt: periodFilter,
          status: { not: 'DRAFT' },
        },
      }),
      this.prisma.listing.findMany({
        where: { status: 'ENDED', closedAt: periodFilter },
        select: { bidCount: true },
      }),
      this.prisma.bid.findMany({
        where: { createdAt: periodFilter },
        distinct: ['bidderUserId'],
        select: { bidderUserId: true },
      }),
      this.prisma.listing.findMany({
        where: {
          OR: [
            {
              status: { in: ['LIVE', 'ENDED', 'CANCELLED'] },
              startsAt: periodFilter,
            },
            { bids: { some: { createdAt: periodFilter } } },
          ],
        },
        select: {
          product: { select: { sellerProfileId: true } },
        },
      }),
      this.prisma.listing.findMany({
        where: {
          status: { in: ['LIVE', 'ENDED'] },
          bidCount: { gt: 0 },
          OR: [
            { startsAt: periodFilter },
            { bids: { some: { createdAt: periodFilter } } },
          ],
        },
        select: {
          startsAt: true,
          bids: {
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { createdAt: true },
          },
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
      this.prisma.listing.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          status: true,
          createdAt: true,
          product: { select: { publicId: true, title: true } },
        },
      }),
      this.prisma.bid.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          listingId: true,
          amount: true,
          createdAt: true,
        },
      }),
      this.prisma.listing.findMany({
        where: { status: 'ENDED' },
        orderBy: { closedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          bidCount: true,
          closedAt: true,
          product: { select: { publicId: true, title: true } },
        },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          publicId: true,
          status: true,
          finalAmount: true,
          createdAt: true,
        },
      }),
      this.prisma.listing.count({
        where: { status: 'LIVE', endsAt: { lt: now } },
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
      this.prisma.listing.findMany({
        where: { createdAt: periodFilter },
        select: { createdAt: true },
      }),
      this.prisma.bid.findMany({
        where: { createdAt: periodFilter },
        select: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: periodFilter },
        select: { createdAt: true },
      }),
    ]);

    const auctionsWithBids = endedInPeriod.filter(
      (listing) => listing.bidCount > 0,
    ).length;
    const auctionsWithZeroBids = endedInPeriod.length - auctionsWithBids;
    const totalEndedBids = endedInPeriod.reduce(
      (sum, listing) => sum + listing.bidCount,
      0,
    );
    const uniqueActiveSellers = new Set(
      activeSellerRows.map((row) => row.product.sellerProfileId),
    ).size;
    const medianSecondsToFirstBid = median(
      firstBidListings
        .map((listing) => {
          const firstBid = listing.bids[0];
          if (!firstBid) {
            return null;
          }

          return Math.max(
            0,
            (firstBid.createdAt.getTime() - listing.startsAt.getTime()) / 1000,
          );
        })
        .filter((value): value is number => value !== null),
    );

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
    const totalVisitors = bySource.reduce(
      (sum, row) => sum + row.visitors,
      0,
    );
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
          newListings: 0,
          bids: 0,
          orders: 0,
        },
      ]),
    );

    const bump = (
      rows: Array<{ createdAt: Date }>,
      key:
        | 'newUsers'
        | 'listingViews'
        | 'newSellers'
        | 'newListings'
        | 'bids'
        | 'orders',
    ) => {
      for (const row of rows) {
        const bucket = growthMap.get(utcDateKey(row.createdAt));
        if (bucket) {
          bucket[key] += 1;
        }
      }
    };

    bump(growthUsers, 'newUsers');
    bump(growthViews, 'listingViews');
    bump(growthSellers, 'newSellers');
    bump(growthListings, 'newListings');
    bump(growthBids, 'bids');
    bump(growthOrders, 'orders');

    const overview: AdminAnalyticsOverview = {
      period: query.period,
      from: from.toISOString(),
      to: to.toISOString(),
      overview: {
        users: metric(users, 'Total User count all time', 'postgresql'),
        newUsers: metric(
          newUsers,
          'Users created in period',
          'postgresql',
        ),
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
        liveAuctions: metric(
          liveAuctions,
          'Listings with status LIVE now',
          'postgresql',
        ),
        bids: metric(bids, 'Bid count in period', 'postgresql'),
        endedAuctions: metric(
          endedAuctions,
          'Listings ENDED with closedAt in period',
          'postgresql',
        ),
        successfulAuctions: metric(
          successfulAuctions,
          'Orders created in period (successful auction close with winner)',
          'postgresql',
        ),
      },
      acquisition: {
        bySource,
        visitorToSignupRate: rate(totalSignups, totalVisitors),
      },
      buyerFunnel: {
        listingViewed: metric(
          listingViewed,
          'listing_viewed analytics events in period',
          'analytics',
        ),
        bidCtaClicked: metric(
          bidCtaClicked,
          'bid_cta_clicked analytics events in period',
          'analytics',
        ),
        bidAccepted: metric(bids, 'Bid count in period', 'postgresql'),
        winners: metric(
          successfulAuctions,
          'Order count in period',
          'postgresql',
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
        auctionsStarted: metric(
          auctionsStarted,
          'Listings with startsAt in period and status != DRAFT',
          'postgresql',
        ),
        auctionsWithBids: metric(
          auctionsWithBids,
          'Ended listings in period with bidCount > 0',
          'postgresql',
        ),
        auctionsSold: metric(
          successfulAuctions,
          'Orders created in period',
          'postgresql',
        ),
      },
      marketplace: {
        liveAuctions: metric(
          liveAuctions,
          'Listings with status LIVE now',
          'postgresql',
        ),
        auctionsStarted: metric(
          auctionsStarted,
          'Listings with startsAt in period and status != DRAFT',
          'postgresql',
        ),
        auctionsEnded: metric(
          endedAuctions,
          'Listings ENDED with closedAt in period',
          'postgresql',
        ),
        auctionsWithZeroBids: metric(
          auctionsWithZeroBids,
          'Ended listings in period with zero bids',
          'postgresql',
        ),
        auctionsWithBids: metric(
          auctionsWithBids,
          'Ended listings in period with bids',
          'postgresql',
        ),
        averageBidsPerEndedAuction:
          endedInPeriod.length === 0
            ? null
            : totalEndedBids / endedInPeriod.length,
        uniqueBidders: metric(
          uniqueBidders.length,
          'Distinct bidderUserId on bids in period',
          'postgresql',
        ),
        uniqueActiveSellers: metric(
          uniqueActiveSellers,
          'Distinct seller profiles with listings that received bids or went live in period',
          'postgresql',
        ),
        medianSecondsToFirstBid,
        auctionsReceivingBidRate: rate(auctionsWithBids, endedInPeriod.length),
        auctionsSoldRate: rate(successfulAuctions, endedInPeriod.length),
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
        listings: recentListings.map((listing) => ({
          id: listing.id,
          productPublicId: listing.product.publicId,
          productTitle: listing.product.title,
          status: listing.status,
          createdAt: listing.createdAt.toISOString(),
        })),
        bids: recentBids.map((bid) => ({
          id: bid.id,
          listingId: bid.listingId,
          amount: moneyString(bid.amount),
          createdAt: bid.createdAt.toISOString(),
        })),
        endedAuctions: recentEnded.map((listing) => ({
          id: listing.id,
          productPublicId: listing.product.publicId,
          productTitle: listing.product.title,
          bidCount: listing.bidCount,
          closedAt: listing.closedAt?.toISOString() ?? null,
        })),
        orders: recentOrders.map((order) => ({
          publicId: order.publicId,
          status: order.status,
          finalAmount: moneyString(order.finalAmount),
          createdAt: order.createdAt.toISOString(),
        })),
      },
      attention: {
        staleLiveListings,
        stuckProducts,
        stuckSellers,
        bidRejectedEvents,
      },
    };

    if (query.drilldown) {
      overview.drilldown = await this.buildDrilldown(
        query.drilldown,
        from,
        to,
        now,
        stuckBefore,
      );
    }

    return adminAnalyticsOverviewSchema.parse(overview);
  }

  private async buildDrilldown(
    drilldown: NonNullable<AdminAnalyticsQuery['drilldown']>,
    from: Date,
    to: Date,
    now: Date,
    stuckBefore: Date,
  ): Promise<NonNullable<AdminAnalyticsOverview['drilldown']>> {
    const periodFilter = { gte: from, lte: to };

    switch (drilldown) {
      case 'auctions_without_bids': {
        const rows = await this.prisma.listing.findMany({
          where: {
            status: 'ENDED',
            closedAt: periodFilter,
            bidCount: 0,
          },
          orderBy: { closedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            closedAt: true,
            product: { select: { publicId: true, title: true } },
          },
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.product.title ?? row.product.publicId,
          meta: row.closedAt?.toISOString(),
          href: `/products/${row.product.publicId}`,
        }));
      }
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
          href: `/sellers/${row.slug}`,
        }));
      }
      case 'recent_bids': {
        const rows = await this.prisma.bid.findMany({
          where: { createdAt: periodFilter },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            amount: true,
            createdAt: true,
            listingId: true,
          },
        });

        return rows.map((row) => ({
          id: row.id,
          label: moneyString(row.amount),
          meta: row.createdAt.toISOString(),
          href: `/admin/listings/${row.listingId}/bids`,
        }));
      }
      case 'recent_orders': {
        const rows = await this.prisma.order.findMany({
          where: { createdAt: periodFilter },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            publicId: true,
            finalAmount: true,
            createdAt: true,
            status: true,
          },
        });

        return rows.map((row) => ({
          id: row.publicId,
          label: `${row.publicId} · ${moneyString(row.finalAmount)}`,
          meta: `${row.status} · ${row.createdAt.toISOString()}`,
        }));
      }
      case 'bid_rejected': {
        const rows = await this.prisma.analyticsEvent.findMany({
          where: { eventName: 'bid_rejected', createdAt: periodFilter },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, properties: true, createdAt: true },
        });

        return rows.map((row) => {
          const properties =
            row.properties &&
            typeof row.properties === 'object' &&
            !Array.isArray(row.properties)
              ? (row.properties as Record<string, unknown>)
              : {};
          const errorCode =
            typeof properties.errorCode === 'string'
              ? properties.errorCode
              : 'bid_rejected';

          return {
            id: row.id,
            label: errorCode,
            meta: row.createdAt.toISOString(),
          };
        });
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
          href: `/sellers/${row.slug}`,
        }));
      }
      case 'stale_live_listings': {
        const rows = await this.prisma.listing.findMany({
          where: { status: 'LIVE', endsAt: { lt: now } },
          orderBy: { endsAt: 'asc' },
          take: 50,
          select: {
            id: true,
            endsAt: true,
            product: { select: { publicId: true, title: true } },
          },
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.product.title ?? row.product.publicId,
          meta: row.endsAt.toISOString(),
          href: `/products/${row.product.publicId}`,
        }));
      }
    }
  }
}

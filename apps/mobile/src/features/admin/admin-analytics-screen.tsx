import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';
import { View } from 'react-native';

import type {
  AdminAnalyticsOverview,
  AdminAnalyticsQuery,
} from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { FormPageShell } from '../../components/layout';
import {
  AppText,
  FormSection,
  MotionPressable,
  PageHeader,
  PageState,
  SecondaryButton,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

type PeriodOption = Exclude<AdminAnalyticsQuery['period'], 'custom'>;
type Drilldown = NonNullable<AdminAnalyticsQuery['drilldown']>;

const periodOptions: Array<{ value: PeriodOption; label: string }> = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
];

function MetricCard({
  label,
  value,
  definition,
  onPress,
}: {
  label: string;
  value: number | string;
  definition: string;
  onPress?: () => void;
}) {
  const content = (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 160,
        minWidth: 140,
        maxWidth: 220,
        gap: designTokens.space.x1,
        padding: designTokens.space.x4,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        backgroundColor: designTokens.color.surface,
      }}
    >
      <AppText role="label" tone="secondary">
        {label}
      </AppText>
      <AppText role="numeric">{value}</AppText>
      <AppText role="caption" tone="secondary">
        {definition}
      </AppText>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      preset="card"
    >
      {content}
    </MotionPressable>
  );
}

function formatRate(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return `${Math.round(value * 1000) / 10}%`;
}

function formatSeconds(value: number | null): string {
  if (value === null) {
    return '—';
  }
  if (value < 60) {
    return `${Math.round(value)} с`;
  }
  if (value < 3600) {
    return `${Math.round(value / 60)} мин`;
  }
  return `${Math.round(value / 3600)} ч`;
}

function GrowthBars({
  growth,
}: {
  growth: AdminAnalyticsOverview['growth'];
}) {
  const max = Math.max(
    1,
    ...growth.map(
      (day) =>
        day.newUsers +
        day.listingViews +
        day.bids +
        day.orders +
        day.newListings +
        day.newSellers,
    ),
  );

  return (
    <View style={{ gap: designTokens.space.x3 }}>
      {growth.slice(-14).map((day) => {
        const total =
          day.newUsers +
          day.listingViews +
          day.bids +
          day.orders +
          day.newListings +
          day.newSellers;
        const widthPercent = Math.max(4, Math.round((total / max) * 100));
        return (
          <View key={day.date} style={{ gap: designTokens.space.x1 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: designTokens.space.x3,
              }}
            >
              <AppText role="label">{day.date}</AppText>
              <AppText role="caption" tone="secondary">
                users {day.newUsers} · views {day.listingViews} · bids{' '}
                {day.bids} · orders {day.orders}
              </AppText>
            </View>
            <View
              style={{
                height: 8,
                backgroundColor: designTokens.color.border,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${widthPercent}%`,
                  height: '100%',
                  backgroundColor: designTokens.color.ink,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RecentList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; label: string; meta?: string; href?: string }>;
}) {
  return (
    <FormSection title={title}>
      {items.length === 0 ? (
        <AppText role="bodySmall" tone="secondary">
          Пока нет данных.
        </AppText>
      ) : (
        <View style={{ gap: designTokens.space.x1 }}>
          {items.map((item) => {
            const row = (
              <View
                style={{
                  gap: designTokens.space.x1,
                  paddingVertical: designTokens.space.x2,
                  borderBottomWidth: 1,
                  borderBottomColor: designTokens.color.border,
                }}
              >
                <AppText role="label">{item.label}</AppText>
                {item.meta ? (
                  <AppText role="caption" tone="secondary">
                    {item.meta}
                  </AppText>
                ) : null}
              </View>
            );

            if (!item.href) {
              return <View key={item.id}>{row}</View>;
            }

            return (
              <Link key={item.id} href={item.href as Href} asChild>
                <MotionPressable
                  accessibilityRole="link"
                  accessibilityLabel={item.label}
                  preset="card"
                >
                  {row}
                </MotionPressable>
              </Link>
            );
          })}
        </View>
      )}
    </FormSection>
  );
}

export function AdminAnalyticsScreen() {
  const api = useApiClient();
  const [period, setPeriod] = useState<PeriodOption>('7d');
  const [drilldown, setDrilldown] = useState<Drilldown | undefined>();

  const query = useQuery({
    queryKey: ['admin', 'analytics', period, drilldown],
    queryFn: () =>
      api.admin.getAnalyticsOverview({
        period,
        ...(drilldown ? { drilldown } : {}),
      }),
  });

  const data = query.data;

  const overviewCards = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      {
        label: 'Users',
        value: data.overview.users.value,
        definition: data.overview.users.definition,
      },
      {
        label: 'New users',
        value: data.overview.newUsers.value,
        definition: data.overview.newUsers.definition,
        drilldown: 'new_users' as const,
      },
      {
        label: 'Active users',
        value: data.overview.activeUsers.value,
        definition: data.overview.activeUsers.definition,
      },
      {
        label: 'Creators',
        value: data.overview.creators.value,
        definition: data.overview.creators.definition,
        drilldown: 'new_creators' as const,
      },
      {
        label: 'Live auctions',
        value: data.overview.liveAuctions.value,
        definition: data.overview.liveAuctions.definition,
      },
      {
        label: 'Bids',
        value: data.overview.bids.value,
        definition: data.overview.bids.definition,
        drilldown: 'recent_bids' as const,
      },
      {
        label: 'Ended auctions',
        value: data.overview.endedAuctions.value,
        definition: data.overview.endedAuctions.definition,
      },
      {
        label: 'Successful auctions',
        value: data.overview.successfulAuctions.value,
        definition: data.overview.successfulAuctions.definition,
        drilldown: 'recent_orders' as const,
      },
    ];
  }, [data]);

  if (query.isLoading) {
    return (
      <FormPageShell>
        <PageState title="Загружаем аналитику…" loading />
      </FormPageShell>
    );
  }

  if (query.isError || !data) {
    return (
      <FormPageShell>
        <PageState
          title="Не удалось загрузить аналитику"
          retry={() => void query.refetch()}
        />
      </FormPageShell>
    );
  }

  return (
    <FormPageShell>
      <PageHeader
        title="Аналитика"
        description="Обзор роста, воронок и здоровья marketplace без SQL."
      />

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: designTokens.space.x2,
        }}
      >
        <Link href="/admin" asChild>
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel="Модерация"
            preset="button"
            style={{
              minHeight: designTokens.size.touch,
              paddingHorizontal: designTokens.space.x4,
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: designTokens.color.border,
              backgroundColor: designTokens.color.surface,
            }}
          >
            <AppText role="button">Модерация</AppText>
          </MotionPressable>
        </Link>
        {periodOptions.map((option) => (
          <SecondaryButton
            key={option.value}
            label={period === option.value ? `✓ ${option.label}` : option.label}
            onPress={() => {
              setPeriod(option.value);
              setDrilldown(undefined);
            }}
          />
        ))}
      </View>

      <FormSection
        title="Overview"
        description={`${data.from.slice(0, 10)} → ${data.to.slice(0, 10)}`}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: designTokens.space.x3,
          }}
        >
          {overviewCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              definition={card.definition}
              onPress={
                card.drilldown
                  ? () => setDrilldown(card.drilldown)
                  : undefined
              }
            />
          ))}
        </View>
      </FormSection>

      <FormSection
        title="Acquisition"
        description="First-touch attribution из analytics; signup = linked User."
      >
        {data.acquisition.bySource.length === 0 ? (
          <AppText role="bodySmall" tone="secondary">
            Источников пока нет.
          </AppText>
        ) : (
          <View style={{ gap: designTokens.space.x2 }}>
            {data.acquisition.bySource.map((row) => (
              <View
                key={row.source}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: designTokens.space.x3,
                }}
              >
                <AppText role="label">{row.source}</AppText>
                <AppText role="caption" tone="secondary">
                  visitors {row.visitors} · signups {row.signups}
                </AppText>
              </View>
            ))}
            <AppText role="caption" tone="secondary">
              Visitor → signup:{' '}
              {formatRate(data.acquisition.visitorToSignupRate)}
            </AppText>
          </View>
        )}
      </FormSection>

      <FormSection
        title="Buyer funnel"
        description="Views/CTA — analytics; accepted bids/winners — PostgreSQL."
      >
        <AppText role="body">
          {data.buyerFunnel.listingViewed.value} listing viewed →{' '}
          {data.buyerFunnel.bidCtaClicked.value} bid CTA →{' '}
          {data.buyerFunnel.bidAccepted.value} bid accepted →{' '}
          {data.buyerFunnel.winners.value} winners
        </AppText>
        <SecondaryButton
          label="Отклонённые ставки"
          onPress={() => setDrilldown('bid_rejected')}
        />
      </FormSection>

      <FormSection title="Seller funnel" description="Почти всё из PostgreSQL.">
        <AppText role="body">
          {data.sellerFunnel.registeredUsers.value} registered →{' '}
          {data.sellerFunnel.sellerProfiles.value} sellers →{' '}
          {data.sellerFunnel.productsCreated.value} products →{' '}
          {data.sellerFunnel.productsApproved.value} approved →{' '}
          {data.sellerFunnel.auctionsStarted.value} auctions →{' '}
          {data.sellerFunnel.auctionsWithBids.value} with bids →{' '}
          {data.sellerFunnel.auctionsSold.value} sold
        </AppText>
      </FormSection>

      <FormSection title="Marketplace health">
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="bodySmall">
            LIVE: {data.marketplace.liveAuctions.value}
          </AppText>
          <AppText role="bodySmall">
            Started / ended: {data.marketplace.auctionsStarted.value} /{' '}
            {data.marketplace.auctionsEnded.value}
          </AppText>
          <AppText role="bodySmall">
            With bids / zero bids: {data.marketplace.auctionsWithBids.value} /{' '}
            {data.marketplace.auctionsWithZeroBids.value}
          </AppText>
          <AppText role="bodySmall">
            Avg bids / ended:{' '}
            {data.marketplace.averageBidsPerEndedAuction ?? '—'}
          </AppText>
          <AppText role="bodySmall">
            Unique bidders / active sellers:{' '}
            {data.marketplace.uniqueBidders.value} /{' '}
            {data.marketplace.uniqueActiveSellers.value}
          </AppText>
          <AppText role="bodySmall">
            Median time to first bid:{' '}
            {formatSeconds(data.marketplace.medianSecondsToFirstBid)}
          </AppText>
          <AppText role="bodySmall">
            Receiving bid rate:{' '}
            {formatRate(data.marketplace.auctionsReceivingBidRate)} · sold rate:{' '}
            {formatRate(data.marketplace.auctionsSoldRate)}
          </AppText>
          <SecondaryButton
            label={`Auctions without bids: ${data.marketplace.auctionsWithZeroBids.value}`}
            onPress={() => setDrilldown('auctions_without_bids')}
          />
        </View>
      </FormSection>

      <FormSection title="Growth" description="Последние дни периода.">
        <GrowthBars growth={data.growth} />
      </FormSection>

      <FormSection title="Needs attention">
        <View style={{ gap: designTokens.space.x2 }}>
          <SecondaryButton
            label={`Stale LIVE past endsAt: ${data.attention.staleLiveListings}`}
            onPress={() => setDrilldown('stale_live_listings')}
          />
          <SecondaryButton
            label={`Products stuck in review: ${data.attention.stuckProducts}`}
            onPress={() => setDrilldown('stuck_products')}
          />
          <SecondaryButton
            label={`Sellers stuck in review: ${data.attention.stuckSellers}`}
            onPress={() => setDrilldown('stuck_sellers')}
          />
          <SecondaryButton
            label={`Bid rejected events: ${data.attention.bidRejectedEvents}`}
            onPress={() => setDrilldown('bid_rejected')}
          />
        </View>
      </FormSection>

      {drilldown && data.drilldown ? (
        <RecentList
          title={`Drill-down: ${drilldown}`}
          items={data.drilldown.map((item) => ({
            id: item.id,
            label: item.label,
            meta: item.meta,
            href: item.href,
          }))}
        />
      ) : null}

      <RecentList
        title="Recent users"
        items={data.recent.users.map((user) => ({
          id: user.id,
          label: user.displayName,
          meta: user.createdAt,
        }))}
      />
      <RecentList
        title="Recent creators"
        items={data.recent.creators.map((creator) => ({
          id: creator.id,
          label: creator.fullName,
          meta: `${creator.slug} · ${creator.status} · ${creator.createdAt}`,
          href: `/seller/${creator.slug}`,
        }))}
      />
      <RecentList
        title="Recent listings"
        items={data.recent.listings.map((listing) => ({
          id: listing.id,
          label: listing.productTitle ?? listing.productPublicId,
          meta: `${listing.status} · ${listing.createdAt}`,
          href: `/product/${listing.productPublicId}`,
        }))}
      />
      <RecentList
        title="Recent bids"
        items={data.recent.bids.map((bid) => ({
          id: bid.id,
          label: `${bid.amount} BYN`,
          meta: `${bid.listingId} · ${bid.createdAt}`,
        }))}
      />
      <RecentList
        title="Recent ended auctions"
        items={data.recent.endedAuctions.map((listing) => ({
          id: listing.id,
          label: listing.productTitle ?? listing.productPublicId,
          meta: `bids ${listing.bidCount} · ${listing.closedAt ?? '—'}`,
          href: `/product/${listing.productPublicId}`,
        }))}
      />
      <RecentList
        title="Recent orders"
        items={data.recent.orders.map((order) => ({
          id: order.publicId,
          label: `${order.publicId} · ${order.finalAmount} BYN`,
          meta: `${order.status} · ${order.createdAt}`,
          href: `/order/${order.publicId}`,
        }))}
      />
    </FormPageShell>
  );
}

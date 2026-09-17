import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';
import { View } from 'react-native';

import type {
  AdminAnalyticsOverview,
  AdminAnalyticsQuery,
} from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FormPageShell } from '../../components/layout';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import {
  AppText,
  FormSection,
  MotionPressable,
  PageHeader,
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

function GrowthBars({
  growth,
}: {
  growth: AdminAnalyticsOverview['growth'];
}) {
  const max = Math.max(
    1,
    ...growth.map(
      (day) =>
        day.newUsers + day.listingViews + day.newWorks + day.newSellers,
    ),
  );

  return (
    <View style={{ gap: designTokens.space.x3 }}>
      {growth.slice(-14).map((day) => {
        const total =
          day.newUsers + day.listingViews + day.newWorks + day.newSellers;
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
                users {day.newUsers} · views {day.listingViews} · works{' '}
                {day.newWorks}
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
        label: 'Published works',
        value: data.overview.publishedWorks.value,
        definition: data.overview.publishedWorks.definition,
        drilldown: 'recent_works' as const,
      },
    ];
  }, [data]);

  const pageStatus = infrastructurePageFetchStatus(query);
  if (pageStatus !== 'ready' || !data) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status={pageStatus === 'loading' ? 'loading' : 'error'}
          onRetry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  return (
    <FormPageShell>
      <PageHeader
        title="Аналитика"
        description="Обзор роста и модерации portfolio без SQL."
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
        title="Audience"
        description="listing_viewed остаётся ingest-событием, не auction HTTP."
      >
        <AppText role="body">
          {data.audience.listingViewed.value} listing viewed
        </AppText>
      </FormSection>

      <FormSection title="Author funnel" description="Почти всё из PostgreSQL.">
        <AppText role="body">
          {data.sellerFunnel.registeredUsers.value} registered →{' '}
          {data.sellerFunnel.sellerProfiles.value} authors →{' '}
          {data.sellerFunnel.productsCreated.value} works →{' '}
          {data.sellerFunnel.productsApproved.value} approved
        </AppText>
      </FormSection>

      <FormSection title="Growth" description="Последние дни периода.">
        <GrowthBars growth={data.growth} />
      </FormSection>

      <FormSection title="Needs attention">
        <View style={{ gap: designTokens.space.x2 }}>
          <SecondaryButton
            label={`Works stuck in review: ${data.attention.stuckProducts}`}
            onPress={() => setDrilldown('stuck_products')}
          />
          <SecondaryButton
            label={`Authors stuck in review: ${data.attention.stuckSellers}`}
            onPress={() => setDrilldown('stuck_sellers')}
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
        title="Recent authors"
        items={data.recent.creators.map((creator) => ({
          id: creator.id,
          label: creator.fullName,
          meta: `${creator.slug} · ${creator.status} · ${creator.createdAt}`,
          href: `/seller/${creator.slug}`,
        }))}
      />
      <RecentList
        title="Recent works"
        items={data.recent.works.map((work) => ({
          id: work.id,
          label: work.title ?? work.publicId,
          meta: work.publishedAt ?? work.publicId,
          href: `/product/${work.publicId}`,
        }))}
      />
    </FormPageShell>
  );
}

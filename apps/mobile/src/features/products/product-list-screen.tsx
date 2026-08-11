import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ScrollView,
  useWindowDimensions,
  View,
  type DimensionValue,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppText,
  AppIcon,
  AuctionCard,
  PageState,
  Skeleton,
  MotionPressable,
} from '../../components/ui';
import type {
  PublicDiscoverySort,
} from '@bidplace/contracts';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from './catalog-layout';
import { listingStatusLabels } from '../../lib/presentation';

type CatalogColumnCount = 1 | 2 | 3 | 4;
type PublicListingStatus = 'LIVE' | 'SCHEDULED' | 'ENDED';

const sortOptions: Array<{ value: PublicDiscoverySort; label: string }> = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'activity', label: 'По активности' },
  { value: 'endingSoon', label: 'Скоро завершатся' },
  { value: 'priceAsc', label: 'Сначала дешевле' },
  { value: 'priceDesc', label: 'Сначала дороже' },
];

function DiscoveryControls({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status?: PublicListingStatus;
  sort: PublicDiscoverySort;
  onStatusChange: (value?: PublicListingStatus) => void;
  onSortChange: (value: PublicDiscoverySort) => void;
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = sortOptions.find((option) => option.value === sort);

  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: designTokens.space.x2 }}
      >
        {[
          { value: undefined, label: 'Все' },
          ...(['LIVE', 'SCHEDULED', 'ENDED'] as const).map((value) => ({
            value,
            label: listingStatusLabels[value],
          })),
        ].map((option) => {
          const selected = option.value === status;
          return (
            <MotionPressable
              key={option.label}
              accessibilityRole="button"
              accessibilityLabel={`Фильтр: ${option.label}`}
              accessibilityState={{ selected }}
              onPress={() => onStatusChange(option.value)}
              preset="button"
              style={{
                minHeight: designTokens.size.control,
                justifyContent: 'center',
                borderRadius: designTokens.radius.compact,
                borderWidth: 1,
                borderColor: selected
                  ? designTokens.color.action
                  : designTokens.color.border,
                backgroundColor: selected
                  ? designTokens.color.action
                  : designTokens.color.surface,
                paddingHorizontal: designTokens.space.x3,
              }}
            >
              <AppText
                role="label"
                style={{
                  color: selected
                    ? designTokens.color.surface
                    : designTokens.color.ink,
                }}
              >
                {option.label}
              </AppText>
            </MotionPressable>
          );
        })}
      </ScrollView>
      <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Сортировка"
          accessibilityState={{ expanded: sortOpen }}
          onPress={() => setSortOpen((current) => !current)}
          preset="button"
          style={{
            minHeight: designTokens.size.buttonCompact,
            flexDirection: 'row',
            alignItems: 'center',
            gap: designTokens.space.x2,
            borderRadius: designTokens.radius.pill,
            borderWidth: 1,
            borderColor: designTokens.color.border,
            paddingHorizontal: designTokens.space.x3,
          }}
        >
          <AppText role="label">{currentSort?.label}</AppText>
          <AppIcon
            name="chevronDown"
            size={16}
            color={designTokens.color.ink}
          />
        </MotionPressable>
        {sortOpen ? (
          <View
            accessibilityRole="menu"
            style={{
              position: 'absolute',
              top: designTokens.size.buttonCompact + designTokens.space.x2,
              left: 0,
              zIndex: designTokens.layer.popover,
              minWidth: 200,
              gap: designTokens.space.x1,
              borderWidth: 1,
              borderColor: designTokens.color.border,
              borderRadius: designTokens.radius.menu,
              backgroundColor: designTokens.color.surface,
              padding: designTokens.space.x2,
              ...designTokens.elevation.floating,
            }}
          >
            {sortOptions.map((option) => (
              <MotionPressable
                key={option.value}
                accessibilityRole="menuitem"
                accessibilityLabel={option.label}
                onPress={() => {
                  onSortChange(option.value);
                  setSortOpen(false);
                }}
                preset="button"
                style={{
                  minHeight: designTokens.size.touch,
                  justifyContent: 'center',
                  borderRadius: designTokens.radius.small,
                  paddingHorizontal: designTokens.space.x2,
                }}
                interactionStyle={({ hovered, pressed }) => ({
                  backgroundColor:
                    hovered || pressed
                      ? designTokens.color.surfaceStrong
                      : 'transparent',
                })}
              >
                <AppText role="label">{option.label}</AppText>
              </MotionPressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CatalogGrid({
  columns,
  count,
  renderCard,
}: {
  columns: CatalogColumnCount;
  count: number;
  renderCard: (index: number) => ReactNode;
}) {
  const cardWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -designTokens.space.x2,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{ width: cardWidth, padding: designTokens.space.x2 }}
        >
          {renderCard(index)}
        </View>
      ))}
    </View>
  );
}

function CatalogCardSkeleton() {
  return (
    <View
      style={{
        overflow: 'hidden',
        borderRadius: designTokens.radius.card,
        backgroundColor: designTokens.color.surfaceMuted,
      }}
    >
      <Skeleton style={{ width: '100%', aspectRatio: 1, borderRadius: 0 }} />
      <View
        style={{
          minHeight: 134,
          gap: designTokens.space.x2,
          padding: designTokens.space.x4,
        }}
      >
        <Skeleton style={{ width: '78%', height: 23 }} />
        <Skeleton style={{ width: '48%', height: 20 }} />
        <View style={{ flex: 1 }} />
        <Skeleton style={{ width: '100%', height: 40 }} />
      </View>
    </View>
  );
}

function CatalogLoadingAnnouncement() {
  return (
    <AppText
      role="caption"
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
    >
      Загружаем работы…
    </AppText>
  );
}

export function ProductListScreen({
  query: searchQuery,
  title = 'Работы',
  subtitle = 'Авторские предметы и живые аукционы bidplace.',
  status,
  sort = 'newest',
}: {
  query?: string;
  title?: string;
  subtitle?: string;
  status?: PublicListingStatus;
  sort?: PublicDiscoverySort;
} = {}) {
  const api = useApiClient();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const query = useQuery({
    queryKey: ['products', { q: searchQuery, status, sort }],
    queryFn: () => api.products.list({ q: searchQuery, status, sort }),
  });
  const columns = getCatalogColumnCount(width);

  let content: ReactNode;
  if (query.isLoading) {
    content = (
      <CatalogGrid
        columns={columns}
        count={columns === 1 ? 2 : columns * 2}
        renderCard={() => <CatalogCardSkeleton />}
      />
    );
  } else if (query.isError || !query.data) {
    content = (
      <PageState
        title="Не удалось загрузить работы"
        message="Проверьте соединение и повторите."
        retry={() => void query.refetch()}
      />
    );
  } else if (query.data.products.length === 0) {
    content = (
      <PageState
        title="Пока нет работ"
        message="Здесь появятся авторские предметы для торгов. Загляните позже."
      />
    );
  } else {
    content = (
      <CatalogGrid
        columns={columns}
        count={query.data.products.length}
        renderCard={(index) => (
          <AuctionCard item={query.data.products[index]} />
        )}
      />
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal:
            width >= designTokens.breakpoint.desktopShell
              ? designTokens.layout.desktopGutter
              : designTokens.layout.mobileGutter,
          paddingBottom: designTokens.space.x20,
          paddingTop:
            width >= designTokens.breakpoint.compactHeader
              ? designTokens.space.x16
              : designTokens.space.x10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.contentMaxWidth,
            alignSelf: 'center',
            gap: designTokens.space.x10,
          }}
        >
          <View style={{ maxWidth: 720, gap: designTokens.space.x3 }}>
            <AppText
              role={
                width >= designTokens.breakpoint.compactHeader
                  ? 'display'
                  : 'screenTitle'
              }
            >
              {title}
            </AppText>
            <AppText role="body" tone="secondary">
              {subtitle}
            </AppText>
          </View>
          <DiscoveryControls
            status={status}
            sort={sort}
            onStatusChange={(nextStatus) =>
              router.setParams({ status: nextStatus, sort })
            }
            onSortChange={(nextSort) =>
              router.setParams({ status, sort: nextSort })
            }
          />
          {query.isLoading ? <CatalogLoadingAnnouncement /> : null}
          {content}
          {query.isFetching && !query.isLoading ? (
            <AppText
              role="caption"
              tone="secondary"
              accessibilityLiveRegion="polite"
            >
              Обновляем работы…
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}

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

type CatalogColumnCount = 1 | 2 | 3 | 4;
type PublicListingStatus = 'LIVE' | 'SCHEDULED' | 'ENDED';

const sortOptions: Array<{ value: PublicDiscoverySort; label: string }> = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'activity', label: 'По активности' },
  { value: 'endingSoon', label: 'Скоро завершатся' },
  { value: 'priceAsc', label: 'Сначала дешевле' },
  { value: 'priceDesc', label: 'Сначала дороже' },
];

function FacetMenu({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (value?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <View style={{ position: 'relative' }}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        preset="button"
        style={{
          minHeight: 36,
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x2,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: designTokens.color.border,
          paddingHorizontal: 14,
        }}
      >
        <AppText role="caption" numberOfLines={1}>
          {selectedLabel ?? label}
        </AppText>
        <AppIcon name="chevronDown" size={14} color={designTokens.color.textSecondary} />
      </MotionPressable>
      {open ? (
        <View
          accessibilityRole="menu"
          style={{
            position: 'absolute',
            top: 44,
            left: 0,
            zIndex: designTokens.layer.popover,
            minWidth: 180,
            gap: designTokens.space.x1,
            borderWidth: 1,
            borderColor: designTokens.color.border,
            borderRadius: 16,
            backgroundColor: designTokens.color.surface,
            padding: 10,
            ...designTokens.elevation.floating,
          }}
        >
          <MotionPressable
            accessibilityRole="menuitem"
            accessibilityLabel={`${label}: все`}
            onPress={() => {
              onSelect(undefined);
              setOpen(false);
            }}
            preset="button"
            style={facetMenuItemStyle}
            interactionStyle={facetMenuItemInteractionStyle}
          >
            <AppText role="label">Все</AppText>
          </MotionPressable>
          {options.map((option) => (
            <MotionPressable
              key={option.value}
              accessibilityRole="menuitem"
              accessibilityLabel={option.label}
              onPress={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              preset="button"
              style={facetMenuItemStyle}
              interactionStyle={facetMenuItemInteractionStyle}
            >
              <AppText role="label" numberOfLines={1}>
                {option.label}
              </AppText>
            </MotionPressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const facetMenuItemStyle = {
  minHeight: designTokens.size.touch,
  justifyContent: 'center' as const,
  borderRadius: designTokens.radius.small,
  paddingHorizontal: designTokens.space.x2,
};

const facetMenuItemInteractionStyle = ({
  hovered,
  pressed,
}: {
  hovered: boolean;
  pressed: boolean;
}) => ({
  backgroundColor:
    hovered || pressed ? designTokens.color.surfaceStrong : 'transparent',
});

function DiscoveryControls({
  status,
  sort,
  facets,
  category,
  material,
  onStatusChange,
  onSortChange,
  onCategoryChange,
  onMaterialChange,
}: {
  status?: PublicListingStatus;
  sort: PublicDiscoverySort;
  facets?: {
    statusCounts: Record<PublicListingStatus, number>;
    categories: Array<{ id: string; name: string; count: number }>;
    materials: string[];
  };
  category?: string;
  material?: string;
  onStatusChange: (value?: PublicListingStatus) => void;
  onSortChange: (value: PublicDiscoverySort) => void;
  onCategoryChange: (value?: string) => void;
  onMaterialChange: (value?: string) => void;
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = sortOptions.find((option) => option.value === sort);
  const statusOptions: Array<{ value: PublicListingStatus; label: string }> = [
    { value: 'LIVE', label: 'Идут торги' },
    { value: 'SCHEDULED', label: 'Запланированы' },
    { value: 'ENDED', label: 'Завершены' },
  ];

  return (
    <View style={{ gap: designTokens.space.x6 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: designTokens.space.x2 }}
      >
        <FacetMenu
          label="Категория"
          value={category}
          options={(facets?.categories ?? []).map((option) => ({
            value: option.id,
            label: `${option.name} · ${option.count}`,
          }))}
          onSelect={onCategoryChange}
        />
        <FacetMenu
          label="Материал"
          value={material}
          options={(facets?.materials ?? []).map((option) => ({
            value: option,
            label: option,
          }))}
          onSelect={onMaterialChange}
        />
      </ScrollView>
      <View
        style={{
          minHeight: 40,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: designTokens.space.x4,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: designTokens.space.x6 }}
        >
          {statusOptions.map((option) => {
            const selected = status === option.value;
            return (
              <MotionPressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityLabel={option.label}
                accessibilityState={{ selected }}
                onPress={() => onStatusChange(option.value)}
                preset="button"
                style={{
                  minHeight: 32,
                  justifyContent: 'space-between',
                  gap: designTokens.space.x2,
                  borderBottomWidth: 1.5,
                  borderBottomColor: selected
                    ? designTokens.color.ink
                    : 'transparent',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppText
                    role="caption"
                    style={{
                      color: selected
                        ? designTokens.color.ink
                        : designTokens.color.textSecondary,
                    }}
                  >
                    {option.label}
                  </AppText>
                  <AppText role="caption" tone="muted" style={{ fontSize: 10 }}>
                    {facets?.statusCounts[option.value] ?? 0}
                  </AppText>
                </View>
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
              height: 32,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              borderRadius: designTokens.radius.pill,
              borderWidth: 1,
              borderColor: designTokens.color.border,
              paddingHorizontal: 12,
            }}
          >
            <AppIcon name="arrowUpDown" size={13} color={designTokens.color.ink} />
            <AppText role="caption" numberOfLines={1}>
              {currentSort?.label}
            </AppText>
            <AppIcon name="chevronDown" size={12} color={designTokens.color.textSecondary} />
          </MotionPressable>
          {sortOpen ? (
            <View
              accessibilityRole="menu"
              style={{
                position: 'absolute',
                top: 40,
                right: 0,
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
                  style={facetMenuItemStyle}
                  interactionStyle={facetMenuItemInteractionStyle}
                >
                  <AppText role="label">{option.label}</AppText>
                </MotionPressable>
              ))}
            </View>
          ) : null}
        </View>
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
        margin: -designTokens.space.x3,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{ width: cardWidth, padding: designTokens.space.x3 }}
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
  status,
  sort = 'newest',
  category,
  material,
}: {
  query?: string;
  title?: string;
  status?: PublicListingStatus;
  sort?: PublicDiscoverySort;
  category?: string;
  material?: string;
} = {}) {
  const api = useApiClient();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const query = useQuery({
    queryKey: ['products', { q: searchQuery, status, sort, category, material }],
    queryFn: () =>
      api.products.list({
        q: searchQuery,
        status,
        sort,
        category,
        materials: material ? [material] : undefined,
      }),
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
        style={{ backgroundColor: designTokens.color.surfaceWarm }}
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
              role="screenTitle"
              style={
                width >= designTokens.breakpoint.compactHeader
                  ? { fontSize: 32, lineHeight: 34, letterSpacing: -0.96 }
                  : undefined
              }
            >
              {title}
            </AppText>
          </View>
          <DiscoveryControls
            status={status}
            sort={sort}
            facets={query.data?.facets}
            category={category}
            material={material}
            onStatusChange={(nextStatus) =>
              router.setParams({
                status: nextStatus,
                sort,
                category,
                material,
              })
            }
            onSortChange={(nextSort) =>
              router.setParams({
                status,
                sort: nextSort,
                category,
                material,
              })
            }
            onCategoryChange={(nextCategory) =>
              router.setParams({ status, sort, category: nextCategory, material })
            }
            onMaterialChange={(nextMaterial) =>
              router.setParams({ status, sort, category, material: nextMaterial })
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

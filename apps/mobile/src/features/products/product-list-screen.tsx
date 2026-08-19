import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FilterMenu } from '../../components/layout';
import {
  AppText,
  AppIcon,
  AuctionCard,
  PageState,
  MotionPressable,
} from '../../components/ui';
import type { PublicDiscoverySort, PublicListingStatus } from '@bidplace/contracts';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from './catalog-layout';
import {
  priceRangeOptions,
  sortOptions,
} from './catalog-facet-options';
import { CatalogGrid } from './CatalogGrid';
import { CatalogCardSkeleton } from './CatalogCardSkeleton';

function priceRangeKey(priceMin?: number, priceMax?: number) {
  return priceRangeOptions.find(
    (option) => option.min === priceMin && option.max === priceMax,
  )?.value;
}

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
  return (
    <FilterMenu
      variant="facet"
      label={label}
      value={value}
      options={options}
      onSelect={onSelect}
      allLabel="Все"
    />
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
  placement = 'all',
  status,
  sort,
  facets,
  category,
  material,
  author,
  uniqueness,
  priceMin,
  priceMax,
  onStatusChange,
  onSortChange,
  onCategoryChange,
  onMaterialChange,
  onAuthorChange,
  onUniquenessChange,
  onPriceChange,
}: {
  placement?: 'all' | 'facets' | 'states';
  status?: PublicListingStatus;
  sort: PublicDiscoverySort;
  facets?: {
    statusCounts: Record<PublicListingStatus, number>;
    categories: Array<{ id: string; name: string; count: number }>;
    authors: Array<{ slug: string; name: string; count: number }>;
    materials: string[];
    uniquenesses: string[];
  };
  category?: string;
  material?: string;
  author?: string;
  uniqueness?: string;
  priceMin?: number;
  priceMax?: number;
  onStatusChange: (value?: PublicListingStatus) => void;
  onSortChange: (value: PublicDiscoverySort) => void;
  onCategoryChange: (value?: string) => void;
  onMaterialChange: (value?: string) => void;
  onAuthorChange: (value?: string) => void;
  onUniquenessChange: (value?: string) => void;
  onPriceChange: (range?: { min?: number; max?: number }) => void;
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = sortOptions.find((option) => option.value === sort);
  const statusOptions: Array<{ value: PublicListingStatus; label: string }> = [
    { value: 'LIVE', label: 'Идут торги' },
    { value: 'SCHEDULED', label: 'Запланированы' },
    { value: 'ENDED', label: 'Завершены' },
  ];

  const facetsContent = (
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
        label="Автор"
        value={author}
        options={(facets?.authors ?? []).map((option) => ({
          value: option.slug,
          label: `${option.name} · ${option.count}`,
        }))}
        onSelect={onAuthorChange}
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
      <FacetMenu
        label="Цена"
        value={priceRangeKey(priceMin, priceMax)}
        options={priceRangeOptions}
        onSelect={(value) => {
          const range = priceRangeOptions.find(
            (option) => option.value === value,
          );
          onPriceChange(range ? { min: range.min, max: range.max } : undefined);
        }}
      />
      <FacetMenu
        label="Статус"
        value={status}
        options={statusOptions}
        onSelect={(value) =>
          onStatusChange(value as PublicListingStatus | undefined)
        }
      />
      <FacetMenu
        label="Уникальность"
        value={uniqueness}
        options={(facets?.uniquenesses ?? []).map((option) => ({
          value: option,
          label: option,
        }))}
        onSelect={onUniquenessChange}
      />
    </ScrollView>
  );

  const statesContent = (
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
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
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
      <View style={{ position: 'relative', alignSelf: 'center' }}>
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
          <AppIcon
            name="arrowUpDown"
            size={13}
            color={designTokens.color.ink}
          />
          <AppText role="caption" numberOfLines={1}>
            {currentSort?.label}
          </AppText>
          <AppIcon
            name="chevronDown"
            size={12}
            color={designTokens.color.textSecondary}
          />
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
  );

  if (placement === 'facets') return facetsContent;
  if (placement === 'states') return statesContent;

  return (
    <View style={{ gap: designTokens.space.x6 }}>
      {facetsContent}
      {statesContent}
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
  sort = 'activity',
  category,
  material,
  author,
  uniqueness,
  priceMin,
  priceMax,
}: {
  query?: string;
  title?: string;
  status?: PublicListingStatus;
  sort?: PublicDiscoverySort;
  category?: string;
  material?: string;
  author?: string;
  uniqueness?: string;
  priceMin?: number;
  priceMax?: number;
} = {}) {
  const api = useApiClient();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const query = useQuery({
    queryKey: [
      'products',
      {
        q: searchQuery,
        status,
        sort,
        category,
        material,
        author,
        uniqueness,
        priceMin,
        priceMax,
      },
    ],
    queryFn: () =>
      api.products.list({
        q: searchQuery,
        status,
        sort,
        category,
        materials: material ? [material] : undefined,
        author,
        uniqueness,
        priceMin,
        priceMax,
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

  const discoveryControlProps = {
    status,
    sort,
    facets: query.data?.facets,
    category,
    material,
    author,
    uniqueness,
    priceMin,
    priceMax,
    onStatusChange: (nextStatus?: PublicListingStatus) =>
      router.setParams({
        status: nextStatus,
        sort,
        category,
        material,
        author,
        uniqueness,
        priceMin,
        priceMax,
      }),
    onSortChange: (nextSort: PublicDiscoverySort) =>
      router.setParams({
        status,
        sort: nextSort,
        category,
        material,
        author,
        uniqueness,
        priceMin,
        priceMax,
      }),
    onCategoryChange: (nextCategory?: string) =>
      router.setParams({
        status,
        sort,
        category: nextCategory,
        material,
        author,
        uniqueness,
        priceMin,
        priceMax,
      }),
    onMaterialChange: (nextMaterial?: string) =>
      router.setParams({
        status,
        sort,
        category,
        material: nextMaterial,
        author,
        uniqueness,
        priceMin,
        priceMax,
      }),
    onAuthorChange: (nextAuthor?: string) =>
      router.setParams({
        status,
        sort,
        category,
        material,
        author: nextAuthor,
        uniqueness,
        priceMin,
        priceMax,
      }),
    onUniquenessChange: (nextUniqueness?: string) =>
      router.setParams({
        status,
        sort,
        category,
        material,
        author,
        uniqueness: nextUniqueness,
        priceMin,
        priceMax,
      }),
    onPriceChange: (range?: { min?: number; max?: number }) =>
      router.setParams({
        status,
        sort,
        category,
        material,
        author,
        uniqueness,
        priceMin: range?.min,
        priceMax: range?.max,
      }),
  };

  return (
    <AppShell>
      <ScrollView
        testID="catalog-scroll-view"
        contentContainerStyle={{
          paddingHorizontal:
            width >= designTokens.breakpoint.desktopShell
              ? designTokens.layout.desktopGutter
              : designTokens.layout.mobileGutter,
          paddingBottom: designTokens.space.x20,
          paddingTop: designTokens.space.x3,
        }}
        style={{ backgroundColor: designTokens.color.surfaceWarm }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.discoveryMaxWidth,
            alignSelf: 'center',
          }}
        >
          <DiscoveryControls placement="facets" {...discoveryControlProps} />
          <View
            style={{
              paddingTop:
                width >= designTokens.breakpoint.compactHeader
                  ? designTokens.space.x10
                  : designTokens.space.x6,
              paddingBottom: designTokens.space.x8,
              borderBottomWidth: 1,
              borderBottomColor: designTokens.color.border,
            }}
          >
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
          <View
            style={{
              paddingTop: designTokens.space.x7,
              paddingBottom: designTokens.space.x7,
            }}
          >
            <DiscoveryControls placement="states" {...discoveryControlProps} />
          </View>
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

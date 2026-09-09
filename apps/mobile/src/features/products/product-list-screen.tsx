import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FilterMenu } from '../../components/layout';
import {
  AppText,
  AuctionCard,
  PageState,
  toAuctionCardItem,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from './catalog-layout';
import { CatalogGrid } from './CatalogGrid';
import { CatalogCardSkeleton } from './CatalogCardSkeleton';
import {
  toPortfolioWorksListQuery,
  type PortfolioCatalogSort,
} from './portfolio-works-query';

const sortOptions: Array<{ value: PortfolioCatalogSort; label: string }> = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
];

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
  sort = 'newest',
  category,
  material,
}: {
  query?: string;
  title?: string;
  sort?: PortfolioCatalogSort;
  category?: string;
  material?: string;
} = {}) {
  const api = useApiClient();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const listQuery = toPortfolioWorksListQuery({
    q: searchQuery,
    category,
    material,
    sort,
  });
  const query = useQuery({
    queryKey: ['portfolio-works', listQuery],
    queryFn: () => api.portfolio.listWorks(listQuery),
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
  } else if (query.data.works.length === 0) {
    content = (
      <PageState
        title="Пока нет работ"
        message="Здесь появятся авторские предметы. Загляните позже."
      />
    );
  } else {
    content = (
      <CatalogGrid
        columns={columns}
        count={query.data.works.length}
        renderCard={(index) => (
          <AuctionCard item={toAuctionCardItem(query.data.works[index]!)} />
        )}
      />
    );
  }

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
              alignSelf: 'flex-start',
            }}
          >
            <FilterMenu
              variant="sort"
              label="Сортировка работ"
              value={sort}
              options={sortOptions}
              onSelect={(next) => {
                if (!next) return;
                router.setParams({
                  sort: next,
                  category,
                  material,
                });
              }}
              dropdownAlign="left"
              dropdownMinWidth={190}
              dismissOnOutside
            />
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

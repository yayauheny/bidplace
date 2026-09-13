import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FilterMenu } from '../../components/layout';
import {
  AppText,
  PageState,
  SecondaryButton,
} from '../../components/ui';
import { WorkCoverCardGrid } from '../../components/figma/WorkCoverCardGrid';
import { useApiClient } from '../../providers/api-provider';
import { CatalogCardSkeleton } from './CatalogCardSkeleton';
import {
  toPortfolioWorksListQuery,
  type PortfolioCatalogSort,
} from './portfolio-works-query';
import { WORKS_CATALOG_INTRO } from '../../lib/portfolio-copy';

const sortOptions: Array<{ value: PortfolioCatalogSort; label: string }> = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
];

export function ProductListScreen({
  query: searchQuery,
  title = 'Каталог работ на Bidplace',
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

  let content: ReactNode;
  if (query.isLoading) {
    content = (
      <View style={{ gap: designTokens.space.sectionGap }}>
        <CatalogCardSkeleton />
        <CatalogCardSkeleton />
      </View>
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
    content = <WorkCoverCardGrid items={query.data.works} />;
  }

  return (
    <AppShell>
      <ScrollView
        testID="catalog-scroll-view"
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x10,
          paddingBottom: designTokens.size.dockReserve,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            gap: designTokens.space.x2,
            marginBottom: designTokens.space.x10,
          }}
        >
          <AppText role="screenTitle">{title}</AppText>
          <AppText role="bodySmall" tone="secondary">
            {WORKS_CATALOG_INTRO}
          </AppText>
        </View>
        <View
          style={{
            marginHorizontal: -designTokens.space.pageGutter,
            marginBottom: designTokens.space.authorSectionGap,
            paddingHorizontal: designTokens.space.pageGutter,
            borderBottomWidth: 1,
            borderBottomColor: designTokens.color.divider,
          }}
        >
          <View style={{ alignSelf: 'flex-start' }}>
            <AppText role="profileTab">Все работы</AppText>
            <View
              style={{
                height: 2,
                backgroundColor: designTokens.color.ink,
                marginTop: designTokens.space.x1,
              }}
            />
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            gap: designTokens.space.x3,
            marginBottom: designTokens.space.x8,
          }}
        >
          <SecondaryButton
            label="Фильтры"
            icon="filter-horizontal"
            onPress={() => undefined}
            disabled
            accessibilityHint="Фильтры появятся вместе с поиском"
          />
          <FilterMenu
            variant="sort"
            label="Сортировка"
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
        {query.isLoading ? (
          <AppText
            role="caption"
            accessibilityRole="progressbar"
            accessibilityLiveRegion="polite"
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          >
            Загружаем работы…
          </AppText>
        ) : null}
        {content}
      </ScrollView>
    </AppShell>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import { AppText, PageState } from '../../components/ui';
import {
  FigmaButton,
  FilterSortBar,
  FilterSortSheet,
  WorkCoverCardGrid,
} from '../../components/figma';
import {
  CatalogFilterSheet,
  type CatalogFilterSection,
} from '../discovery/CatalogFilterSheet';
import { useApiClient } from '../../providers/api-provider';
import { CatalogCardSkeleton } from './CatalogCardSkeleton';
import {
  type PortfolioCatalogSort,
  type PortfolioWorksRouteState,
} from './portfolio-works-query';
import { usePortfolioWorks } from './use-portfolio-works';
import { WORKS_CATALOG_INTRO } from '../../lib/portfolio-copy';
import { retryTransientPublicQuery } from '../../lib/query-retry';

const sortOptions: Array<{ value: PortfolioCatalogSort; label: string }> = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
];

export function ProductListScreen({
  state,
  title = 'Каталог работ на Bidplace',
}: {
  state: PortfolioWorksRouteState;
  title?: string;
}) {
  const api = useApiClient();
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
    retry: retryTransientPublicQuery,
  });
  const facets = useQuery({
    queryKey: ['portfolio-facets'],
    queryFn: () => api.portfolio.facets(),
    retry: retryTransientPublicQuery,
  });
  const query = usePortfolioWorks(state);
  const sections: CatalogFilterSection[] = [
    {
      id: 'category',
      label: 'Категория',
      value: state.category,
      options:
        categories.data?.categories.map((category) => ({
          value: category.id,
          label: category.name,
        })) ?? [],
      state: queryState(categories, categories.data?.categories),
      onRetry: () => void categories.refetch(),
    },
    {
      id: 'material',
      label: 'Материал',
      value: state.material,
      options:
        facets.data?.materials.map((material) => ({
          value: material,
          label: material,
        })) ?? [],
      state: queryState(facets, facets.data?.materials),
      onRetry: () => void facets.refetch(),
    },
  ];

  let content: ReactNode;
  if (query.isPending) {
    content = (
      <View style={{ gap: designTokens.space.sectionGap }}>
        <CatalogCardSkeleton />
        <CatalogCardSkeleton />
      </View>
    );
  } else if (query.isError) {
    content = (
      <PageState
        title="Не удалось загрузить работы"
        message="Проверьте соединение и повторите."
        retry={() => void query.refetch()}
      />
    );
  } else if (query.items.length === 0) {
    content = (
      <PageState
        title={state.q ? 'Работы не найдены' : 'Пока нет работ'}
        message={
          state.q
            ? `По запросу «${state.q}» нет опубликованных работ.`
            : 'Попробуйте изменить или сбросить фильтры.'
        }
      />
    );
  } else {
    content = (
      <View style={{ gap: designTokens.space.x6 }}>
        <WorkCoverCardGrid items={query.items} />
        {query.hasNextPage ? (
          <FigmaButton
            label="Показать ещё"
            variant="outline"
            width="full"
            loading={query.isFetchingNextPage}
            onPress={() => void query.fetchNextPage()}
          />
        ) : null}
      </View>
    );
  }

  return (
    <AppShell>
      <ScrollView
        testID="catalog-scroll-view"
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x10,
          paddingBottom: designTokens.size.dockReserve,
          gap: designTokens.space.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="screenTitle">{title}</AppText>
          <AppText role="bodySmall">{WORKS_CATALOG_INTRO}</AppText>
        </View>
        <View>
          <FilterSortBar
            filterLabel={activeFilterLabel(state)}
            filterActive={Boolean(state.q || state.category || state.material)}
            sortActive={state.sort !== 'newest'}
            onPressFilter={() => setFilterOpen(true)}
            onPressSort={() => setSortOpen(true)}
          />
        </View>
        {query.isPending ? (
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
      <CatalogFilterSheet
        open={filterOpen}
        search={{
          id: 'q',
          value: state.q,
          placeholder: 'Поиск по работам',
        }}
        sections={sections}
        onClose={() => setFilterOpen(false)}
        onApply={(values) => {
          router.setParams({
            q: cleanDraftValue(values.q),
            category: values.category,
            material: values.material,
            sort: state.sort,
          });
          setFilterOpen(false);
        }}
      />
      <FilterSortSheet
        open={sortOpen}
        value={state.sort}
        options={sortOptions}
        onClose={() => setSortOpen(false)}
        onSelect={(sort) => {
          router.setParams({
            q: state.q,
            category: state.category,
            material: state.material,
            sort,
          });
        }}
      />
    </AppShell>
  );
}

function activeFilterLabel(state: PortfolioWorksRouteState) {
  const count = [state.q, state.category, state.material].filter(Boolean).length;
  return count ? `Фильтры · ${count}` : 'Фильтры';
}

function cleanDraftValue(value?: string) {
  return value?.trim() || undefined;
}

function queryState(
  query: { isPending: boolean; isError: boolean },
  options?: ReadonlyArray<unknown>,
): CatalogFilterSection['state'] {
  if (query.isPending) return 'loading';
  if (query.isError) return 'error';
  if (options && options.length === 0) return 'empty';
  return 'ready';
}

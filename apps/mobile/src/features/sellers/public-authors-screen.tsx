import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import {
  FigmaButton,
  FilterSortBar,
  FilterSortSheet,
} from '../../components/figma';
import {
  AppText,
  CreatorCardGrid,
  PageState,
} from '../../components/ui';
import {
  CatalogFilterSheet,
  type CatalogFilterSection,
} from '../discovery/CatalogFilterSheet';
import { useApiClient } from '../../providers/api-provider';
import { AUTHORS_CATALOG_INTRO } from '../../lib/portfolio-copy';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { AUTHOR_SORT_OPTIONS } from './author-sort';
import type { PortfolioAuthorsRouteState } from './portfolio-authors-query';
import { usePortfolioAuthors } from './use-portfolio-authors';

export function PublicAuthorsScreen({
  state,
}: {
  state: PortfolioAuthorsRouteState;
}) {
  const api = useApiClient();
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const facets = useQuery({
    queryKey: ['portfolio-facets'],
    queryFn: () => api.portfolio.facets(),
    retry: retryTransientPublicQuery,
  });
  const result = usePortfolioAuthors(state);
  const sections: CatalogFilterSection[] = [
    {
      id: 'tag',
      label: 'Направление',
      value: state.tag,
      options:
        facets.data?.tags.map((tag) => ({ value: tag, label: tag })) ?? [],
      state: facetState(facets, facets.data?.tags),
      onRetry: () => void facets.refetch(),
    },
    {
      id: 'city',
      label: 'Город',
      value: state.city,
      options:
        facets.data?.cities.map((city) => ({ value: city, label: city })) ?? [],
      state: facetState(facets, facets.data?.cities),
      onRetry: () => void facets.refetch(),
    },
  ];

  let content: React.ReactNode;
  if (result.isPending) {
    content = <PageState title="Загружаем авторов…" loading />;
  } else if (result.isError) {
    content = (
      <PageState
        title="Не удалось загрузить авторов"
        retry={() => void result.refetch()}
      />
    );
  } else if (result.items.length === 0) {
    content = (
      <PageState
        title={state.q ? 'Авторы не найдены' : 'Пока нет авторов'}
        message={
          state.q
            ? `По запросу «${state.q}» нет результатов.`
            : 'Попробуйте изменить или сбросить фильтры.'
        }
      />
    );
  } else {
    content = (
      <View style={{ gap: designTokens.space.x6 }}>
        <CreatorCardGrid
          items={result.items.map((item) => ({
            sellerProfile: item.author,
          }))}
        />
        {result.hasNextPage ? (
          <FigmaButton
            label="Показать ещё"
            variant="outline"
            width="full"
            loading={result.isFetchingNextPage}
            onPress={() => void result.fetchNextPage()}
          />
        ) : null}
      </View>
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x10,
          paddingBottom: designTokens.size.dockReserve,
          gap: designTokens.space.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="screenTitle">
            Креативные и проверенные авторы на Bidplace
          </AppText>
          <AppText role="bodySmall" tone="secondary">
            {AUTHORS_CATALOG_INTRO}
          </AppText>
        </View>
        <View>
          <FilterSortBar
            filterLabel={activeFilterLabel(state)}
            filterActive={Boolean(state.q || state.tag || state.city)}
            sortActive={state.sort !== 'added'}
            onPressFilter={() => setFilterOpen(true)}
            onPressSort={() => setSortOpen(true)}
          />
        </View>
        {content}
      </ScrollView>
      <CatalogFilterSheet
        open={filterOpen}
        search={{
          id: 'q',
          value: state.q,
          placeholder: 'Поиск по авторам',
        }}
        sections={sections}
        onClose={() => setFilterOpen(false)}
        onApply={(values) => {
          router.setParams({
            q: cleanDraftValue(values.q),
            tag: values.tag,
            city: values.city,
            sort: state.sort,
          });
          setFilterOpen(false);
        }}
      />
      <FilterSortSheet
        open={sortOpen}
        value={state.sort}
        options={AUTHOR_SORT_OPTIONS}
        onClose={() => setSortOpen(false)}
        onSelect={(sort) => {
          router.setParams({
            q: state.q,
            tag: state.tag,
            city: state.city,
            sort,
          });
        }}
      />
    </AppShell>
  );
}

function activeFilterLabel(state: PortfolioAuthorsRouteState) {
  const count = [state.q, state.tag, state.city].filter(Boolean).length;
  return count ? `Фильтры · ${count}` : 'Фильтры';
}

function cleanDraftValue(value?: string) {
  return value?.trim() || undefined;
}

function facetState(
  query: { isPending: boolean; isError: boolean },
  options?: ReadonlyArray<unknown>,
): CatalogFilterSection['state'] {
  if (query.isPending) return 'loading';
  if (query.isError) return 'error';
  if (options?.length === 0) return 'empty';
  return 'ready';
}

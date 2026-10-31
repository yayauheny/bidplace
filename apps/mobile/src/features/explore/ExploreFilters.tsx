import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FilterSortBar, FilterSortSheet } from '../../components/figma';
import {
  CatalogFilterSheet,
  type CatalogFilterSection,
} from '../discovery/CatalogFilterSheet';
import { useApiClient } from '../../providers/api-provider';
import { categoryKeys, portfolioKeys } from '../../lib/query-cache';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { AUTHOR_SORT_OPTIONS } from '../sellers/author-sort';
import { toPortfolioWorksRouteState } from '../products/portfolio-works-query';
import { toPortfolioAuthorsRouteState } from '../sellers/portfolio-authors-query';
import type { ExploreRoute } from './explore-route';

export function ExploreFilters({
  state,
  onChange,
  onSheetOpenChange,
}: {
  state: ExploreRoute;
  onChange: (state: ExploreRoute) => void;
  onSheetOpenChange: (open: boolean) => void;
}) {
  const api = useApiClient();
  const [sheet, setSheet] = useState<'filter' | 'sort' | null>(null);
  const changeSheet = (value: typeof sheet) => {
    setSheet(value);
    onSheetOpenChange(value !== null);
  };
  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.categories.list({ signal }),
    retry: retryTransientPublicQuery,
    enabled: state.section === 'works',
  });
  const facets = useQuery({
    queryKey: portfolioKeys.facets,
    queryFn: ({ signal }) => api.portfolio.facets({ signal }),
    retry: retryTransientPublicQuery,
  });
  const works = state.section === 'works';
  const active = works ? state.works : state.authors;
  const section = (
    id: string,
    label: string,
    value: string | undefined,
    options: CatalogFilterSection['options'],
    result: typeof facets | typeof categories,
  ): CatalogFilterSection => ({
    id,
    label,
    value,
    options,
    state: result.isPending
      ? 'loading'
      : result.isError
        ? 'error'
        : options.length
          ? 'ready'
          : 'empty',
    onRetry: () => void result.refetch(),
  });
  const sections = works
    ? [
        section(
          'category',
          'Категория',
          state.works.category,
          categories.data?.categories.map((item) => ({
            value: item.id,
            label: item.name,
          })) ?? [],
          categories,
        ),
        section(
          'material',
          'Материал',
          state.works.material,
          facets.data?.materials.map((value) => ({ value, label: value })) ??
            [],
          facets,
        ),
      ]
    : [
        section(
          'tag',
          'Направление',
          state.authors.tag,
          facets.data?.tags.map((value) => ({ value, label: value })) ?? [],
          facets,
        ),
        section(
          'city',
          'Город',
          state.authors.city,
          facets.data?.cities.map((value) => ({ value, label: value })) ?? [],
          facets,
        ),
      ];
  const apply = (values: Record<string, string | undefined>) => {
    onChange(
      works
        ? {
            ...state,
            works: toPortfolioWorksRouteState({ ...state.works, ...values }),
          }
        : {
            ...state,
            authors: toPortfolioAuthorsRouteState({
              ...state.authors,
              ...values,
            }),
          },
    );
  };
  return (
    <View>
      <FilterSortBar
        filterPresentation="icon"
        filterActive={sections.some((item) => Boolean(item.value))}
        sortActive={active.sort !== (works ? 'newest' : 'added')}
        onPressFilter={() => changeSheet('filter')}
        onPressSort={() => changeSheet('sort')}
      />
      <CatalogFilterSheet
        open={sheet === 'filter'}
        sections={sections}
        onClose={() => changeSheet(null)}
        onApply={(values) => {
          apply(values);
          changeSheet(null);
        }}
      />
      <FilterSortSheet
        open={sheet === 'sort'}
        value={active.sort}
        options={
          works
            ? [
                { value: 'newest', label: 'Сначала новые' },
                { value: 'oldest', label: 'Сначала старые' },
              ]
            : AUTHOR_SORT_OPTIONS
        }
        onClose={() => changeSheet(null)}
        onSelect={(sort) => apply({ sort })}
      />
    </View>
  );
}

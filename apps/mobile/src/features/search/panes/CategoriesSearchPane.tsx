import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  PaddedGrid,
  gridColumnsFromWidth,
} from '../../../components/figma/PaddedGrid';
import { retryTransientPublicQuery } from '../../../lib/query-retry';
import { categoryKeys } from '../../../lib/query-cache';
import { useApiClient } from '../../../providers/api-provider';
import { CategorySearchTile } from '../CategorySearchTile';
import { filterCategoriesByQuery } from '../filter-categories';
import { searchRequestQuery } from '../search-query';
import { SearchPaneStatus } from './search-pane-status';

export function CategoriesSearchPane({ query }: { query: string }) {
  const api = useApiClient();
  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.categories.list({ signal }),
    retry: retryTransientPublicQuery,
  });
  const items = filterCategoriesByQuery(
    categories.data?.categories ?? [],
    query,
  );
  const requestQuery = searchRequestQuery(query);
  const [contentWidth, setContentWidth] = useState(0);

  return (
    <SearchPaneStatus
      isPending={categories.isPending}
      isError={categories.isError}
      onRetry={() => void categories.refetch()}
      isEmpty={Boolean(requestQuery) && items.length === 0}
      emptyTitle="Категории не найдены"
      loading={<CategorySkeleton />}
    >
      <View
        style={{ width: '100%', gap: designTokens.space.x2 }}
        onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}
      >
        <PaddedGrid
          items={items}
          columns={gridColumnsFromWidth(contentWidth, {
            // Тайл категории 120.67 в дизайне (Figma); при 390 — три в ряд.
            minCardWidth: 120,
            gap: designTokens.space.x2,
            max: 3,
          })}
          gap={designTokens.space.x2}
          keyExtractor={(category) => category.id}
          renderItem={(category) => (
            <CategorySearchTile
              id={category.id}
              slug={category.slug}
              name={category.name}
            />
          )}
        />
      </View>
    </SearchPaneStatus>
  );
}

function CategorySkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      style={{ flexDirection: 'row', gap: designTokens.space.x2 }}
    >
      <SkeletonTile />
      <SkeletonTile />
      <SkeletonTile />
    </View>
  );
}

function SkeletonTile() {
  return (
    <View
      style={{
        flex: 1,
        aspectRatio: 120.67 / 160.89,
        borderRadius: designTokens.radius.small,
        backgroundColor: designTokens.color.surfaceMuted,
      }}
    />
  );
}

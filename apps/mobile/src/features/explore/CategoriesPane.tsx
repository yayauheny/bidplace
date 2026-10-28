import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { PaddedGrid } from '../../components/figma/PaddedGrid';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { categoryKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAppTheme } from '../../providers/theme-provider';
import { CategorySearchTile } from '../search/CategorySearchTile';
import { filterCategoriesByQuery } from '../search/filter-categories';
import { SearchPaneStatus } from '../search/panes/search-pane-status';

export function CategoriesPane({ query }: { query: string }) {
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

  return (
    <SearchPaneStatus
      isPending={categories.isPending}
      isError={categories.isError}
      onRetry={() => void categories.refetch()}
      isEmpty={items.length === 0}
      loading={<CategorySkeleton />}
    >
      <View style={{ width: '100%', gap: designTokens.space.x2 }}>
        <PaddedGrid
          items={items}
          columns={2}
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
    </View>
  );
}

function SkeletonTile() {
  const palette = useAppTheme();
  return (
    <View
      style={{
        flex: 1,
        aspectRatio: 264 / 352,
        borderRadius: designTokens.radius.small,
        backgroundColor: palette.surfaceMuted,
      }}
    />
  );
}

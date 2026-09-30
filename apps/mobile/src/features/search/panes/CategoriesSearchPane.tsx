import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { paddedGridRows } from '../../../components/figma/flex-grid-rows';
import { retryTransientPublicQuery } from '../../../lib/query-retry';
import { categoryKeys } from '../../../lib/query-cache';
import { useApiClient } from '../../../providers/api-provider';
import { CategorySearchTile } from '../CategorySearchTile';
import { filterCategoriesByQuery } from '../filter-categories';
import { searchRequestQuery } from '../search-query';
import { SearchPaneStatus } from './search-pane-status';

export function CategoriesSearchPane({
  query,
}: {
  query: string;
}) {
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

  return (
    <SearchPaneStatus
      isPending={categories.isPending}
      isError={categories.isError}
      onRetry={() => void categories.refetch()}
      isEmpty={Boolean(requestQuery) && items.length === 0}
      emptyTitle="Категории не найдены"
      loading={<CategorySkeleton />}
    >
      <View style={{ width: '100%', gap: figmaTokens.space.x2 }}>
        {paddedGridRows(items, 3).map((row, rowIndex) => (
          <View
            key={row.find((item) => item)?.id ?? `row-${rowIndex}`}
            style={{ flexDirection: 'row', gap: figmaTokens.space.x2 }}
          >
            {row.map((category, cellIndex) => (
              <View
                key={category?.id ?? `spacer-${rowIndex}-${cellIndex}`}
                style={{ flex: 1, minWidth: 0 }}
              >
                {category ? (
                  <CategorySearchTile
                    id={category.id}
                    slug={category.slug}
                    name={category.name}
                  />
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    </SearchPaneStatus>
  );
}

function CategorySkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      style={{ flexDirection: 'row', gap: figmaTokens.space.x2 }}
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
        borderRadius: figmaTokens.radius.small,
        backgroundColor: figmaTokens.color.surfaceMuted,
      }}
    />
  );
}

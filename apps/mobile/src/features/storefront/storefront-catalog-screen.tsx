import { useMemo, useState } from 'react';
import { Text, YStack } from 'tamagui';

import { ProductGrid } from '../../components/storefront/ProductGrid';
import { ProductToolbar } from '../../components/storefront/ProductToolbar';
import { EmptyState, ErrorState, Screen } from '../../components/ui';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { useApiClient } from '../../providers/api-provider';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { usePublicAuctionsQuery } from '../auctions/hooks';
import { demoProducts } from './demo-products';
import {
  filterStorefrontProducts,
  mapAuctionListItemToStorefrontProduct,
  sortStorefrontProducts,
} from './model';
import type { CatalogFilterValue } from '../../components/storefront/FilterSheet';
import type { CatalogSortValue } from '../../components/storefront/SortMenu';

export function StorefrontCatalogScreen() {
  const api = useApiClient();
  const query = usePublicAuctionsQuery();
  const [filterValue, setFilterValue] = useState<CatalogFilterValue>('all');
  const [sortValue, setSortValue] = useState<CatalogSortValue>('featured');
  const hasLiveAuctions = Boolean(query.data && query.data.auctions.length > 0);

  const products = useMemo(() => {
    const source = hasLiveAuctions
      ? (query.data?.auctions ?? []).map((item) =>
          mapAuctionListItemToStorefrontProduct(item, api.baseUrl),
        )
      : demoProducts;
    return sortStorefrontProducts(filterStorefrontProducts(source, filterValue), sortValue);
  }, [api.baseUrl, filterValue, hasLiveAuctions, query.data?.auctions, sortValue]);

  if (query.isError && !hasLiveAuctions) {
    return (
      <Screen>
        <YStack style={{ width: '100%', maxWidth: mobileLayout.pageMaxWidth, alignSelf: 'center' }}>
          <ErrorState
            description={getUserFacingErrorMessage(query.error, 'Не удалось загрузить каталог')}
            onAction={() => query.refetch()}
          />
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <YStack
        style={{
          width: '100%',
          maxWidth: mobileLayout.pageMaxWidth,
          alignSelf: 'center',
          gap: mobileSpacing[6],
        }}
      >
        <ProductToolbar
          title="Каталог"
          count={products.length}
          filterValue={filterValue}
          sortValue={sortValue}
          onFilterChange={setFilterValue}
          onSortChange={setSortValue}
        />
        {query.isError ? (
          <Text color="$danger" fontSize={13} lineHeight={18}>
            {getUserFacingErrorMessage(query.error, 'Показываем демонстрационные позиции')}
          </Text>
        ) : null}
        {products.length === 0 ? (
          <EmptyState
            title="Пока нет доступных лотов"
            description="Когда сервер вернёт публичные аукционы, они появятся здесь в новой витрине."
          />
        ) : (
          <ProductGrid products={products} loading={query.isLoading && !hasLiveAuctions} />
        )}
      </YStack>
    </Screen>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Text, XStack, YStack, useMedia } from 'tamagui';

import { ErrorState, LoadingState, EmptyState, Screen } from '../../components/ui';
import { ProductCard } from '../../components/ui/ProductCard';
import { useApiClient } from '../../providers/api-provider';
import { mobileSpacing, fontFamilies } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

export function ProductListScreen() {
  const api = useApiClient();
  const media = useMedia();
  const palette = useAppThemePalette();

  const query = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  // Loading state — full screen centred spinner
  if (query.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем предметы" />
      </Screen>
    );
  }

  // Error state — with retry
  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          description="Не удалось загрузить каталог. Проверьте соединение и повторите."
          kind={query.isError ? 'network' : 'generic'}
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const { products, pagination } = query.data;

  // Empty catalog
  if (products.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Пока нет предметов"
          description="Здесь появятся авторские предметы для торгов. Загляните позже."
        />
      </Screen>
    );
  }

  // Responsive column count: 2 on mobile, 3 on tablet, 4 on desktop
  const columns: number = media.wide ? 4 : media.desktop ? 3 : media.tablet ? 2 : 2;
  const gap = mobileSpacing[4];

  return (
    <Screen>
      <YStack style={{ gap: mobileSpacing[8] }}>
        {/* Page header */}
        <YStack style={{ gap: mobileSpacing[2] }}>
          <Text
            style={{
              fontFamily: fontFamilies.serifRegular,
              fontSize: 34,
              lineHeight: 42,
              fontWeight: '500',
              color: palette.color,
              letterSpacing: -0.5,
            }}
          >
            Каталог
          </Text>
          <Text
            style={{
              fontFamily: fontFamilies.sansRegular,
              fontSize: 14,
              lineHeight: 20,
              color: palette.colorMuted,
            }}
          >
            {pagination.total === 1
              ? '1 предмет'
              : `${pagination.total} предметов`}
          </Text>
        </YStack>

        {/* Product grid — plain flex wrap (no FlatList; web-first) */}
        <XStack
          style={{
            flexWrap: 'wrap',
            gap,
            marginHorizontal: -gap / 2,
          }}
        >
          {products.map(({ product, listing, sellerProfile }) => (
            <YStack
              key={product.id}
              style={{
                // Each card takes equal column width
                width: `${(100 / columns).toFixed(4)}%`,
                paddingHorizontal: gap / 2,
              }}
            >
              <ProductCard
                product={product}
                listing={listing}
                sellerProfile={sellerProfile}
              />
            </YStack>
          ))}
        </XStack>

        {/* Stale / refetching indicator */}
        {query.isFetching && !query.isLoading ? (
          <Text
            style={{
              fontFamily: fontFamilies.sansRegular,
              fontSize: 12,
              color: palette.colorMuted,
              textAlign: 'center',
            }}
          >
            Обновляем…
          </Text>
        ) : null}
      </YStack>
    </Screen>
  );
}

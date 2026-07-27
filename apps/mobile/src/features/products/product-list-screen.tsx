import { useQuery } from '@tanstack/react-query';
import { XStack, YStack, useMedia } from 'tamagui';

import { ErrorState, LoadingState, EmptyState } from '../../components/ui';
import { AppText, AuctionCard, ModernScreen } from '../../components/modern-ui';
import { useApiClient } from '../../providers/api-provider';
import { modernColors, modernSpacing } from '../../theme/modern-tokens';

export function ProductListScreen() {
  const api = useApiClient();
  const media = useMedia();

  const query = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  // Loading state — full screen centred spinner
  if (query.isLoading) {
    return (
      <ModernScreen width="wide">
        <LoadingState label="Загружаем предметы" />
      </ModernScreen>
    );
  }

  // Error state — with retry
  if (query.isError || !query.data) {
    return (
      <ModernScreen width="wide">
        <ErrorState
          description="Не удалось загрузить каталог. Проверьте соединение и повторите."
          kind={query.isError ? 'network' : 'generic'}
          onAction={() => void query.refetch()}
        />
      </ModernScreen>
    );
  }

  const { products, pagination } = query.data;

  // Empty catalog
  if (products.length === 0) {
    return (
      <ModernScreen width="wide">
        <EmptyState
          title="Пока нет предметов"
          description="Здесь появятся авторские предметы для торгов. Загляните позже."
        />
      </ModernScreen>
    );
  }

  // Responsive column count: 2 on mobile, 3 on tablet, 4 on desktop
  const columns: number = media.wide ? 4 : media.desktop ? 3 : media.tablet ? 2 : 2;
  const gap = modernSpacing.lg;

  return (
    <ModernScreen width="wide">
      <YStack style={{ gap: modernSpacing.section }}>
        <YStack style={{ gap: modernSpacing.sm }}>
          <AppText role="display">Каталог</AppText>
          <AppText role="metadata" color={modernColors.textSecondary}>
            {pagination.total === 1
              ? '1 предмет'
              : `${pagination.total} предметов`}
          </AppText>
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
              <AuctionCard
                product={product}
                listing={listing}
                sellerProfile={sellerProfile}
              />
            </YStack>
          ))}
        </XStack>

        {/* Stale / refetching indicator */}
        {query.isFetching && !query.isLoading ? (
          <AppText role="metadata" color={modernColors.textMuted} style={{ textAlign: 'center' }}>
            Обновляем…
          </AppText>
        ) : null}
      </YStack>
    </ModernScreen>
  );
}

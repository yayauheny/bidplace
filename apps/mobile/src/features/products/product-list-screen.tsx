import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  ScrollView,
  useWindowDimensions,
  View,
  type DimensionValue,
} from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AuctionCard,
  AppText,
  PageState,
  Skeleton,
} from '../../components/modern-ui';
import { useApiClient } from '../../providers/api-provider';

function CatalogLoading() {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: modernTokens.space.x4,
      }}
    >
      {[0, 1, 2, 3].map((key) => (
        <View
          key={key}
          style={{ flex: 1, minWidth: 220, gap: modernTokens.space.x2 }}
        >
          <Skeleton style={{ aspectRatio: 4 / 5 }} />
          <Skeleton style={{ width: '70%', height: 16 }} />
          <Skeleton style={{ width: '45%', height: 14 }} />
        </View>
      ))}
    </View>
  );
}

export function ProductListScreen() {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const query = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });
  const columns = width >= 1440 ? 4 : width >= 1025 ? 3 : 2;
  const cardWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  let content: ReactNode;
  if (query.isLoading) {
    content = <CatalogLoading />;
  } else if (query.isError || !query.data) {
    content = (
      <PageState
        title="Не удалось загрузить каталог"
        message="Проверьте соединение и повторите."
        retry={() => void query.refetch()}
      />
    );
  } else if (query.data.products.length === 0) {
    content = (
      <PageState
        title="Пока нет предметов"
        message="Здесь появятся авторские предметы для торгов. Загляните позже."
      />
    );
  } else {
    content = (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          margin: -modernTokens.space.x2,
        }}
      >
        {query.data.products.map((item) => (
          <View
            key={item.product.id}
            style={{ width: cardWidth, padding: modernTokens.space.x2 }}
          >
            <AuctionCard item={item} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          paddingHorizontal:
            width >= 768 ? modernTokens.space.x6 : modernTokens.space.x5,
          paddingVertical: modernTokens.space.x6,
          gap: modernTokens.space.x6,
        }}
        showsVerticalScrollIndicator={false}
      >
        {content}
        {query.isFetching && !query.isLoading ? (
          <AppText
            role="caption"
            tone="secondary"
            accessibilityLiveRegion="polite"
          >
            Обновляем каталог…
          </AppText>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

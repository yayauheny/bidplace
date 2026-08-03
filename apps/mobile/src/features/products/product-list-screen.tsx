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
  productMediaStyle,
  Skeleton,
} from '../../components/modern-ui';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from './catalog-layout';

function CatalogGrid({
  columns,
  count,
  renderCard,
}: {
  columns: 2 | 3 | 4;
  count: number;
  renderCard: (index: number) => ReactNode;
}) {
  const cardWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -modernTokens.space.x2,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{ width: cardWidth, padding: modernTokens.space.x2 }}
        >
          {renderCard(index)}
        </View>
      ))}
    </View>
  );
}

function CatalogCardSkeleton() {
  return (
    <View style={{ gap: modernTokens.space.x3 }}>
      <Skeleton
        style={{
          ...productMediaStyle(),
        }}
      />
      <View style={{ gap: modernTokens.space.x1 }}>
        <Skeleton style={{ width: '50%', height: 16 }} />
        <Skeleton style={{ width: '85%', height: 42 }} />
        <Skeleton style={{ width: '100%', height: 22 }} />
        <Skeleton style={{ width: '42%', height: 18 }} />
        <Skeleton style={{ width: '88%', height: 30 }} />
      </View>
    </View>
  );
}

function CatalogLoadingAnnouncement() {
  return (
    <AppText
      role="caption"
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
    >
      Загружаем каталог…
    </AppText>
  );
}

export function ProductListScreen() {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const query = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });
  const columns = getCatalogColumnCount(width);

  let content: ReactNode;
  if (query.isLoading) {
    content = (
      <CatalogGrid
        columns={columns}
        count={4}
        renderCard={() => <CatalogCardSkeleton />}
      />
    );
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
      <CatalogGrid
        columns={columns}
        count={query.data.products.length}
        renderCard={(index) => (
          <AuctionCard item={query.data.products[index]} />
        )}
      />
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
        {query.isLoading ? <CatalogLoadingAnnouncement /> : null}
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

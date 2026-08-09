import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  ScrollView,
  useWindowDimensions,
  View,
  type DimensionValue,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppText,
  AuctionCard,
  PageState,
  Skeleton,
} from '../../components/modern-ui';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from './catalog-layout';

type CatalogColumnCount = 1 | 2 | 3 | 4;

function CatalogGrid({
  columns,
  count,
  renderCard,
}: {
  columns: CatalogColumnCount;
  count: number;
  renderCard: (index: number) => ReactNode;
}) {
  const cardWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -designTokens.space.x2,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{ width: cardWidth, padding: designTokens.space.x2 }}
        >
          {renderCard(index)}
        </View>
      ))}
    </View>
  );
}

function CatalogCardSkeleton() {
  return (
    <View
      style={{
        overflow: 'hidden',
        borderRadius: designTokens.radius.card,
        backgroundColor: designTokens.color.surfaceMuted,
      }}
    >
      <Skeleton style={{ width: '100%', aspectRatio: 1, borderRadius: 0 }} />
      <View
        style={{
          minHeight: 134,
          gap: designTokens.space.x2,
          padding: designTokens.space.x4,
        }}
      >
        <Skeleton style={{ width: '78%', height: 23 }} />
        <Skeleton style={{ width: '48%', height: 20 }} />
        <View style={{ flex: 1 }} />
        <Skeleton style={{ width: '100%', height: 40 }} />
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
      Загружаем работы…
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
        count={columns === 1 ? 2 : columns * 2}
        renderCard={() => <CatalogCardSkeleton />}
      />
    );
  } else if (query.isError || !query.data) {
    content = (
      <PageState
        title="Не удалось загрузить работы"
        message="Проверьте соединение и повторите."
        retry={() => void query.refetch()}
      />
    );
  } else if (query.data.products.length === 0) {
    content = (
      <PageState
        title="Пока нет работ"
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
          paddingHorizontal:
            width >= designTokens.breakpoint.desktopShell
              ? designTokens.layout.desktopGutter
              : designTokens.layout.mobileGutter,
          paddingBottom: designTokens.space.x20,
          paddingTop:
            width >= designTokens.breakpoint.compactHeader
              ? designTokens.space.x16
              : designTokens.space.x10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.contentMaxWidth,
            alignSelf: 'center',
            gap: designTokens.space.x10,
          }}
        >
          <View style={{ maxWidth: 720, gap: designTokens.space.x3 }}>
            <AppText
              role={
                width >= designTokens.breakpoint.compactHeader
                  ? 'display'
                  : 'screenTitle'
              }
            >
              Работы
            </AppText>
            <AppText role="body" tone="secondary">
              Авторские предметы и живые аукционы bidplace.
            </AppText>
          </View>
          {query.isLoading ? <CatalogLoadingAnnouncement /> : null}
          {content}
          {query.isFetching && !query.isLoading ? (
            <AppText
              role="caption"
              tone="secondary"
              accessibilityLiveRegion="polite"
            >
              Обновляем работы…
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}

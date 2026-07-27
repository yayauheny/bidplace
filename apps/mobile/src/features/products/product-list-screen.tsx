import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useWindowDimensions, View, type DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppText, AuctionCard, PrimaryButton, Skeleton } from '../../components/modern-ui';
import { AppHeader } from '../../components/layout/AppHeader';
import { useApiClient } from '../../providers/api-provider';

function CatalogLoading() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: modernTokens.space.x4 }}>
      {[0, 1, 2, 3].map((key) => <View key={key} style={{ width: '47%', gap: modernTokens.space.x2 }}><Skeleton style={{ aspectRatio: 4 / 5 }} /><Skeleton style={{ width: '70%', height: 16 }} /><Skeleton style={{ width: '45%', height: 14 }} /></View>)}
    </View>
  );
}

export function ProductListScreen() {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const query = useQuery({ queryKey: ['products'], queryFn: () => api.products.list() });
  const columns = width >= 1440 ? 4 : width >= 1025 ? 3 : 2;
  const cardWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  let content: ReactNode;
  if (query.isLoading) {
    content = <CatalogLoading />;
  } else if (query.isError || !query.data) {
    content = <View style={{ alignItems: 'center', gap: modernTokens.space.x4, paddingVertical: modernTokens.space.x16 }}><AppText role="sectionTitle">Не удалось загрузить каталог</AppText><AppText role="bodySmall" tone="secondary" style={{ textAlign: 'center' }}>Проверьте соединение и повторите.</AppText><PrimaryButton label="Повторить" onPress={() => void query.refetch()} /></View>;
  } else if (query.data.products.length === 0) {
    content = <View style={{ alignItems: 'center', gap: modernTokens.space.x3, paddingVertical: modernTokens.space.x16 }}><AppText role="sectionTitle">Пока нет предметов</AppText><AppText role="bodySmall" tone="secondary" style={{ textAlign: 'center' }}>Здесь появятся авторские предметы для торгов. Загляните позже.</AppText></View>;
  } else {
    content = <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{query.data.products.map((item) => <View key={item.product.id} style={{ width: cardWidth, padding: modernTokens.space.x2 }}><AuctionCard item={item} /></View>)}</View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: modernTokens.color.canvas }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingHorizontal: width >= 768 ? modernTokens.space.x8 : modernTokens.space.x5, paddingVertical: modernTokens.space.x8, gap: modernTokens.space.x8 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: modernTokens.space.x2 }}><AppText role="screenTitle">Каталог</AppText><AppText role="metadata" tone="secondary">{query.data ? `${query.data.pagination.total} предметов` : 'Авторские предметы'}</AppText></View>
        {content}
        {query.isFetching && !query.isLoading ? <AppText role="metadata" tone="secondary" style={{ textAlign: 'center' }}>Обновляем…</AppText> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

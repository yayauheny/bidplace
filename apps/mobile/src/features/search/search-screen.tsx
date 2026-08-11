import { useQuery } from '@tanstack/react-query';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppText,
  AuctionCardGrid,
  CreatorCardGrid,
  PageState,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from '../products/catalog-layout';

export function SearchScreen({ query }: { query: string }) {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const products = useQuery({
    queryKey: ['products', { q: query }],
    queryFn: () => api.products.list({ q: query, limit: 12 }),
    enabled: Boolean(query),
  });
  const sellers = useQuery({
    queryKey: ['public-sellers', { q: query }],
    queryFn: () => api.sellers.listPublic({ q: query, limit: 8 }),
    enabled: Boolean(query),
  });
  const columns = getCatalogColumnCount(width);
  const loading = products.isLoading || sellers.isLoading;
  const failed = products.isError || sellers.isError;
  const productItems = products.data?.products ?? [];
  const sellerItems = sellers.data?.sellers ?? [];
  const hasResults = productItems.length > 0 || sellerItems.length > 0;

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
            gap: designTokens.space.x12,
          }}
        >
          <View style={{ maxWidth: 760, gap: designTokens.space.x3 }}>
            <AppText
              role={
                width >= designTokens.breakpoint.compactHeader
                  ? 'display'
                  : 'screenTitle'
              }
            >
              {query ? `Поиск: ${query}` : 'Поиск'}
            </AppText>
            <AppText role="body" tone="secondary">
              Работы и авторы bidplace.
            </AppText>
          </View>
          {!query ? (
            <PageState
              title="Введите запрос"
              message="Найдите предмет по названию, описанию или материалу либо автора по имени."
            />
          ) : loading ? (
            <PageState title="Ищем…" loading />
          ) : failed ? (
            <PageState
              title="Не удалось выполнить поиск"
              retry={() => {
                void products.refetch();
                void sellers.refetch();
              }}
            />
          ) : !hasResults ? (
            <PageState
              title="Ничего не найдено"
              message={`По запросу «${query}» нет результатов.`}
            />
          ) : (
            <>
              {sellerItems.length > 0 ? (
                <View style={{ gap: designTokens.space.x6 }}>
                  <AppText role="sectionTitle">Авторы</AppText>
                  <CreatorCardGrid items={sellerItems} columns={columns} />
                </View>
              ) : null}
              {productItems.length > 0 ? (
                <View style={{ gap: designTokens.space.x6 }}>
                  <AppText role="sectionTitle">Работы</AppText>
                  <AuctionCardGrid items={productItems} columns={columns} />
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </AppShell>
  );
}

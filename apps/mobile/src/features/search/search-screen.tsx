import { useQuery } from '@tanstack/react-query';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import {
  AppText,
  AuctionCardGrid,
  CreatorCardGrid,
  PageState,
  toAuctionCardItem,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from '../products/catalog-layout';

export function SearchScreen({ query }: { query: string }) {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const works = useQuery({
    queryKey: ['portfolio-works', { q: query }],
    queryFn: () => api.portfolio.listWorks({ q: query, limit: 12 }),
    enabled: Boolean(query),
  });
  const authors = useQuery({
    queryKey: ['portfolio-authors', { q: query }],
    queryFn: () => api.portfolio.listAuthors({ q: query, limit: 8 }),
    enabled: Boolean(query),
  });
  const columns = getCatalogColumnCount(width);
  const loading = works.isLoading || authors.isLoading;
  const failed = works.isError || authors.isError;
  const productItems = (works.data?.works ?? []).map(toAuctionCardItem);
  const sellerItems = (authors.data?.authors ?? []).map((item) => ({
    sellerProfile: item.author,
  }));
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
                void works.refetch();
                void authors.refetch();
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

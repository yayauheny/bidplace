import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';

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

export function SearchScreen({ query }: { query: string }) {
  const api = useApiClient();
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
  const productItems = (works.data?.works ?? []).map(toAuctionCardItem);
  const sellerItems = (authors.data?.authors ?? []).map((item) => ({
    sellerProfile: item.author,
  }));

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x10,
          paddingBottom: designTokens.space.x5,
          gap: designTokens.space.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="screenTitle">Поиск</AppText>
          <AppText role="bodySmall" tone="secondary">
            Полноценный поиск по категориям, авторам и работам появится позже.
            Сейчас можно открыть каталоги с нижней навигации.
          </AppText>
        </View>
        {query ? (
          <>
            {works.isError || authors.isError ? (
              <PageState title="Не удалось выполнить поиск" />
            ) : null}
            {productItems.length > 0 ? (
              <View style={{ gap: designTokens.space.x3 }}>
                <AppText role="label">Работы</AppText>
                <AuctionCardGrid items={productItems} />
              </View>
            ) : null}
            {sellerItems.length > 0 ? (
              <View style={{ gap: designTokens.space.x3 }}>
                <AppText role="label">Авторы</AppText>
                <CreatorCardGrid items={sellerItems} />
              </View>
            ) : null}
            {query &&
            !works.isLoading &&
            !authors.isLoading &&
            productItems.length === 0 &&
            sellerItems.length === 0 ? (
              <PageState
                title="Ничего не найдено"
                message={`По запросу «${query}» нет опубликованных работ и авторов.`}
              />
            ) : null}
          </>
        ) : (
          <PageState
            title="Поиск позже"
            message="Откройте работы или авторов из нижней навигации."
          />
        )}
      </ScrollView>
    </AppShell>
  );
}

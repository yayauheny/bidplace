import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import {
  FigmaButton,
  FilterSearchField,
  WorkCoverCardGrid,
} from '../../components/figma';
import { AppText, CreatorCardGrid, PageState } from '../../components/ui';
import { usePortfolioWorks } from '../products/use-portfolio-works';
import { usePortfolioAuthors } from '../sellers/use-portfolio-authors';

export function SearchScreen({ query }: { query: string }) {
  const router = useRouter();
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const enabled = Boolean(query);
  const works = usePortfolioWorks(
    {
      ...(query ? { q: query } : {}),
      sort: 'newest',
    },
    enabled,
  );
  const authors = usePortfolioAuthors(
    {
      ...(query ? { q: query } : {}),
      sort: 'added',
    },
    enabled,
  );
  const sellerItems = authors.items.map((item) => ({
    sellerProfile: item.author,
  }));
  const settledEmpty =
    enabled &&
    !works.isPending &&
    !authors.isPending &&
    !works.isError &&
    !authors.isError &&
    works.items.length === 0 &&
    authors.items.length === 0;

  const submitSearch = () => {
    router.setParams({ q: draftQuery.trim() || undefined });
  };

  return (
    <AppShell showSessionAlert={!works.isError && !authors.isError}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x10,
          paddingBottom: designTokens.size.dockReserve,
          gap: designTokens.space.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="screenTitle">Поиск</AppText>
          <AppText role="bodySmall" tone="secondary">
            Ищите опубликованные работы и проверенных авторов.
          </AppText>
        </View>
        <View style={{ gap: designTokens.space.x3 }}>
          <FilterSearchField
            value={draftQuery}
            onChangeText={setDraftQuery}
            placeholder="Работа или автор"
          />
          <FigmaButton
            label={!draftQuery.trim() && query ? 'Очистить' : 'Найти'}
            width="full"
            disabled={!draftQuery.trim() && !query}
            onPress={submitSearch}
          />
        </View>
        {enabled ? (
          <>
            <SearchResultSection title="Работы">
              {works.isPending ? (
                <PageState title="Ищем работы…" loading />
              ) : works.isError ? (
                <PageState
                  title="Не удалось загрузить работы"
                  retry={() => void works.refetch()}
                />
              ) : works.items.length > 0 ? (
                <View style={{ gap: designTokens.space.x5 }}>
                  <WorkCoverCardGrid items={works.items} />
                  {works.hasNextPage ? (
                    <FigmaButton
                      label="Показать ещё работы"
                      variant="outline"
                      width="full"
                      loading={works.isFetchingNextPage}
                      onPress={() => void works.fetchNextPage()}
                    />
                  ) : null}
                </View>
              ) : (
                <AppText role="bodySmall" tone="secondary">
                  Работы по запросу не найдены.
                </AppText>
              )}
            </SearchResultSection>
            <SearchResultSection title="Авторы">
              {authors.isPending ? (
                <PageState title="Ищем авторов…" loading />
              ) : authors.isError ? (
                <PageState
                  title="Не удалось загрузить авторов"
                  retry={() => void authors.refetch()}
                />
              ) : sellerItems.length > 0 ? (
                <View style={{ gap: designTokens.space.x5 }}>
                  <CreatorCardGrid items={sellerItems} />
                  {authors.hasNextPage ? (
                    <FigmaButton
                      label="Показать ещё авторов"
                      variant="outline"
                      width="full"
                      loading={authors.isFetchingNextPage}
                      onPress={() => void authors.fetchNextPage()}
                    />
                  ) : null}
                </View>
              ) : (
                <AppText role="bodySmall" tone="secondary">
                  Авторы по запросу не найдены.
                </AppText>
              )}
            </SearchResultSection>
            {settledEmpty ? (
              <PageState
                title="Ничего не найдено"
                message={`По запросу «${query}» нет опубликованных работ и авторов.`}
              />
            ) : null}
          </>
        ) : (
          <PageState
            title="Введите запрос"
            message="Поиск покажет совпадения среди опубликованных работ и авторов."
          />
        )}
      </ScrollView>
    </AppShell>
  );
}

function SearchResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View accessibilityLabel={title} style={{ gap: designTokens.space.x3 }}>
      <AppText role="sectionTitle" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

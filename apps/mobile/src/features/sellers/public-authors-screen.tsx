import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import type { PortfolioAuthorsQuery } from '@bidplace/contracts';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FilterMenu } from '../../components/layout';
import {
  AppText,
  CreatorCardGrid,
  PageState,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { AUTHORS_CATALOG_INTRO } from '../../lib/portfolio-copy';

type AuthorSort = PortfolioAuthorsQuery['sort'];

const authorSortOptions: Array<{ value: AuthorSort; label: string }> = [
  { value: 'added', label: 'По активности' },
  { value: 'name', label: 'По имени' },
];

export function PublicAuthorsScreen({
  query,
  sort = 'added',
}: {
  query?: string;
  sort?: AuthorSort;
}) {
  const api = useApiClient();
  const router = useRouter();
  const result = useQuery({
    queryKey: ['portfolio-authors', { q: query, sort }],
    queryFn: () =>
      api.portfolio.listAuthors(query ? { q: query, sort } : { sort }),
  });

  let content: React.ReactNode;
  if (result.isLoading) {
    content = <PageState title="Загружаем авторов…" loading />;
  } else if (result.isError || !result.data) {
    content = (
      <PageState
        title="Не удалось загрузить авторов"
        retry={() => void result.refetch()}
      />
    );
  } else if (result.data.authors.length === 0) {
    content = (
      <PageState
        title={query ? 'Авторы не найдены' : 'Пока нет авторов'}
        message={
          query
            ? `По запросу «${query}» нет результатов.`
            : 'Здесь появятся одобренные авторы bidplace.'
        }
      />
    );
  } else {
    content = (
      <CreatorCardGrid
        items={result.data.authors.map((item) => ({
          sellerProfile: item.author,
        }))}
      />
    );
  }

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
          <AppText role="screenTitle">
            {query ? `Авторы: ${query}` : 'Креативные и проверенные авторы на Bidplace'}
          </AppText>
          <AppText role="bodySmall" tone="secondary">
            {AUTHORS_CATALOG_INTRO}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: designTokens.space.x3 }}>
          <FilterMenu
            variant="sort"
            label="Сортировка"
            value={sort}
            options={authorSortOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            onSelect={(next) => {
              if (!next) return;
              router.setParams({ sort: next });
            }}
            dismissOnOutside
          />
        </View>
        {content}
      </ScrollView>
    </AppShell>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import type { PortfolioAuthorsQuery } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AuthorCoverCard } from '../../components/figma/AuthorCoverCard';
import { FigmaTextField } from '../../components/figma/FigmaTextField';
import { FilterOptionRow } from '../../components/figma/FilterOptionRow';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { FilterSortBar } from '../../components/figma/FilterSortBar';
import { AppShell } from '../../components/layout';
import { AppText, PageState, PrimaryButton } from '../../components/ui';
import { authorDisciplineTags } from './creator-profile-composition';
import {
  authorsCatalogHref,
  catalogHasFilters,
} from '../search/catalog-query';
import { useApiClient } from '../../providers/api-provider';

type AuthorSort = PortfolioAuthorsQuery['sort'];

const authorSortOptions: Array<{ value: AuthorSort; label: string }> = [
  { value: 'added', label: 'По активности' },
  { value: 'name', label: 'По имени' },
];

export function PublicAuthorsScreen({
  query,
  tag,
  city,
  sort = 'added',
  page = 1,
}: {
  query?: string;
  tag?: string;
  city?: string;
  sort?: AuthorSort;
  page?: number;
}) {
  const api = useApiClient();
  const { push } = useRouter();
  const result = useQuery({
    queryKey: ['portfolio-authors', { q: query, tag, city, sort, page }],
    queryFn: () =>
      api.portfolio.listAuthors({
        ...(query ? { q: query } : {}),
        ...(tag ? { tag } : {}),
        ...(city ? { city } : {}),
        sort,
        ...(page > 1 ? { page } : {}),
      }),
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [draftQ, setDraftQ] = useState(query ?? '');
  const [draftTag, setDraftTag] = useState(tag ?? '');
  const [draftCity, setDraftCity] = useState(city ?? '');
  const filtersActive = catalogHasFilters({ q: query, tag, city });

  useEffect(() => {
    if (!filterOpen) return;
    setDraftQ(query ?? '');
    setDraftTag(tag ?? '');
    setDraftCity(city ?? '');
  }, [city, filterOpen, query, tag]);

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
      <View style={{ gap: designTokens.space.sectionGap }}>
        {result.data.authors.map((item) => (
          <AuthorCoverCard
            key={item.author.slug}
            fullName={item.author.fullName}
            slug={item.author.slug}
            tags={authorDisciplineTags(item.author.discipline)}
            imageUrl={item.author.profilePhotoUrl}
          />
        ))}
      </View>
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
        </View>
        <FilterSortBar
          filterActive={filtersActive}
          sortActive={sort === 'name'}
          onFilterPress={() => setFilterOpen(true)}
          onSortPress={() => setSortOpen(true)}
        />
        {content}
        {result.data && result.data.pagination.total > result.data.pagination.limit ? (
          <View style={{ flexDirection: 'row', gap: designTokens.space.x3 }}>
            {page > 1 ? (
              <PrimaryButton
                label="Назад"
                onPress={() =>
                  push(
                    authorsCatalogHref({
                      q: query,
                      tag,
                      city,
                      sort,
                      page: page - 1,
                    }),
                  )
                }
              />
            ) : null}
            {page * result.data.pagination.limit < result.data.pagination.total ? (
              <PrimaryButton
                label="Дальше"
                onPress={() =>
                  push(
                    authorsCatalogHref({
                      q: query,
                      tag,
                      city,
                      sort,
                      page: page + 1,
                    }),
                  )
                }
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <FilterSheet
        open={filterOpen}
        title="Фильтры"
        count={result.data?.pagination.total}
        onClose={() => setFilterOpen(false)}
        onClear={() => {
          push(authorsCatalogHref({ sort }));
          setFilterOpen(false);
        }}
        onApply={() => {
          push(
            authorsCatalogHref({
              q: draftQ.trim() || undefined,
              tag: draftTag.trim() || undefined,
              city: draftCity.trim() || undefined,
              sort,
              page: 1,
            }),
          );
          setFilterOpen(false);
        }}
      >
        <FigmaTextField label="Запрос" value={draftQ} onChangeText={setDraftQ} />
        <FigmaTextField
          label="Направление"
          value={draftTag}
          onChangeText={setDraftTag}
        />
        <FigmaTextField label="Город" value={draftCity} onChangeText={setDraftCity} />
      </FilterSheet>
      <FilterSheet
        open={sortOpen}
        title="Сортировка"
        onClose={() => setSortOpen(false)}
        onApply={() => setSortOpen(false)}
      >
        {authorSortOptions.map((option) => (
          <FilterOptionRow
            key={option.value}
            label={option.label}
            mode="single"
            selected={sort === option.value}
            onPress={() => {
              push(
                authorsCatalogHref({
                  q: query,
                  tag,
                  city,
                  sort: option.value,
                  page: 1,
                }),
              );
              setSortOpen(false);
            }}
          />
        ))}
      </FilterSheet>
    </AppShell>
  );
}

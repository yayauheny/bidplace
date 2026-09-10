import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaTextField } from '../../components/figma/FigmaTextField';
import { FilterOptionRow } from '../../components/figma/FilterOptionRow';
import { FilterSearchField } from '../../components/figma/FilterSearchField';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { FilterSortBar } from '../../components/figma/FilterSortBar';
import { WorkCoverCard } from '../../components/figma/WorkCoverCard';
import { toggleMultiFilterValue } from '../../components/figma/filter-option-row';
import { AppShell } from '../../components/layout';
import { AppText, PageState, PrimaryButton } from '../../components/ui';
import {
  catalogHasFilters,
  worksCatalogHref,
} from '../search/catalog-query';
import { useApiClient } from '../../providers/api-provider';
import {
  toPortfolioWorksListQuery,
  type PortfolioCatalogSort,
} from './portfolio-works-query';

const sortOptions: Array<{ value: PortfolioCatalogSort; label: string }> = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
];

export function ProductListScreen({
  query: searchQuery,
  title = 'Каталог работ на Bidplace',
  sort = 'newest',
  category,
  materials = [],
  page = 1,
}: {
  query?: string;
  title?: string;
  sort?: PortfolioCatalogSort;
  category?: string;
  materials?: readonly string[];
  page?: number;
} = {}) {
  const api = useApiClient();
  const { push } = useRouter();
  const listQuery = toPortfolioWorksListQuery({
    q: searchQuery,
    category,
    materials,
    sort,
    page,
  });
  const query = useQuery({
    queryKey: ['portfolio-works', listQuery],
    queryFn: () => api.portfolio.listWorks(listQuery),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [draftQ, setDraftQ] = useState(searchQuery ?? '');
  const [draftCategory, setDraftCategory] = useState(category ?? '');
  const [draftMaterials, setDraftMaterials] = useState<string[]>([...materials]);
  const [materialQuery, setMaterialQuery] = useState('');
  const [optionQuery, setOptionQuery] = useState('');
  const filtersActive = catalogHasFilters({
    q: searchQuery,
    category,
    materials,
  });

  useEffect(() => {
    if (!filterOpen) return;
    setDraftQ(searchQuery ?? '');
    setDraftCategory(category ?? '');
    setDraftMaterials([...materials]);
    setMaterialQuery('');
    setOptionQuery('');
  }, [category, filterOpen, materials, searchQuery]);

  const applyFilters = () => {
    const nextMaterials = materialQuery.trim()
      ? toggleMultiFilterValue(draftMaterials, materialQuery.trim())
      : draftMaterials;
    push(
      worksCatalogHref({
        q: draftQ.trim() || undefined,
        category: draftCategory || undefined,
        materials: nextMaterials,
        sort,
        page: 1,
      }),
    );
    setFilterOpen(false);
  };

  let content: ReactNode;
  if (query.isLoading) {
    content = <PageState title="Загружаем работы…" loading />;
  } else if (query.isError || !query.data) {
    content = (
      <PageState
        title="Не удалось загрузить работы"
        message="Проверьте соединение и повторите."
        retry={() => void query.refetch()}
      />
    );
  } else if (query.data.works.length === 0) {
    content = (
      <PageState
        title="Пока нет работ"
        message="Здесь появятся авторские предметы. Загляните позже."
      />
    );
  } else {
    content = (
      <View style={{ gap: designTokens.space.sectionGap }}>
        {query.data.works.map((item) => (
          <WorkCoverCard
            key={item.work.publicId}
            href={`/product/${item.work.publicId}`}
            imageUrl={item.work.images[0]?.url ?? ''}
            imageLabel={item.work.title}
            title={item.work.title}
            authorSlug={item.author.slug}
            mode="portfolio"
          />
        ))}
      </View>
    );
  }

  const visibleCategories = (categories.data?.categories ?? []).filter((item) =>
    optionQuery.trim()
      ? item.name.toLowerCase().includes(optionQuery.trim().toLowerCase())
      : true,
  );

  return (
    <AppShell>
      <ScrollView
        testID="catalog-scroll-view"
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x10,
          paddingBottom: designTokens.space.x5,
          gap: designTokens.space.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="screenTitle">{title}</AppText>
        </View>
        <FilterSortBar
          filterActive={filtersActive}
          sortActive={sort === 'oldest'}
          onFilterPress={() => setFilterOpen(true)}
          onSortPress={() => setSortOpen(true)}
        />
        {content}
        {query.data && query.data.pagination.total > query.data.pagination.limit ? (
          <View style={{ flexDirection: 'row', gap: designTokens.space.x3 }}>
            {page > 1 ? (
              <PrimaryButton
                label="Назад"
                onPress={() =>
                  push(
                    worksCatalogHref({
                      q: searchQuery,
                      category,
                      materials,
                      sort,
                      page: page - 1,
                    }),
                  )
                }
              />
            ) : null}
            {page * query.data.pagination.limit < query.data.pagination.total ? (
              <PrimaryButton
                label="Дальше"
                onPress={() =>
                  push(
                    worksCatalogHref({
                      q: searchQuery,
                      category,
                      materials,
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
        count={query.data?.pagination.total}
        onClose={() => setFilterOpen(false)}
        onClear={() => {
          push(worksCatalogHref({ sort }));
          setFilterOpen(false);
        }}
        onApply={applyFilters}
      >
        <FigmaTextField
          label="Запрос"
          value={draftQ}
          onChangeText={setDraftQ}
        />
        <FilterSearchField value={optionQuery} onChangeText={setOptionQuery} />
        {visibleCategories.map((item) => (
          <FilterOptionRow
            key={item.id}
            label={item.name}
            mode="single"
            selected={draftCategory === item.id}
            onPress={() =>
              setDraftCategory((current) => (current === item.id ? '' : item.id))
            }
          />
        ))}
        {draftMaterials.map((item) => (
          <FilterOptionRow
            key={item}
            label={item}
            mode="multi"
            selected
            onPress={() => setDraftMaterials((current) => toggleMultiFilterValue(current, item))}
          />
        ))}
        <FigmaTextField
          label="Материал"
          value={materialQuery}
          onChangeText={setMaterialQuery}
        />
      </FilterSheet>
      <FilterSheet
        open={sortOpen}
        title="Сортировка"
        onClose={() => setSortOpen(false)}
        onApply={() => setSortOpen(false)}
      >
        {sortOptions.map((option) => (
          <FilterOptionRow
            key={option.value}
            label={option.label}
            mode="single"
            selected={sort === option.value}
            onPress={() => {
              push(
                worksCatalogHref({
                  q: searchQuery,
                  category,
                  materials,
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

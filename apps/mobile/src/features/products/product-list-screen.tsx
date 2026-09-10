import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FilterMenu } from '../../components/layout';
import {
  AppText,
  PageState,
  SecondaryButton,
} from '../../components/ui';
import { WorkCoverCardGrid } from '../../components/figma/WorkCoverCardGrid';
import { useApiClient } from '../../providers/api-provider';
import { CatalogCardSkeleton } from './CatalogCardSkeleton';
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
  material,
}: {
  query?: string;
  title?: string;
  sort?: PortfolioCatalogSort;
  category?: string;
  material?: string;
} = {}) {
  const api = useApiClient();
  const router = useRouter();
  const listQuery = toPortfolioWorksListQuery({
    q: searchQuery,
    category,
    material,
    sort,
  });
  const query = useQuery({
    queryKey: ['portfolio-works', listQuery],
    queryFn: () => api.portfolio.listWorks(listQuery),
  });

  let content: ReactNode;
  if (query.isLoading) {
    content = (
      <View style={{ gap: designTokens.space.sectionGap }}>
        <CatalogCardSkeleton />
        <CatalogCardSkeleton />
      </View>
    );
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
    content = <WorkCoverCardGrid items={query.data.works} />;
  }

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
          <AppText role="bodySmall" tone="secondary">
            Покупайте самые эксклюзивные коллекции наших избранных авторов, все
            увиденное вами это исключительно ручная работа
          </AppText>
        </View>
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: designTokens.color.divider,
            paddingBottom: 4,
            alignSelf: 'flex-start',
          }}
        >
          <AppText role="label">Все работы</AppText>
          <View
            style={{
              height: 2,
              backgroundColor: designTokens.color.ink,
              marginTop: 4,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: designTokens.space.x3 }}>
          <SecondaryButton
            label="Фильтры"
            icon="filter-horizontal"
            onPress={() => undefined}
            disabled
            accessibilityHint="Фильтры появятся вместе с поиском"
          />
          <FilterMenu
            variant="sort"
            label="Сортировка"
            value={sort}
            options={sortOptions}
            onSelect={(next) => {
              if (!next) return;
              router.setParams({
                sort: next,
                category,
                material,
              });
            }}
            dropdownAlign="left"
            dropdownMinWidth={190}
            dismissOnOutside
          />
        </View>
        {query.isLoading ? (
          <AppText
            role="caption"
            accessibilityRole="progressbar"
            accessibilityLiveRegion="polite"
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          >
            Загружаем работы…
          </AppText>
        ) : null}
        {content}
      </ScrollView>
    </AppShell>
  );
}

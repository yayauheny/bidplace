import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import type { PublicSellerSort } from '@bidplace/contracts';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FilterMenu } from '../../components/layout';
import {
  AppText,
  CreatorCardGrid,
  PageState,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from '../products/catalog-layout';

const authorSortOptions: Array<{ value: PublicSellerSort; label: string }> = [
  { value: 'activity', label: 'По активности' },
  { value: 'name', label: 'По имени' },
];

function AuthorSort({
  sort,
  onChange,
}: {
  sort: PublicSellerSort;
  onChange: (sort: PublicSellerSort) => void;
}) {
  return (
    <View style={{ alignSelf: 'flex-end', position: 'relative' }}>
      <FilterMenu
        variant="sort"
        label="Сортировка авторов"
        value={sort}
        options={authorSortOptions.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        onSelect={(next) => {
          if (!next) return;
          onChange(next as PublicSellerSort);
        }}
        dismissOnOutside={false}
      />
    </View>
  );
}

export function PublicAuthorsScreen({
  query,
  sort = 'activity',
}: {
  query?: string;
  sort?: PublicSellerSort;
}) {
  const api = useApiClient();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const result = useQuery({
    queryKey: ['public-sellers', { q: query, sort }],
    queryFn: () =>
      api.sellers.listPublic(query ? { q: query, sort } : { sort }),
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
  } else if (result.data.sellers.length === 0) {
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
        items={result.data.sellers}
        columns={getCatalogColumnCount(width)}
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
            width >= designTokens.breakpoint.desktopShell
              ? designTokens.space.x20 + designTokens.space.x6
              : width >= designTokens.breakpoint.compactHeader
                ? designTokens.space.x16
                : designTokens.space.x10,
        }}
        style={{ backgroundColor: designTokens.color.surfaceWarm }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.discoveryMaxWidth,
            alignSelf: 'center',
          }}
        >
          <View
            style={{
              gap:
                width >= designTokens.breakpoint.desktopShell
                  ? designTokens.space.x3
                  : designTokens.space.x6,
            }}
          >
            <View style={{ maxWidth: 720 }}>
              <AppText
                role="screenTitle"
                style={
                  width >= designTokens.breakpoint.compactHeader
                    ? { fontSize: 72, lineHeight: 69, letterSpacing: -2.5 }
                    : undefined
                }
              >
                {query ? `Авторы: ${query}` : 'Авторы'}
              </AppText>
            </View>
            <View
              style={{
                alignItems: 'flex-end',
                paddingBottom:
                  width >= designTokens.breakpoint.desktopShell
                    ? designTokens.space.x1
                    : 0,
              }}
            >
              <AuthorSort
                sort={sort}
                onChange={(nextSort) => router.setParams({ sort: nextSort })}
              />
            </View>
          </View>
          {content}
        </View>
      </ScrollView>
    </AppShell>
  );
}

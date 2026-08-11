import { useQuery } from '@tanstack/react-query';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppText,
  CreatorCardGrid,
  PageState,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from '../products/catalog-layout';

export function PublicAuthorsScreen({ query }: { query?: string }) {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const result = useQuery({
    queryKey: ['public-sellers', { q: query }],
    queryFn: () => api.sellers.listPublic(query ? { q: query } : {}),
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
            width >= designTokens.breakpoint.compactHeader
              ? designTokens.space.x16
              : designTokens.space.x10,
        }}
        style={{ backgroundColor: designTokens.color.surfaceWarm }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.contentMaxWidth,
            alignSelf: 'center',
            gap: designTokens.space.x10,
          }}
        >
          <View style={{ maxWidth: 720, gap: designTokens.space.x3 }}>
            <AppText
              role={
                width >= designTokens.breakpoint.compactHeader
                  ? 'display'
                  : 'screenTitle'
              }
            >
              {query ? `Авторы: ${query}` : 'Авторы'}
            </AppText>
            <AppText role="body" tone="secondary">
              Создатели предметов, представленных на bidplace.
            </AppText>
          </View>
          {content}
        </View>
      </ScrollView>
    </AppShell>
  );
}

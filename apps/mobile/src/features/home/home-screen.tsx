import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import {
  AppText,
  AuctionCardGrid,
  CreatorCardGrid,
  MotionPressable,
  PageState,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { getCatalogColumnCount } from '../products/catalog-layout';

function SectionLink({ href, label }: { href: '/works' | '/authors'; label: string }) {
  return (
    <Link href={href} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={label}
        preset="button"
        style={{
          minHeight: designTokens.size.touch,
          justifyContent: 'center',
          paddingHorizontal: designTokens.space.x2,
        }}
      >
        <AppText role="label">{label} →</AppText>
      </MotionPressable>
    </Link>
  );
}

export function HomeScreen() {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const home = useQuery({
    queryKey: ['discovery-home'],
    queryFn: () => api.discovery.home(),
  });
  const loading = home.isLoading;
  const failed = home.isError;
  const productItems = home.data?.topAuctions ?? [];
  const newWorkItems = home.data?.newWorks ?? [];
  const sellerItems = home.data?.creators ?? [];
  const columns = getCatalogColumnCount(width);

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{ paddingBottom: designTokens.space.x20 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.contentMaxWidth,
            alignSelf: 'center',
            gap: designTokens.space.x16,
            paddingHorizontal:
              width >= designTokens.breakpoint.desktopShell
                ? designTokens.layout.desktopGutter
                : designTokens.layout.mobileGutter,
            paddingTop:
              width >= designTokens.breakpoint.compactHeader
                ? designTokens.space.x20
                : designTokens.space.x12,
          }}
        >
          <AppText
            role={
              width >= designTokens.breakpoint.compactHeader
                ? 'display'
                : 'screenTitle'
            }
          >
            Работы в bidplace
          </AppText>
          {loading ? <PageState title="Загружаем bidplace…" loading /> : null}
          {failed ? (
            <PageState
              title="Не удалось загрузить главную"
              retry={() => {
                void home.refetch();
              }}
            />
          ) : null}
          {!loading && !failed && productItems.length > 0 ? (
            <View style={{ gap: designTokens.space.x6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: designTokens.space.x4,
                }}
              >
                <AppText role="sectionTitle">Аукционы</AppText>
                <SectionLink href="/works" label="Смотреть все работы" />
              </View>
              <AuctionCardGrid
                items={productItems}
                columns={Math.min(columns, 3) as 1 | 2 | 3}
              />
            </View>
          ) : null}
          {!loading && !failed && newWorkItems.length > 0 ? (
            <View style={{ gap: designTokens.space.x6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: designTokens.space.x4,
                }}
              >
                <AppText role="sectionTitle">Новые работы</AppText>
                <SectionLink href="/works" label="Смотреть все работы" />
              </View>
              <AuctionCardGrid
                items={newWorkItems}
                columns={Math.min(columns, 3) as 1 | 2 | 3}
              />
            </View>
          ) : null}
          {!loading && !failed && sellerItems.length > 0 ? (
            <View style={{ gap: designTokens.space.x6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: designTokens.space.x4,
                }}
              >
                <AppText role="sectionTitle">Авторы</AppText>
                <SectionLink href="/authors" label="Смотреть всех авторов" />
              </View>
              <CreatorCardGrid items={sellerItems} columns={columns} />
            </View>
          ) : null}
          {!loading && !failed && productItems.length === 0 && sellerItems.length === 0 ? (
            <PageState
              title="Пока здесь тихо"
              message="Новые работы и авторы появятся после публикации."
            />
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}

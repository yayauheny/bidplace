import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { BrandLogo } from '../../components/layout/BrandLogo';
import { AppShell } from '../../components/layout';
import {
  AppText,
  CreatorCardGrid,
  PageState,
  PrimaryButton,
} from '../../components/ui';
import { WorkCoverCardGrid } from '../../components/figma/WorkCoverCardGrid';
import { useApiClient } from '../../providers/api-provider';

export function HomeScreen() {
  const api = useApiClient();
  const router = useRouter();
  const home = useQuery({
    queryKey: ['portfolio-home'],
    queryFn: () => api.portfolio.home(),
  });
  const loading = home.isLoading;
  const failed = home.isError;
  const workItems = home.data?.newWorks ?? [];
  const sellerItems = (home.data?.newAuthors ?? []).map((author) => ({
    sellerProfile: author,
  }));

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          // Figma `436:1137`: logo 42×32 at y 60, first heading at y 132.
          paddingTop: designTokens.space.logoTop,
          paddingBottom: designTokens.size.dockReserve,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            alignItems: 'center',
            marginBottom: designTokens.space.logoGap,
          }}
        >
          <BrandLogo profile />
        </View>
        <View style={{ gap: designTokens.space.x10 }}>
          {loading ? <PageState title="Загружаем bidplace…" loading /> : null}
          {failed ? (
            <PageState
              title="Не удалось загрузить главную"
              retry={() => {
                void home.refetch();
              }}
            />
          ) : null}
          {!loading && !failed && workItems.length > 0 ? (
            <View style={{ gap: designTokens.space.sectionGap }}>
              <AppText role="sectionTitle" style={{ textAlign: 'center' }}>
                Новые работы
              </AppText>
              <WorkCoverCardGrid items={workItems} />
              <PrimaryButton
                label="Смотреть все"
                width="full"
                onPress={() => router.push('/works')}
              />
            </View>
          ) : null}
          {!loading && !failed && sellerItems.length > 0 ? (
            <View style={{ gap: designTokens.space.sectionGap }}>
              <AppText role="sectionTitle" style={{ textAlign: 'center' }}>
                Авторы
              </AppText>
              <CreatorCardGrid items={sellerItems} />
              <PrimaryButton
                label="Смотреть всех"
                width="full"
                onPress={() => router.push('/authors')}
              />
            </View>
          ) : null}
          {!loading &&
          !failed &&
          workItems.length === 0 &&
          sellerItems.length === 0 ? (
            <View style={{ gap: designTokens.space.sectionGap }}>
              <PageState
                title="Пока здесь тихо"
                message="Новые работы и авторы появятся после публикации."
              />
              <PrimaryButton
                label="Все работы"
                width="full"
                onPress={() => router.push('/works')}
              />
              <PrimaryButton
                label="Все авторы"
                width="full"
                onPress={() => router.push('/authors')}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}

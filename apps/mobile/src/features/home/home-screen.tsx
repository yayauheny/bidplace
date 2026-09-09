import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { BrandLogo } from '../../components/layout/BrandLogo';
import { AppShell } from '../../components/layout';
import {
  AppText,
  AuctionCardGrid,
  CreatorCardGrid,
  PageState,
  PrimaryButton,
  toAuctionCardItem,
} from '../../components/ui';
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
  const workItems = (home.data?.newWorks ?? []).map(toAuctionCardItem);
  const sellerItems = (home.data?.newAuthors ?? []).map((author) => ({
    sellerProfile: author,
  }));

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x6,
          paddingBottom: designTokens.space.x5,
          gap: designTokens.space.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          <BrandLogo />
        </View>
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
            <AuctionCardGrid items={workItems} />
            <PrimaryButton
              label="Смотреть все"
              width="full"
              onPress={() => router.push('/works')}
            />
          </View>
        ) : null}
        {!loading && !failed && sellerItems.length > 0 ? (
          <View style={{ gap: designTokens.space.sectionGap }}>
            <AppText role="sectionTitle">Авторы</AppText>
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
      </ScrollView>
    </AppShell>
  );
}

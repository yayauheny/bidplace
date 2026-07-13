import { useRouter } from 'expo-router';

import { AuctionCard } from '../../components/auction/AuctionCard';
import { AppButton, AppCard, EmptyState, ErrorState, LoadingState, Screen, SectionHeader, StatusBadge } from '../../components/ui';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { usePublicAuctionsQuery } from './hooks';
import { Text, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';
import { useAuth } from '../../providers/auth-provider';

export function AuctionListScreen() {
  const router = useRouter();
  const auth = useAuth();
  const query = usePublicAuctionsQuery();
  const palette = useAppThemePalette();

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем каталог" />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorState
          description={query.error instanceof Error ? query.error.message : 'Не удалось загрузить каталог'}
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  const auctions = query.data?.auctions ?? [];

  return (
    <Screen>
      <YStack
        style={{
          width: '100%',
          maxWidth: mobileLayout.contentMaxWidth,
          alignSelf: 'center',
          gap: mobileSpacing[4],
        }}
      >
        <YStack style={{ gap: mobileSpacing[2] }}>
          <StatusBadge tone="accent">Каталог</StatusBadge>
          <Text style={{ fontSize: 32, lineHeight: 38, fontWeight: '700', color: palette.text }}>
            Bidplace
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: palette.textMuted }}>
            Публичный каталог аукционов с реальными данными из API.
          </Text>
        </YStack>

        {auctions.length === 0 ? (
          <EmptyState
            title="Каталог пуст"
            description="Когда сервер вернёт аукционы, они появятся здесь."
            actionLabel="Вход"
            onAction={() => router.push('/login')}
          />
        ) : (
          <YStack style={{ gap: mobileSpacing[4] }}>
            <SectionHeader
              title="Аукционы"
              description={`Найдено ${auctions.length} карточек.`}
            />
            {auctions.map((item) => (
              <AuctionCard key={item.auction.id} {...item} />
            ))}
          </YStack>
        )}

        <YStack style={{ gap: mobileSpacing[2] }}>
          <AppButton tone="secondary" onPress={() => router.push('/login')}>
            Вход
          </AppButton>
          <AppButton tone="subtle" onPress={() => router.push('/register')}>
            Регистрация
          </AppButton>
        </YStack>

        {auth.ready && auth.isAuthenticated ? (
          <AppCard>
            <YStack style={{ gap: mobileSpacing[2] }}>
              <SectionHeader
                title="Личный кабинет"
                description="Переходите в seller или admin area, если они доступны вашему аккаунту."
              />
              <AppButton tone="secondary" onPress={() => router.push('/seller')}>
                Seller area
              </AppButton>
              {auth.canModerate ? (
                <AppButton tone="subtle" onPress={() => router.push('/admin')}>
                  Admin area
                </AppButton>
              ) : null}
            </YStack>
          </AppCard>
        ) : null}
      </YStack>
    </Screen>
  );
}

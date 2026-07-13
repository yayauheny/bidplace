import { useRouter } from 'expo-router';

import { AuctionCard } from '../../components/auction/AuctionCard';
import { usePublicAuctionsQuery, useSellerPublicProfileQuery } from '../auctions/hooks';
import { EmptyState, ErrorState, LoadingState, Screen, SectionHeader, AppCard } from '../../components/ui';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { formatNumber } from '../../lib/formatters';
import { Text, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';

type PublicSellerScreenProps = {
  slug: string;
};

export function PublicSellerScreen({ slug }: PublicSellerScreenProps) {
  const router = useRouter();
  const profileQuery = useSellerPublicProfileQuery(slug);
  const auctionsQuery = usePublicAuctionsQuery();
  const palette = useAppThemePalette();

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем профиль продавца" />
      </Screen>
    );
  }

  if (profileQuery.isError) {
    const status = (profileQuery.error as { status?: number } | null)?.status;
    if (status === 404) {
      return (
        <Screen>
          <EmptyState
            title="Профиль не найден"
            description="Проверьте ссылку или вернитесь к каталогу."
            actionLabel="В каталог"
            onAction={() => router.push('/')}
          />
        </Screen>
      );
    }

    return (
      <Screen>
        <ErrorState
          description={profileQuery.error instanceof Error ? profileQuery.error.message : 'Не удалось загрузить профиль'}
          onAction={() => profileQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!profileQuery.data) {
    return (
      <Screen>
        <EmptyState
          title="Профиль не найден"
          description="Проверьте ссылку или вернитесь к каталогу."
          actionLabel="В каталог"
          onAction={() => router.push('/')}
        />
      </Screen>
    );
  }

  const profile = profileQuery.data.sellerProfile;
  const relatedAuctions =
    auctionsQuery.data?.auctions.filter((item) => item.sellerProfile.slug === profile.slug) ?? [];

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
        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title={profile.storeName}
              description={profile.shortDescription ?? 'Описание не заполнено'}
            />
            <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
              Страна: {profile.country}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
              Тип: {profile.sellerType}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
              Контакт: {profile.contactPreference}
            </Text>
            {profile.socialLink ? (
              <Text style={{ fontSize: 14, lineHeight: 20, color: palette.primary }}>
                {profile.socialLink}
              </Text>
            ) : null}
          </YStack>
        </AppCard>

        <YStack style={{ gap: mobileSpacing[3] }}>
          <SectionHeader
            title="Аукционы продавца"
            description={`В каталоге сейчас ${formatNumber(relatedAuctions.length)} предложений.`}
          />
          {auctionsQuery.isLoading ? <LoadingState label="Подбираем аукционы" /> : null}
          {auctionsQuery.isError ? (
            <ErrorState
              description={auctionsQuery.error instanceof Error ? auctionsQuery.error.message : 'Не удалось загрузить аукционы'}
              onAction={() => auctionsQuery.refetch()}
            />
          ) : null}
          {!auctionsQuery.isLoading && !auctionsQuery.isError ? (
            relatedAuctions.length === 0 ? (
              <EmptyState
                title="Нет публичных аукционов"
                description="Сейчас у продавца нет активных или запланированных аукционов в каталоге."
              />
            ) : (
              <YStack style={{ gap: mobileSpacing[4] }}>
                {relatedAuctions.map((item) => (
                  <AuctionCard key={item.auction.id} {...item} />
                ))}
              </YStack>
            )
          ) : null}
        </YStack>
      </YStack>
    </Screen>
  );
}

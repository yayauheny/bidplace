'use client';

import { PageContainer, Heading, Text } from '../../components/ui/layout';
import { LoadingBlock, ErrorState, EmptyState } from '../../components/ui/states';
import { Card } from '../../components/ui/surfaces';
import { spacing } from '../../theme/tokens';
import { usePublicAuctionsQuery, useSellerPublicProfileQuery } from '../auctions/hooks';
import { AuctionCard } from '../auctions/auction-card';
import { XStack, YStack } from '../../components/ui/stack';

type PublicSellerScreenProps = {
  slug: string;
};

export function PublicSellerScreen({ slug }: PublicSellerScreenProps) {
  const profileQuery = useSellerPublicProfileQuery(slug);
  const auctionsQuery = usePublicAuctionsQuery();

  if (profileQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingBlock label="Загружаем профиль продавца" />
      </PageContainer>
    );
  }

  if (profileQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          description={profileQuery.error instanceof Error ? profileQuery.error.message : 'Не удалось загрузить профиль'}
          onAction={() => profileQuery.refetch()}
        />
      </PageContainer>
    );
  }

  if (!profileQuery.data) {
    return (
      <PageContainer>
        <EmptyState
          title="Профиль не найден"
          description="Проверьте ссылку или вернитесь к каталогу."
          actionLabel="В каталог"
          onAction={() => {
            window.location.href = '/';
          }}
        />
      </PageContainer>
    );
  }

  const profile = profileQuery.data.sellerProfile;
  const relatedAuctions =
    auctionsQuery.data?.auctions.filter(
      (item) => item.sellerProfile.slug === profile.slug,
    ) ?? [];

  return (
    <PageContainer>
      <Card>
        <YStack gap={spacing[3]}>
          <Heading level="display">{profile.storeName}</Heading>
          <Text tone="muted">{profile.shortDescription ?? 'Описание не заполнено'}</Text>
          <XStack gap={spacing[2]} flexWrap="wrap">
            <Text size="small">Страна: {profile.country}</Text>
            <Text size="small">Тип: {profile.sellerType}</Text>
            <Text size="small">Контакт: {profile.contactPreference}</Text>
          </XStack>
          {profile.socialLink ? (
            <a href={profile.socialLink} target="_blank" rel="noreferrer">
              <Text tone="accent">Социальная ссылка</Text>
            </a>
          ) : null}
        </YStack>
      </Card>

      <YStack gap={spacing[3]}>
        <Heading level="h2">Аукционы продавца</Heading>
        {auctionsQuery.isLoading ? <LoadingBlock label="Подбираем аукционы" /> : null}
        {auctionsQuery.isError ? (
          <ErrorState
            description={auctionsQuery.error instanceof Error ? auctionsQuery.error.message : 'Не удалось загрузить аукционы'}
            onAction={() => auctionsQuery.refetch()}
          />
        ) : null}
        {!auctionsQuery.isLoading && !auctionsQuery.isError ? relatedAuctions.length === 0 ? (
          <EmptyState
            title="Нет публичных аукционов"
            description="Сейчас у продавца нет активных или запланированных аукционов в каталоге."
          />
        ) : (
          <XStack flexDirection="row" flexWrap="wrap" gap={spacing[4]}>
            {relatedAuctions.map((item) => (
              <YStack key={item.auction.id} maxWidth={384} flexGrow={1}>
                <AuctionCard {...item} />
              </YStack>
            ))}
          </XStack>
        ) : null}
      </YStack>
    </PageContainer>
  );
}

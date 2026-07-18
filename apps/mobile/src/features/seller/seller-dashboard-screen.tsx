import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';

import {
  AppButton,
  AppCard,
  DetailList,
  EmptyState,
  EntityPanel,
  ErrorState,
  LoadingState,
  PageIntro,
  Screen,
  SectionHeader,
  StatGrid,
} from '../../components/ui';
import { formatCurrencyAmount, formatNumber } from '../../lib/formatters';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { getAuctionStatusLabel } from '../auctions/utils';
import { useMySellerAuctionsQuery, useMySellerLotsQuery } from './hooks';
import { useSellerProfileRequirement } from './profile-requirement';

export function SellerDashboardScreen() {
  const router = useRouter();
  const profileRequirement = useSellerProfileRequirement(
    'Не удалось загрузить seller dashboard',
  );
  const lotsQuery = useMySellerLotsQuery(
    undefined,
    profileRequirement.kind === 'ready',
  );
  const auctionsQuery = useMySellerAuctionsQuery(
    undefined,
    profileRequirement.kind === 'ready',
  );

  if (profileRequirement.kind === 'loading') {
    return (
      <Screen mode="seller">
        <LoadingState label="Загружаем seller dashboard" />
      </Screen>
    );
  }

  if (profileRequirement.kind === 'missing') {
    return (
      <Screen mode="seller">
        <EmptyState
          title="Профиль продавца не создан"
          description="Создайте seller profile, чтобы открыть lot и auction workflow."
          actionLabel="Создать профиль"
          onAction={() => router.push('/profile')}
        />
      </Screen>
    );
  }

  if (profileRequirement.kind === 'error') {
    return (
      <Screen mode="seller">
        <ErrorState
          description={profileRequirement.message}
          onAction={() => profileRequirement.retry()}
        />
      </Screen>
    );
  }

  const profile = profileRequirement.profile;
  const lots = lotsQuery.data?.lots ?? [];
  const auctions = auctionsQuery.data?.auctions ?? [];

  return (
    <Screen mode="seller">
      <YStack
        style={{
          width: '100%',
          maxWidth: mobileLayout.contentMaxWidth,
          alignSelf: 'center',
          gap: mobileSpacing[5],
        }}
      >
        <PageIntro
          badge={{ label: 'Seller area', tone: 'accent' }}
          title="Seller workspace"
          description="Управляйте профилем, lot-ами и аукционами в одном рабочем пространстве, которое визуально совпадает с публичной витриной."
        />

        <StatGrid
          items={[
            { label: 'Профиль', value: profile.storeName },
            { label: 'Lot-ов', value: formatNumber(lots.length) },
            { label: 'Auction-ов', value: formatNumber(auctions.length) },
          ]}
        />

        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title={profile.storeName}
              description={profile.shortDescription ?? 'Публичный профиль продавца'}
              actionLabel="Редактировать"
              onAction={() => router.push('/profile')}
            />
            <DetailList
              items={[
                { label: 'Slug', value: profile.slug },
                { label: 'Страна', value: profile.country },
                { label: 'Тип', value: profile.sellerType },
                { label: 'Контакт', value: profile.contactPreference },
                ...(profile.socialLink ? [{ label: 'Ссылка', value: profile.socialLink }] : []),
              ]}
            />
          </YStack>
        </AppCard>

        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title="Lot-ы"
              description={`Всего ${formatNumber(lots.length)} записей.`}
              actionLabel="Создать lot"
              onAction={() => router.push('/lots/new')}
            />
            {lotsQuery.isLoading ? <LoadingState label="Загружаем lot-ы" /> : null}
            {lotsQuery.isError ? (
              <ErrorState
                description={getUserFacingErrorMessage(
                  lotsQuery.error,
                  'Не удалось загрузить lot-ы',
                )}
                onAction={() => lotsQuery.refetch()}
              />
            ) : null}
            {!lotsQuery.isLoading && !lotsQuery.isError ? (
              lots.length === 0 ? (
                <EmptyState
                  title="Пока нет lot-ов"
                  description="Создайте первый lot, затем на его основе откройте auction."
                  actionLabel="Создать lot"
                  onAction={() => router.push('/lots/new')}
                />
              ) : (
                <YStack style={{ gap: mobileSpacing[2] }}>
                  {lots.slice(0, 3).map((lot) => (
                    <EntityPanel
                      key={lot.id}
                      eyebrow={lot.status}
                      title={lot.title}
                      subtitle={lot.condition}
                    />
                  ))}
                </YStack>
              )
            ) : null}
          </YStack>
        </AppCard>

        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title="Auction-ы"
              description={`Всего ${formatNumber(auctions.length)} записей.`}
              actionLabel="Создать auction"
              onAction={() => router.push('/auctions/new')}
            />
            {auctionsQuery.isLoading ? <LoadingState label="Загружаем auction-ы" /> : null}
            {auctionsQuery.isError ? (
              <ErrorState
                description={getUserFacingErrorMessage(
                  auctionsQuery.error,
                  'Не удалось загрузить auction-ы',
                )}
                onAction={() => auctionsQuery.refetch()}
              />
            ) : null}
            {!auctionsQuery.isLoading && !auctionsQuery.isError ? (
              auctions.length === 0 ? (
                <EmptyState
                  title="Пока нет auction-ов"
                  description="Откройте auction на базе draft lot."
                  actionLabel="Создать auction"
                  onAction={() => router.push('/auctions/new')}
                />
              ) : (
                <YStack style={{ gap: mobileSpacing[2] }}>
                  {auctions.slice(0, 3).map((auction) => (
                    <EntityPanel
                      key={auction.id}
                      eyebrow={getAuctionStatusLabel(auction.status)}
                      title={auction.slug}
                      subtitle={formatCurrencyAmount(auction.currentPrice, auction.currency)}
                    />
                  ))}
                </YStack>
              )
            ) : null}
          </YStack>
        </AppCard>
      </YStack>
    </Screen>
  );
}

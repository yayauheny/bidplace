import { useRouter } from 'expo-router';

import { AppButton, AppCard, EmptyState, ErrorState, LoadingState, Screen, SectionHeader, StatusBadge } from '../../components/ui';
import { formatCurrencyAmount, formatNumber } from '../../lib/formatters';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { Text, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { getAuctionStatusLabel, getAuctionStatusTone } from '../auctions/utils';
import {
  useMySellerAuctionsQuery,
  useMySellerLotsQuery,
} from './hooks';
import { useSellerProfileRequirement } from './profile-requirement';

export function SellerDashboardScreen() {
  const router = useRouter();
  const palette = useAppThemePalette();
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
      <Screen>
        <LoadingState label="Загружаем seller dashboard" />
      </Screen>
    );
  }

  if (profileRequirement.kind === 'missing') {
    return (
      <Screen>
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
      <Screen>
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
          <StatusBadge tone="accent">Seller area</StatusBadge>
          <Text style={{ fontSize: 32, lineHeight: 38, fontWeight: '700', color: palette.text }}>
            Dashboard
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: palette.textMuted }}>
            Управляйте seller profile, lot-ами и auction-ами из одного места.
          </Text>
        </YStack>

        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title={profile?.storeName ?? 'Профиль не создан'}
              description={profile?.shortDescription ?? 'Публичный профиль продавца'}
            />
            {profile ? (
              <YStack style={{ gap: mobileSpacing[1] }}>
                <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
                  Slug: {profile.slug}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
                  Страна: {profile.country}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
                  Тип: {profile.sellerType}
                </Text>
              </YStack>
            ) : (
              <EmptyState
                title="Профиль не заполнен"
                description="Создайте профиль, чтобы открыть seller flow."
                actionLabel="Создать профиль"
                onAction={() => router.push('/profile')}
              />
            )}
            <AppButton tone="secondary" onPress={() => router.push('/profile')}>
              {profile ? 'Редактировать профиль' : 'Создать профиль'}
            </AppButton>
          </YStack>
        </AppCard>

        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title="Lot-ы"
              description={`Всего ${formatNumber(lots.length)} записей.`}
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
                    <AppCard key={lot.id}>
                      <YStack style={{ gap: mobileSpacing[1] }}>
                        <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: palette.text }}>
                          {lot.title}
                        </Text>
                        <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
                          {lot.condition}
                        </Text>
                        <StatusBadge tone="neutral">{lot.status}</StatusBadge>
                      </YStack>
                    </AppCard>
                  ))}
                  <AppButton tone="secondary" onPress={() => router.push('/lots/new')}>
                    Создать lot
                  </AppButton>
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
                    <AppCard key={auction.id}>
                      <YStack style={{ gap: mobileSpacing[1] }}>
                        <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: palette.text }}>
                          {auction.slug}
                        </Text>
                        <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
                          {formatCurrencyAmount(auction.currentPrice, auction.currency)}
                        </Text>
                        <StatusBadge tone={getAuctionStatusTone(auction.status)}>
                          {getAuctionStatusLabel(auction.status)}
                        </StatusBadge>
                      </YStack>
                    </AppCard>
                  ))}
                  <AppButton tone="secondary" onPress={() => router.push('/auctions/new')}>
                    Создать auction
                  </AppButton>
                </YStack>
              )
            ) : null}
          </YStack>
        </AppCard>
      </YStack>
    </Screen>
  );
}

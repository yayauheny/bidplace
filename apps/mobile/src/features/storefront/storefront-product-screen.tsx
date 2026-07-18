import { Link, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Text, XStack, YStack } from 'tamagui';

import { AppButton, AppCard, EmptyState, ErrorState, LoadingState, Screen, StatusBadge } from '../../components/ui';
import { BidHistory } from '../../components/auction/BidHistory';
import { BidPanel } from '../../components/auction/BidPanel';
import { formatCurrencyAmount, formatDateTime, formatNumber } from '../../lib/formatters';
import { getErrorStatus, getUserFacingErrorMessage } from '../../lib/errors';
import { useApiClient } from '../../providers/api-provider';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { usePublicAuctionQuery } from '../auctions/hooks';
import { getAuctionStatusLabel, getAuctionStatusTone } from '../auctions/utils';
import { mapAuctionDetailToStorefrontProduct } from './model';

type StorefrontProductScreenProps = {
  slug: string;
};

export function StorefrontProductScreen({ slug }: StorefrontProductScreenProps) {
  const router = useRouter();
  const api = useApiClient();
  const query = usePublicAuctionQuery(slug);

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем страницу лота" />
      </Screen>
    );
  }

  if (query.isError) {
    const status = getErrorStatus(query.error);

    if (status === 404) {
      return (
        <Screen>
          <EmptyState
            title="Лот не найден"
            description="Проверьте ссылку или вернитесь в каталог."
            actionLabel="В каталог"
            onAction={() => router.push('/catalog')}
          />
        </Screen>
      );
    }

    return (
      <Screen>
        <ErrorState
          description={getUserFacingErrorMessage(query.error, 'Не удалось загрузить страницу лота')}
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  if (!query.data) {
    return (
      <Screen>
        <EmptyState
          title="Лот не найден"
          description="Проверьте ссылку или вернитесь в каталог."
          actionLabel="В каталог"
          onAction={() => router.push('/catalog')}
        />
      </Screen>
    );
  }

  const product = mapAuctionDetailToStorefrontProduct(query.data, api.baseUrl);
  const { auction, lot, sellerProfile, bids } = query.data;

  return (
    <Screen>
      <YStack
        style={{
          width: '100%',
          maxWidth: mobileLayout.pageMaxWidth,
          alignSelf: 'center',
          gap: mobileSpacing[6],
        }}
      >
        <XStack style={{ flexWrap: 'wrap', gap: mobileSpacing[5], alignItems: 'flex-start' }}>
          <YStack style={{ flex: 1, minWidth: 320, gap: mobileSpacing[3] }}>
            <YStack style={{ aspectRatio: 4 / 5, backgroundColor: '#F0F0EE' }}>
              <Image source={{ uri: product.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            </YStack>
          </YStack>
          <YStack style={{ flex: 1, minWidth: 320, gap: mobileSpacing[4] }}>
            <StatusBadge tone={getAuctionStatusTone(auction.status)}>
              {getAuctionStatusLabel(auction.status)}
            </StatusBadge>
            <YStack gap={mobileSpacing[2]}>
              <Text color="$text" fontFamily="$heading" fontSize={44} lineHeight={48}>
                {lot.title}
              </Text>
              <Text color="$textMuted" fontSize={16} lineHeight={24}>
                {sellerProfile.storeName} · {sellerProfile.country}
              </Text>
            </YStack>
            <Text color="$text" fontSize={18} lineHeight={26}>
              {lot.description}
            </Text>
            <Text color="$text" fontSize={20} lineHeight={28}>
              {formatCurrencyAmount(auction.currentPrice, auction.currency)}
            </Text>
            <YStack gap={mobileSpacing[1]}>
              <Text color="$textMuted" fontSize={13} lineHeight={18}>
                Шаг ставки: {formatCurrencyAmount(auction.bidStep, auction.currency)}
              </Text>
              <Text color="$textMuted" fontSize={13} lineHeight={18}>
                Резерв: {formatCurrencyAmount(auction.reservePrice, auction.currency)}
              </Text>
              <Text color="$textMuted" fontSize={13} lineHeight={18}>
                Ставок: {formatNumber(auction.bidCount)}
              </Text>
              <Text color="$textMuted" fontSize={13} lineHeight={18}>
                Старт {formatDateTime(auction.startsAt)} · Финиш {formatDateTime(auction.endsAt)}
              </Text>
            </YStack>
            <AppCard>
              <YStack gap={mobileSpacing[3]}>
                <Text color="$text" fontSize={18} lineHeight={24} fontWeight="600">
                  Участвовать в аукционе
                </Text>
                <BidPanel auction={auction} />
              </YStack>
            </AppCard>
            <Link href={`/sellers/${sellerProfile.slug}`} asChild>
              <Pressable>
                <AppButton tone="secondary">Профиль продавца</AppButton>
              </Pressable>
            </Link>
          </YStack>
        </XStack>

        <AppCard>
          <YStack gap={mobileSpacing[3]}>
            <Text color="$text" fontSize={18} lineHeight={24} fontWeight="600">
              История ставок
            </Text>
            <BidHistory bids={bids} currency={auction.currency} />
          </YStack>
        </AppCard>
      </YStack>
    </Screen>
  );
}

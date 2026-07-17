import { useRouter } from 'expo-router';

import { AuctionGallery } from '../../components/auction/AuctionGallery';
import { AuctionStateBanner } from '../../components/auction/AuctionStateBanner';
import { BidHistory } from '../../components/auction/BidHistory';
import { BidPanel } from '../../components/auction/BidPanel';
import { SellerSummary } from '../../components/auction/SellerSummary';
import { AppCard, EmptyState, ErrorState, LoadingState, Price, Screen, SectionHeader, StatusBadge } from '../../components/ui';
import { usePublicAuctionQuery } from './hooks';
import { formatCurrencyAmount, formatNumber, formatDateTime } from '../../lib/formatters';
import { getAuctionStatusLabel, getAuctionStatusTone } from './utils';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { Text, YStack } from 'tamagui';
import { resolveMediaUrl } from '../../lib/media';
import { useApiClient } from '../../providers/api-provider';
import { useAppThemePalette } from '../../theme/palette';
import {
  getErrorStatus,
  getUserFacingErrorMessage,
} from '../../lib/errors';

type AuctionDetailScreenProps = {
  slug: string;
};

export function AuctionDetailScreen({ slug }: AuctionDetailScreenProps) {
  const router = useRouter();
  const api = useApiClient();
  const query = usePublicAuctionQuery(slug);
  const palette = useAppThemePalette();

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем аукцион" />
      </Screen>
    );
  }

  if (query.isError) {
    const status = getErrorStatus(query.error);
    if (status === 404) {
      return (
        <Screen>
          <EmptyState
            title="Аукцион не найден"
            description="Проверьте ссылку или вернитесь в каталог."
            actionLabel="В каталог"
            onAction={() => router.push('/')}
          />
        </Screen>
      );
    }

    return (
      <Screen>
        <ErrorState
          description={getUserFacingErrorMessage(
            query.error,
            'Не удалось загрузить аукцион',
          )}
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  if (!query.data) {
    return (
      <Screen>
        <EmptyState
          title="Аукцион не найден"
          description="Проверьте ссылку или вернитесь в каталог."
          actionLabel="В каталог"
          onAction={() => router.push('/')}
        />
      </Screen>
    );
  }

  const { auction, lot, sellerProfile, bids } = query.data;
  const reserveReached = auction.currentPrice >= auction.reservePrice;
  const image = lot.images[0];
  const imageUrl = image ? resolveMediaUrl(image, api.baseUrl) : null;

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
          <StatusBadge tone={getAuctionStatusTone(auction.status)}>
            {getAuctionStatusLabel(auction.status)}
          </StatusBadge>
          <Text style={{ fontSize: 28, lineHeight: 34, fontWeight: '700', color: palette.text }}>
            {lot.title}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
            {sellerProfile.storeName} · {sellerProfile.country}
          </Text>
        </YStack>

        <AuctionStateBanner auction={auction} reserveReached={reserveReached} />

        <YStack style={{ gap: mobileSpacing[4] }}>
          <AuctionGallery title={lot.title} imageUrls={imageUrl ? [imageUrl] : []} />

          <AppCard>
            <YStack style={{ gap: mobileSpacing[2] }}>
              <SectionHeader title="Лот" description={lot.condition} />
              <Text style={{ fontSize: 14, lineHeight: 22, color: palette.text }}>
                {lot.description}
              </Text>
            </YStack>
          </AppCard>

          <AppCard>
            <YStack style={{ gap: mobileSpacing[2] }}>
              <SectionHeader title="Сводка" />
              <Price value={auction.currentPrice} currency={auction.currency} />
              <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
                Шаг ставки: {formatCurrencyAmount(auction.bidStep, auction.currency)}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
                Ставок: {formatNumber(auction.bidCount)}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: palette.text }}>
                Резерв: {formatCurrencyAmount(auction.reservePrice, auction.currency)}
              </Text>
              <Text style={{ fontSize: 12, lineHeight: 16, color: palette.textMuted }}>
                Старт {formatDateTime(auction.startsAt)} · Финиш {formatDateTime(auction.endsAt)}
              </Text>
            </YStack>
          </AppCard>

          <SellerSummary sellerProfile={sellerProfile} />

          <AppCard>
            <YStack style={{ gap: mobileSpacing[3] }}>
              <SectionHeader title="Сделать ставку" description="Ставка отправляется на сервер через API." />
              <BidPanel auction={auction} />
            </YStack>
          </AppCard>

          <AppCard>
            <YStack style={{ gap: mobileSpacing[3] }}>
              <SectionHeader title="История ставок" />
              <BidHistory bids={bids} currency={auction.currency} />
            </YStack>
          </AppCard>
        </YStack>
      </YStack>
    </Screen>
  );
}

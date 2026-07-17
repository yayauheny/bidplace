import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import type { AuctionListItem } from '@bidplace/contracts';

import { formatNumber } from '../../lib/formatters';
import { resolveMediaUrl } from '../../lib/media';
import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { AppCard, Price, StatusBadge } from '../ui';
import { AuctionTimer } from './AuctionTimer';
import { getAuctionStatusLabel, getAuctionStatusTone } from '../../features/auctions/utils';
import { Text, XStack, YStack } from 'tamagui';
import { useApiClient } from '../../providers/api-provider';
import { useAppThemePalette } from '../../theme/palette';

type AuctionCardProps = AuctionListItem;

export function AuctionCard({ auction, lot, sellerProfile }: AuctionCardProps) {
  const router = useRouter();
  const api = useApiClient();
  const palette = useAppThemePalette();
  const image = lot.images[0];
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/auctions/${auction.slug}`)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <AppCard>
        <YStack style={{ gap: mobileSpacing[3] }}>
          <YStack
            style={{
              overflow: 'hidden',
              borderRadius: mobileRadius.lg,
              aspectRatio: 4 / 3,
              backgroundColor: palette.surfaceMuted,
            }}
          >
            {image && !imageFailed ? (
              <Image
                source={{ uri: resolveMediaUrl(image, api.baseUrl) }}
                accessibilityLabel={lot.title}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
                onError={() => setImageFailed(true)}
              />
            ) : null}
          </YStack>

          <YStack style={{ gap: mobileSpacing[2] }}>
            <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: mobileSpacing[2] }}>
              <StatusBadge tone={getAuctionStatusTone(auction.status)}>
                {getAuctionStatusLabel(auction.status)}
              </StatusBadge>
              <Text style={{ fontSize: 12, lineHeight: 16, color: palette.textMuted }}>
                {formatNumber(auction.bidCount)} ставок
              </Text>
            </XStack>

            <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: '700', color: palette.text }}>
              {lot.title}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
              {sellerProfile.storeName}
            </Text>
          </YStack>

          <YStack style={{ gap: mobileSpacing[2] }}>
            <Price value={auction.currentPrice} currency={auction.currency} />
            <AuctionTimer startsAt={auction.startsAt} endsAt={auction.endsAt} status={auction.status} />
          </YStack>
        </YStack>
      </AppCard>
    </Pressable>
  );
}

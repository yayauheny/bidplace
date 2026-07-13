import type { Auction } from '@bidplace/contracts';

import { AppCard, StatusBadge } from '../ui';
import { getAuctionStatusLabel, getAuctionStatusTone } from '../../features/auctions/utils';
import { Text, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';

type AuctionStateBannerProps = {
  auction: Auction;
  reserveReached: boolean;
};

export function AuctionStateBanner({ auction, reserveReached }: AuctionStateBannerProps) {
  const palette = useAppThemePalette();
  const tone = getAuctionStatusTone(auction.status);
  const label = getAuctionStatusLabel(auction.status);

  const description =
    auction.status === 'active'
      ? reserveReached
        ? 'Резерв достигнут, торги идут в пользу текущей цены.'
        : 'Резерв пока не достигнут.'
      : auction.status === 'scheduled'
        ? 'Аукцион скоро начнётся.'
        : auction.status === 'sold'
          ? 'Победная ставка подтверждена сервером.'
          : auction.status === 'ended'
            ? 'Ставки больше не принимаются.'
            : auction.status === 'cancelled'
              ? 'Аукцион отменён.'
              : 'Состояние аукциона зафиксировано сервером.';

  return (
    <AppCard>
      <YStack style={{ gap: 12 }}>
        <StatusBadge tone={tone}>{label}</StatusBadge>
        <Text style={{ fontSize: 16, lineHeight: 24, color: palette.text, fontWeight: '600' }}>
          {description}
        </Text>
      </YStack>
    </AppCard>
  );
}

import type { PublicBid } from '@bidplace/contracts';

import { formatCurrencyAmount, formatDateTime } from '../../lib/formatters';
import { mobileSpacing } from '../../theme/tokens';
import { EmptyState, StatusBadge, AppCard } from '../ui';
import { getBidStatusLabel, getBidStatusTone } from '../../features/auctions/utils';
import { Text, XStack, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';

type BidHistoryProps = {
  bids: Array<PublicBid>;
  currency: string;
};

export function BidHistory({ bids, currency }: BidHistoryProps) {
  const palette = useAppThemePalette();
  if (bids.length === 0) {
    return (
      <EmptyState
        title="Ставок пока нет"
        description="Станьте первым участником торгов."
      />
    );
  }

  return (
    <AppCard>
      <YStack style={{ gap: mobileSpacing[3] }}>
        {bids.map((bid) => (
          <XStack
            key={bid.id}
            style={{ alignItems: 'center', justifyContent: 'space-between', gap: mobileSpacing[2] }}
          >
            <YStack style={{ gap: 4 }}>
              <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: palette.text }}>
                {formatCurrencyAmount(bid.amount, currency)}
              </Text>
              <Text style={{ fontSize: 12, lineHeight: 16, color: palette.textMuted }}>
                {formatDateTime(bid.createdAt)}
              </Text>
            </YStack>
            <StatusBadge tone={getBidStatusTone(bid.status)}>
              {getBidStatusLabel(bid.status)}
            </StatusBadge>
          </XStack>
        ))}
      </YStack>
    </AppCard>
  );
}

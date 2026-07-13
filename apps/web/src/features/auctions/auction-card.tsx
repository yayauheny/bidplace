import Link from 'next/link';
import Image from 'next/image';

import type { AuctionListItem } from '@bidplace/contracts';

import { formatCurrencyAmount, formatNumber } from '../../lib/formatters';
import { resolveMediaUrl } from '../../lib/media';
import { radius, spacing } from '../../theme/tokens';
import { Text, Heading } from '../../components/ui/layout';
import { Card, StatusBadge } from '../../components/ui/surfaces';
import { TimeframeFrame } from '../../components/ui/time';
import { getAuctionStatusLabel, getAuctionStatusTone } from './utils';
import { XStack, YStack } from '../../components/ui/stack';

type AuctionCardProps = AuctionListItem;

export function AuctionCard({ auction, lot, sellerProfile }: AuctionCardProps) {
  const image = lot.images[0];

  return (
    <Link href={`/auctions/${auction.slug}`}>
      <Card>
        <YStack gap={spacing[3]}>
          <YStack
            position="relative"
            borderRadius={radius.lg}
            overflow="hidden"
            minHeight={220}
            backgroundColor="$backgroundMuted"
          >
            {image ? (
              <Image
                src={resolveMediaUrl(image)}
                alt={lot.title}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 384px"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <YStack flex={1} />
            )}
          </YStack>

          <YStack gap={spacing[2]}>
            <XStack alignItems="center" justifyContent="space-between" gap={spacing[2]}>
              <StatusBadge tone={getAuctionStatusTone(auction.status)}>
                {getAuctionStatusLabel(auction.status)}
              </StatusBadge>
              <Text size="caption" tone="muted">
                {formatNumber(auction.bidCount)} ставок
              </Text>
            </XStack>

            <Heading level="h3">{lot.title}</Heading>
            <Text tone="muted">{sellerProfile.storeName}</Text>
          </YStack>

          <YStack gap={spacing[2]}>
            <Text size="small" weight="strong">
              {formatCurrencyAmount(auction.currentPrice, auction.currency)}
            </Text>
            <TimeframeFrame
              startsAt={auction.startsAt}
              endsAt={auction.endsAt}
              status={auction.status}
            />
          </YStack>
        </YStack>
      </Card>
    </Link>
  );
}

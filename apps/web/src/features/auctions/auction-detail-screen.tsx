'use client';

import Link from 'next/link';
import Image from 'next/image';

import { formatCurrencyAmount, formatDateTime, formatNumber } from '../../lib/formatters';
import { resolveMediaUrl } from '../../lib/media';
import { PageContainer, Heading, Text } from '../../components/ui/layout';
import { LoadingBlock, ErrorState, EmptyState } from '../../components/ui/states';
import { Card, StatusBadge } from '../../components/ui/surfaces';
import { TimeframeFrame } from '../../components/ui/time';
import { spacing, radius } from '../../theme/tokens';
import { usePublicAuctionQuery } from './hooks';
import { BidForm } from './bid-form';
import { useAuctionRealtime } from './realtime';
import {
  getAuctionStatusLabel,
  getAuctionStatusTone,
  getBidStatusLabel,
  getBidStatusTone,
} from './utils';
import { XStack, YStack } from '../../components/ui/stack';
import { usePublicApiUrl } from '../../providers/api-provider';

type AuctionDetailScreenProps = {
  slug: string;
};

export function AuctionDetailScreen({ slug }: AuctionDetailScreenProps) {
  const query = usePublicAuctionQuery(slug);
  useAuctionRealtime(query.data?.auction.id);
  const baseUrl = usePublicApiUrl();

  if (query.isLoading) {
    return (
      <PageContainer>
        <LoadingBlock label="Загружаем аукцион" />
      </PageContainer>
    );
  }

  if (query.isError) {
    return (
      <PageContainer>
        <ErrorState
          description={query.error instanceof Error ? query.error.message : 'Не удалось загрузить аукцион'}
          onAction={() => query.refetch()}
        />
      </PageContainer>
    );
  }

  if (!query.data) {
    return (
      <PageContainer>
        <EmptyState
          title="Аукцион не найден"
          description="Проверьте ссылку или вернитесь в каталог."
          actionLabel="В каталог"
          onAction={() => {
            window.location.href = '/';
          }}
        />
      </PageContainer>
    );
  }

  const { auction, lot, sellerProfile, bids } = query.data;
  const reserveReached = auction.currentPrice >= auction.reservePrice;
  const image = lot.images[0];

  return (
    <PageContainer>
      <YStack gap={spacing[3]}>
        <StatusBadge tone={getAuctionStatusTone(auction.status)}>
          {getAuctionStatusLabel(auction.status)}
        </StatusBadge>
        <Heading level="display">{lot.title}</Heading>
        <Text tone="muted">
          {sellerProfile.storeName} · {sellerProfile.country}
        </Text>
      </YStack>

      {auction.status === 'ended' || auction.status === 'sold' || auction.status === 'failed' ? (
        <Card>
          <Heading level="h3">
            {auction.status === 'sold'
              ? 'Аукцион завершен продажей'
              : auction.status === 'failed'
                ? 'Аукцион не состоялся'
                : 'Аукцион завершен'}
          </Heading>
          <Text tone="muted">
            {auction.status === 'sold'
              ? 'Победная ставка уже определена сервером.'
              : auction.status === 'failed'
                ? 'Сервер пометил аукцион как неудачный.'
                : 'Ставки больше не принимаются.'}
          </Text>
        </Card>
      ) : null}

      <XStack flexWrap="wrap" gap={spacing[4]} alignItems="flex-start">
        <YStack flex={1} minWidth={320} gap={spacing[4]}>
          <Card>
            <YStack
              position="relative"
              borderRadius={radius.lg}
              overflow="hidden"
              minHeight={320}
              backgroundColor="$backgroundMuted"
            >
              {image ? (
              <Image
                  src={resolveMediaUrl(image, baseUrl)}
                  alt={lot.title}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 720px"
                  style={{ objectFit: 'cover' }}
                />
              ) : null}
            </YStack>
            <Text>{lot.description}</Text>
            <Text tone="muted">Состояние: {lot.condition}</Text>
          </Card>

          <Card>
            <Heading level="h3">Ставки</Heading>
            {bids.length === 0 ? (
              <EmptyState
                title="Ставок пока нет"
                description="Станьте первым участником торгов."
              />
            ) : (
              <YStack gap={spacing[2]}>
                {bids.map((bid) => (
                  <XStack
                    key={bid.id}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={spacing[2]}
                  >
                    <YStack gap={spacing[1]}>
                      <Text weight="strong">
                        {formatCurrencyAmount(bid.amount, auction.currency)}
                      </Text>
                      <Text size="caption" tone="muted">
                        {formatDateTime(bid.createdAt)}
                      </Text>
                    </YStack>
                    <StatusBadge tone={getBidStatusTone(bid.status)}>
                      {getBidStatusLabel(bid.status)}
                    </StatusBadge>
                  </XStack>
                ))}
              </YStack>
            )}
          </Card>
        </YStack>

        <YStack flex={0.9} minWidth={320} gap={spacing[4]}>
          <Card>
            <Heading level="h3">Сводка</Heading>
            <YStack gap={spacing[2]}>
              <Text>
                Текущая цена: {formatCurrencyAmount(auction.currentPrice, auction.currency)}
              </Text>
              <Text>
                Шаг ставки: {formatCurrencyAmount(auction.bidStep, auction.currency)}
              </Text>
              <Text>
                Ставок: {formatNumber(auction.bidCount)}
              </Text>
              <Text>
                Резерв: {formatCurrencyAmount(auction.reservePrice, auction.currency)}
              </Text>
              <Text tone={reserveReached ? 'success' : 'muted'}>
                {reserveReached
                  ? 'Резерв достигнут.'
                  : 'Резерв ещё не достигнут, ставка может не перейти в продажу.'}
              </Text>
            </YStack>
          </Card>

          <TimeframeFrame
            startsAt={auction.startsAt}
            endsAt={auction.endsAt}
            status={auction.status}
          />

          <Card>
            <Heading level="h3">Продавец</Heading>
            <Text weight="strong">{sellerProfile.storeName}</Text>
            <Text tone="muted">{sellerProfile.shortDescription ?? 'Описание не заполнено'}</Text>
            <Text size="caption" tone="muted">
              {sellerProfile.contactPreference}
            </Text>
            <Link href={`/sellers/${sellerProfile.slug}`}>
              <Text tone="accent">Открыть профиль продавца</Text>
            </Link>
          </Card>

          <Card>
            <Heading level="h3">Сделать ставку</Heading>
            <BidForm auction={auction} />
          </Card>
        </YStack>
      </XStack>
    </PageContainer>
  );
}

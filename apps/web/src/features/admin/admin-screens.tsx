'use client';

import Link from 'next/link';

import { formatCurrencyAmount, formatDateTime, formatNumber } from '../../lib/formatters';
import { PageContainer, Heading, Text } from '../../components/ui/layout';
import { Card, StatusBadge } from '../../components/ui/surfaces';
import { LoadingBlock, ErrorState, EmptyState } from '../../components/ui/states';
import { PrimaryButton, SecondaryButton } from '../../components/ui/controls';
import { spacing } from '../../theme/tokens';
import { useAdminAuctionsQuery, useAdminAuctionBidsQuery, useAdminUsersQuery, useBanUserMutation, useHideAuctionMutation } from './hooks';
import { getAuctionStatusLabel, getAuctionStatusTone, getBidStatusLabel, getBidStatusTone } from '../auctions/utils';
import { XStack, YStack } from '../../components/ui/stack';

export function AdminHomeScreen() {
  return (
    <PageContainer>
      <Heading level="display">Admin</Heading>
      <Text tone="muted">
        Пользователи, аукционы и модерация собраны в один компактный интерфейс.
      </Text>
      <XStack flexDirection="row" flexWrap="wrap" gap={spacing[3]}>
        <Card>
          <Heading level="h3">Пользователи</Heading>
          <Text tone="muted">Просмотр и бан аккаунтов.</Text>
          <PrimaryButton asChild>
            <Link href="/admin/users">Открыть пользователей</Link>
          </PrimaryButton>
        </Card>
        <Card>
          <Heading level="h3">Аукционы</Heading>
          <Text tone="muted">Скрытие аукционов и просмотр ставок.</Text>
          <PrimaryButton asChild>
            <Link href="/admin/auctions">Открыть аукционы</Link>
          </PrimaryButton>
        </Card>
      </XStack>
    </PageContainer>
  );
}

export function AdminUsersScreen() {
  const query = useAdminUsersQuery();
  const banMutation = useBanUserMutation();

  return (
    <PageContainer>
      <Heading level="display">Пользователи</Heading>

      {query.isLoading ? <LoadingBlock label="Загружаем пользователей" /> : null}
      {query.isError ? (
        <ErrorState
          description={query.error instanceof Error ? query.error.message : 'Не удалось загрузить пользователей'}
          onAction={() => query.refetch()}
        />
      ) : null}
      {query.data && query.data.users.length === 0 ? (
        <EmptyState
          title="Пользователей нет"
          description="В базе пока нет аккаунтов для модерации."
        />
      ) : null}

      <YStack gap={spacing[3]}>
        {query.data?.users.map((user) => (
          <Card key={user.id}>
            <XStack justifyContent="space-between" gap={spacing[3]} flexWrap="wrap">
              <YStack gap={spacing[1]}>
                <Heading level="h3">{user.displayName}</Heading>
                <Text tone="muted">{user.email}</Text>
                <Text size="caption" tone="muted">
                  {user.role} · {user.status}
                </Text>
              </YStack>
              <SecondaryButton
                onPress={() => banMutation.mutate(user.id)}
                isLoading={banMutation.isPending}
              >
                Забанить
              </SecondaryButton>
            </XStack>
          </Card>
        ))}
      </YStack>
    </PageContainer>
  );
}

export function AdminAuctionsScreen() {
  const query = useAdminAuctionsQuery();
  const hideMutation = useHideAuctionMutation();

  return (
    <PageContainer>
      <Heading level="display">Аукционы</Heading>

      {query.isLoading ? <LoadingBlock label="Загружаем аукционы" /> : null}
      {query.isError ? (
        <ErrorState
          description={query.error instanceof Error ? query.error.message : 'Не удалось загрузить аукционы'}
          onAction={() => query.refetch()}
        />
      ) : null}
      {query.data && query.data.auctions.length === 0 ? (
        <EmptyState title="Аукционов нет" description="Скрывать пока нечего." />
      ) : null}

      <YStack gap={spacing[3]}>
        {query.data?.auctions.map((auction) => (
          <Card key={auction.id}>
            <XStack justifyContent="space-between" gap={spacing[3]} flexWrap="wrap">
              <YStack gap={spacing[2]}>
                <Heading level="h3">{auction.slug}</Heading>
                <StatusBadge tone={getAuctionStatusTone(auction.status)}>
                  {getAuctionStatusLabel(auction.status)}
                </StatusBadge>
                <Text size="caption" tone="muted">
                  {formatCurrencyAmount(auction.currentPrice, auction.currency)} · {formatNumber(auction.bidCount)} ставок
                </Text>
                <Text size="caption" tone="muted">
                  {formatDateTime(auction.endsAt)}
                </Text>
              </YStack>
              <XStack gap={spacing[2]}>
                <SecondaryButton asChild>
                  <Link href={`/admin/auctions/${auction.id}/bids`}>Ставки</Link>
                </SecondaryButton>
                <PrimaryButton
                  onPress={() => hideMutation.mutate(auction.id)}
                  isLoading={hideMutation.isPending}
                >
                  Скрыть
                </PrimaryButton>
              </XStack>
            </XStack>
          </Card>
        ))}
      </YStack>
    </PageContainer>
  );
}

export function AdminAuctionBidsScreen({ auctionId }: { auctionId: string }) {
  const query = useAdminAuctionBidsQuery(auctionId);

  return (
    <PageContainer>
      <Heading level="display">Ставки по аукциону</Heading>
      <Text tone="muted">{auctionId}</Text>

      {query.isLoading ? <LoadingBlock label="Загружаем ставки" /> : null}
      {query.isError ? (
        <ErrorState
          description={query.error instanceof Error ? query.error.message : 'Не удалось загрузить ставки'}
          onAction={() => query.refetch()}
        />
      ) : null}
      {query.data && query.data.bids.length === 0 ? (
        <EmptyState title="Ставок нет" description="На этом аукционе пока нет ставок." />
      ) : null}

      <YStack gap={spacing[3]}>
        {query.data?.bids.map((bid) => (
          <Card key={bid.id}>
            <XStack justifyContent="space-between" gap={spacing[3]} flexWrap="wrap">
              <YStack gap={spacing[1]}>
                <Heading level="h3">{formatCurrencyAmount(bid.amount)}</Heading>
                <Text size="caption" tone="muted">
                  {formatDateTime(bid.createdAt)}
                </Text>
              </YStack>
              <StatusBadge tone={getBidStatusTone(bid.status)}>
                {getBidStatusLabel(bid.status)}
              </StatusBadge>
            </XStack>
          </Card>
        ))}
      </YStack>
    </PageContainer>
  );
}

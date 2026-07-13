import { AppButton, AppCard, EmptyState, ErrorState, LoadingState, Screen, SectionHeader, StatusBadge } from '../../components/ui';
import { formatCurrencyAmount, formatNumber } from '../../lib/formatters';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { Text, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';
import { getAuctionStatusLabel, getAuctionStatusTone } from '../auctions/utils';
import { useAdminAuctionsQuery, useAdminUsersQuery, useBanUserMutation, useHideAuctionMutation } from './hooks';

export function AdminDashboardScreen() {
  const palette = useAppThemePalette();
  const usersQuery = useAdminUsersQuery();
  const auctionsQuery = useAdminAuctionsQuery();
  const banUserMutation = useBanUserMutation();
  const hideAuctionMutation = useHideAuctionMutation();
  const users = usersQuery.data?.users ?? [];
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
          <StatusBadge tone="danger">Admin area</StatusBadge>
          <Text style={{ fontSize: 32, lineHeight: 38, fontWeight: '700', color: palette.text }}>
            Moderation dashboard
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: palette.textMuted }}>
            Управляйте пользователями и аукционами с server-backed actions.
          </Text>
        </YStack>

        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title="Users"
              description={`Всего ${formatNumber(users.length)} записей.`}
            />
            {banUserMutation.isError ? (
              <ErrorState
                description={
                  banUserMutation.error instanceof Error
                    ? banUserMutation.error.message
                    : 'Не удалось заблокировать пользователя'
                }
              />
            ) : null}
            {usersQuery.isLoading ? <LoadingState label="Загружаем пользователей" /> : null}
            {usersQuery.isError ? (
              <ErrorState
                description={
                  usersQuery.error instanceof Error
                    ? usersQuery.error.message
                    : 'Не удалось загрузить пользователей'
                }
                onAction={() => usersQuery.refetch()}
              />
            ) : null}
            {!usersQuery.isLoading && !usersQuery.isError ? (
              users.length === 0 ? (
                <EmptyState title="Пользователей нет" description="Список пользователей пуст." />
              ) : (
                <YStack style={{ gap: mobileSpacing[2] }}>
                  {users.map((user) => (
                    <AppCard key={user.id}>
                      <YStack style={{ gap: mobileSpacing[2] }}>
                        <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: palette.text }}>
                          {user.displayName}
                        </Text>
                        <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
                          {user.email}
                        </Text>
                        <StatusBadge tone={user.status === 'active' ? 'success' : 'danger'}>
                          {user.status}
                        </StatusBadge>
                        <AppButton
                          tone="secondary"
                          onPress={() => banUserMutation.mutate(user.id)}
                          isLoading={banUserMutation.isPending}
                          disabled={user.status === 'banned'}
                        >
                          {user.status === 'banned' ? 'Уже заблокирован' : 'Заблокировать'}
                        </AppButton>
                      </YStack>
                    </AppCard>
                  ))}
                </YStack>
              )
            ) : null}
          </YStack>
        </AppCard>

        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title="Auctions"
              description={`Всего ${formatNumber(auctions.length)} записей.`}
            />
            {hideAuctionMutation.isError ? (
              <ErrorState
                description={
                  hideAuctionMutation.error instanceof Error
                    ? hideAuctionMutation.error.message
                    : 'Не удалось скрыть auction'
                }
              />
            ) : null}
            {auctionsQuery.isLoading ? <LoadingState label="Загружаем auction-ы" /> : null}
            {auctionsQuery.isError ? (
              <ErrorState
                description={
                  auctionsQuery.error instanceof Error
                    ? auctionsQuery.error.message
                    : 'Не удалось загрузить auction-ы'
                }
                onAction={() => auctionsQuery.refetch()}
              />
            ) : null}
            {!auctionsQuery.isLoading && !auctionsQuery.isError ? (
              auctions.length === 0 ? (
                <EmptyState title="Аукционов нет" description="Список аукционов пуст." />
              ) : (
                <YStack style={{ gap: mobileSpacing[2] }}>
                  {auctions.map((auction) => (
                    <AppCard key={auction.id}>
                      <YStack style={{ gap: mobileSpacing[2] }}>
                        <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: palette.text }}>
                          {auction.slug}
                        </Text>
                        <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
                          {formatCurrencyAmount(auction.currentPrice, auction.currency)}
                        </Text>
                        <StatusBadge tone={getAuctionStatusTone(auction.status)}>
                          {getAuctionStatusLabel(auction.status)}
                        </StatusBadge>
                        <AppButton
                          tone="secondary"
                          onPress={() => hideAuctionMutation.mutate(auction.id)}
                          isLoading={hideAuctionMutation.isPending}
                          disabled={auction.status === 'hidden'}
                        >
                          {auction.status === 'hidden' ? 'Уже скрыт' : 'Скрыть'}
                        </AppButton>
                      </YStack>
                    </AppCard>
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

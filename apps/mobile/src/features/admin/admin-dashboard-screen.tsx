import { YStack } from 'tamagui';

import {
  AppButton,
  AppCard,
  DetailList,
  EmptyState,
  EntityPanel,
  ErrorState,
  LoadingState,
  PageIntro,
  Screen,
  SectionHeader,
  StatGrid,
} from '../../components/ui';
import { formatCurrencyAmount, formatNumber } from '../../lib/formatters';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { getAuctionStatusLabel } from '../auctions/utils';
import {
  useAdminAuctionsQuery,
  useAdminUsersQuery,
  useBanUserMutation,
  useHideAuctionMutation,
} from './hooks';

export function AdminDashboardScreen() {
  const usersQuery = useAdminUsersQuery();
  const auctionsQuery = useAdminAuctionsQuery();
  const banUserMutation = useBanUserMutation();
  const hideAuctionMutation = useHideAuctionMutation();
  const users = usersQuery.data?.users ?? [];
  const auctions = auctionsQuery.data?.auctions ?? [];

  return (
    <Screen mode="admin">
      <YStack
        style={{
          width: '100%',
          maxWidth: mobileLayout.contentMaxWidth,
          alignSelf: 'center',
          gap: mobileSpacing[5],
        }}
      >
        <PageIntro
          badge={{ label: 'Admin area', tone: 'danger' }}
          title="Moderation workspace"
          description="Операционная панель использует ту же дизайн-систему, но остаётся строгой по смыслу и безопасной по действиям."
        />

        <StatGrid
          items={[
            { label: 'Пользователей', value: formatNumber(users.length) },
            { label: 'Auction-ов', value: formatNumber(auctions.length) },
          ]}
        />

        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <SectionHeader
              title="Users"
              description={`Всего ${formatNumber(users.length)} записей.`}
            />
            {banUserMutation.isError ? (
              <ErrorState
                description={getUserFacingErrorMessage(
                  banUserMutation.error,
                  'Не удалось заблокировать пользователя',
                )}
              />
            ) : null}
            {usersQuery.isLoading ? <LoadingState label="Загружаем пользователей" /> : null}
            {usersQuery.isError ? (
              <ErrorState
                description={getUserFacingErrorMessage(
                  usersQuery.error,
                  'Не удалось загрузить пользователей',
                )}
                onAction={() => usersQuery.refetch()}
              />
            ) : null}
            {!usersQuery.isLoading && !usersQuery.isError ? (
              users.length === 0 ? (
                <EmptyState title="Пользователей нет" description="Список пользователей пуст." />
              ) : (
                <YStack style={{ gap: mobileSpacing[2] }}>
                  {users.map((user) => (
                    <EntityPanel
                      key={user.id}
                      eyebrow={user.status}
                      title={user.displayName}
                      subtitle={user.email}
                      footer={
                        <AppButton
                          tone="secondary"
                          onPress={() => banUserMutation.mutate(user.id)}
                          isLoading={banUserMutation.isPending}
                          disabled={user.status === 'banned'}
                        >
                          {user.status === 'banned' ? 'Уже заблокирован' : 'Заблокировать'}
                        </AppButton>
                      }
                    >
                      <DetailList
                        items={[
                          { label: 'Телефон', value: user.phone },
                          { label: 'Роль', value: user.role },
                        ]}
                      />
                    </EntityPanel>
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
                description={getUserFacingErrorMessage(
                  hideAuctionMutation.error,
                  'Не удалось скрыть auction',
                )}
              />
            ) : null}
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
                <EmptyState title="Аукционов нет" description="Список аукционов пуст." />
              ) : (
                <YStack style={{ gap: mobileSpacing[2] }}>
                  {auctions.map((auction) => (
                    <EntityPanel
                      key={auction.id}
                      eyebrow={getAuctionStatusLabel(auction.status)}
                      title={auction.slug}
                      subtitle={formatCurrencyAmount(auction.currentPrice, auction.currency)}
                      footer={
                        <AppButton
                          tone="secondary"
                          onPress={() => hideAuctionMutation.mutate(auction.id)}
                          isLoading={hideAuctionMutation.isPending}
                          disabled={auction.status === 'hidden'}
                        >
                          {auction.status === 'hidden' ? 'Уже скрыт' : 'Скрыть'}
                        </AppButton>
                      }
                    />
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

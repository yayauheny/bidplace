'use client';

import { PageContainer, Heading, Text } from '../../components/ui/layout';
import { LoadingBlock, EmptyState, ErrorState } from '../../components/ui/states';
import { spacing } from '../../theme/tokens';
import { usePublicAuctionsQuery } from './hooks';
import { AuctionCard } from './auction-card';
import { XStack, YStack } from '../../components/ui/stack';

export function AuctionListScreen() {
  const query = usePublicAuctionsQuery();

  return (
    <PageContainer>
      <YStack gap={spacing[3]}>
        <Heading level="display">Публичный каталог</Heading>
        <Text tone="muted" size="body">
          Ставки, лоты и продавцы в одном месте. Тёмная и светлая темы работают
          одинаково.
        </Text>
      </YStack>

      {query.isLoading ? <LoadingBlock label="Загружаем аукционы" /> : null}

      {query.isError ? (
        <ErrorState
          description={query.error instanceof Error ? query.error.message : 'Не удалось загрузить каталог'}
          onAction={() => query.refetch()}
        />
      ) : null}

      {query.data && query.data.auctions.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          description="Новых аукционов ещё нет. Проверьте позже или начните с seller сценария."
        />
      ) : null}

      {query.data ? (
        <XStack
          flexDirection="row"
          flexWrap="wrap"
          gap={spacing[4]}
          alignItems="stretch"
        >
          {query.data.auctions.map((item) => (
            <YStack key={item.auction.id} width="100%" maxWidth={384} flexGrow={1}>
              <AuctionCard {...item} />
            </YStack>
          ))}
        </XStack>
      ) : null}
    </PageContainer>
  );
}

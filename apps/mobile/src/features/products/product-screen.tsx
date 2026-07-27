import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import {
  AppButton,
  AppInput,
  DetailList,
  ErrorState,
  LoadingState,
} from '../../components/ui';
import {
  AppImage,
  AppText,
  BottomActionBar,
  ContentTabs,
  MetadataChip,
  ModernScreen,
  ModernSection,
  PrimaryButton,
  SecondaryButton,
} from '../../components/modern-ui';
import { getApiUrl } from '../../lib/environment';
import { useListingRealtime } from '../../lib/use-listing-realtime';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { useAppThemePalette } from '../../theme/palette';
import { mobileSpacing } from '../../theme/tokens';
import { modernColors, modernSpacing } from '../../theme/modern-tokens';
import { EmailRulesGate } from '../auth/email-rules-gate';
import type { ApiClient } from '@bidplace/api-client';

// Derive types from the API client to stay in sync with the contract.
type BidItem = Awaited<ReturnType<ApiClient['listings']['listBids']>>['bids'][number];

type BidAttempt = { listingId: string; amount: number; idempotencyKey: string };

function newIdempotencyKey(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure idempotency keys are unavailable on this device');
  }
  return globalThis.crypto.randomUUID();
}

function formatRemainingTime(endsAt: string, now: number): string {
  const seconds = Math.max(
    0,
    Math.ceil((new Date(endsAt).getTime() - now) / 1_000),
  );
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainder = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
}

type ListingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'DRAFT';

function listingStatusLabel(status: ListingStatus): string {
  return {
    SCHEDULED: 'Торги запланированы',
    LIVE: 'Торги идут',
    ENDED: 'Торги завершены',
    CANCELLED: 'Размещение отменено',
    DRAFT: 'Черновик размещения',
  }[status];
}

export function ProductScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const palette = useAppThemePalette();
  const [amount, setAmount] = useState('');
  const [pendingAttempt, setPendingAttempt] = useState<BidAttempt | null>(null);
  const [now, setNow] = useState(Date.now());

  const query = useQuery({
    queryKey: ['products', publicId],
    queryFn: () => api.products.get(publicId),
  });
  const listingId = query.data?.listing?.id;
  const bids = useQuery({
    queryKey: ['listings', listingId, 'bids'],
    queryFn: () => api.listings.listBids(listingId!),
    enabled: Boolean(listingId),
  });
  const activity = useQuery({
    queryKey: ['user', 'activity'],
    queryFn: () => api.activity.get(),
    enabled: auth.isAuthenticated,
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const refreshListing = () => {
    void queryClient.invalidateQueries({ queryKey: ['products', publicId] });
    if (listingId)
      void queryClient.invalidateQueries({
        queryKey: ['listings', listingId, 'bids'],
      });
    if (auth.isAuthenticated)
      void queryClient.invalidateQueries({ queryKey: ['user', 'activity'] });
  };

  const realtimeState = useListingRealtime(listingId, refreshListing);
  const bid = useMutation({
    mutationFn: (attempt: BidAttempt) =>
      api.listings.placeBid(
        attempt.listingId,
        { amount: attempt.amount },
        attempt.idempotencyKey,
      ),
    onSuccess: () => {
      setPendingAttempt(null);
      refreshListing();
    },
  });

  if (query.isLoading)
    return (
      <ModernScreen width="wide">
        <LoadingState label="Загружаем предмет" />
      </ModernScreen>
    );
  if (query.isError || !query.data)
    return (
      <ModernScreen width="wide">
        <ErrorState
          description="Не удалось загрузить предмет"
          onAction={() => query.refetch()}
        />
      </ModernScreen>
    );

  const { product, sellerProfile, listing, minimumNextBid } = query.data;
  const participation = listing
    ? activity.data?.activity.find((item) => item.listing.id === listing.id)
    : undefined;

  const submitBid = () => {
    if (!listing) return;
    const nextAmount = Number(amount);
    const existing = pendingAttempt;
    const reusable: BidAttempt =
      existing !== null &&
      existing.listingId === listing.id &&
      existing.amount === nextAmount
        ? existing
        : {
            listingId: listing.id,
            amount: nextAmount,
            idempotencyKey: newIdempotencyKey(),
          };
    setPendingAttempt(reusable);
    bid.mutate(reusable);
  };

  const detailItems = [
    product.technique ? { label: 'Техника', value: product.technique } : null,
    product.materials ? { label: 'Материалы', value: product.materials } : null,
    product.dimensions ? { label: 'Размеры', value: product.dimensions } : null,
    product.condition ? { label: 'Состояние', value: product.condition } : null,
    product.uniqueness
      ? { label: 'Уникальность', value: product.uniqueness }
      : null,
    product.city ? { label: 'Город', value: product.city } : null,
    product.deliveryInfo
      ? { label: 'Передача', value: product.deliveryInfo }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <ModernScreen width="wide">
      <YStack style={{ gap: modernSpacing.section }}>
        {/* Image gallery */}
        {product.images.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -mobileSpacing[4] }}
            contentContainerStyle={{ paddingHorizontal: modernSpacing.page, gap: modernSpacing.md }}
          >
            {product.images.map((image) => (
              <AppImage key={image.id} uri={`${getApiUrl()}${image.url}`} alt={`${product.title ?? 'Предмет'} — изображение ${image.position + 1}`} style={{ width: 300 }} />
            ))}
          </ScrollView>
        ) : null}

        {/* Title block */}
        <YStack style={{ gap: modernSpacing.sm }}>
          <AppText role="metadata" color={modernColors.textSecondary}>{sellerProfile.fullName}</AppText>
          <AppText role="display">{product.title ?? 'Предмет'}</AppText>
        </YStack>

        <ContentTabs items={['О предмете', 'История создания', 'Происхождение']}>
          {(active) => active === 'О предмете' ? (detailItems.length > 0 ? <DetailList items={detailItems} /> : <AppText role="bodySmall" color={modernColors.textSecondary}>Детали предмета появятся здесь.</AppText>) : <AppText role="body" color={modernColors.textSecondary}>{active === 'История создания' ? product.story || 'История предмета пока не добавлена.' : product.provenance || 'Происхождение пока не добавлено.'}</AppText>}
        </ContentTabs>

        {/* Listing panel */}
        {listing ? (
          <ModernSection eyebrow="Торги">
            <YStack style={{ gap: mobileSpacing[3] }}>
              <XStack style={{ alignItems: 'center', gap: mobileSpacing[2] }}>
                <MetadataChip tone={listing.status === 'LIVE' ? 'success' : 'default'}>{listingStatusLabel(listing.status)}</MetadataChip>
                {participation ? <MetadataChip>{participation.status}</MetadataChip> : null}
              </XStack>
              <YStack style={{ gap: 2 }}>
                <AppText role="numeric" style={{ fontSize: 28, lineHeight: 34 }}>Текущая цена: {listing.currentPrice} BYN</AppText>
                <AppText role="metadata" color={modernColors.textSecondary}>{`Старт: ${listing.auctionRules.startPrice} BYN${minimumNextBid !== null ? ` · Мин. ставка: ${minimumNextBid} BYN` : ''}`}</AppText>
              </YStack>
              {listing.status === 'LIVE' ? <AppText accessibilityLiveRegion="polite" role="numeric" color={modernColors.accent}>До завершения: {formatRemainingTime(listing.endsAt, now)}</AppText> : null}
              {listing.status === 'SCHEDULED' ? <AppText role="bodySmall" color={modernColors.textSecondary}>Начало: {new Date(listing.startsAt).toLocaleString('ru-BY')}</AppText> : null}
              <AppText role="metadata" color={modernColors.textSecondary}>Окончание: {new Date(listing.endsAt).toLocaleString('ru-BY')}</AppText>
              <AppText role="metadata" color={realtimeState === 'connected' ? modernColors.success : modernColors.textSecondary}>{realtimeState === 'connected' ? 'Обновления подключены' : realtimeState === 'reconnecting' ? 'Восстанавливаем обновления…' : 'Обновления недоступны — используем актуальную загрузку'}</AppText>
            </YStack>
            {listing.status === 'LIVE' ? (
              <EmailRulesGate redirectTo={`/product/${publicId}`}>
                  <BottomActionBar summary={<AppText role="metadata">Минимальная ставка: {minimumNextBid ?? '—'} BYN</AppText>}>
                  <YStack style={{ gap: modernSpacing.md }}>
                    <AppInput
                      label="Ваша ставка, BYN"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholder={
                        minimumNextBid !== null ? `от ${minimumNextBid}` : ''
                      }
                    />
                    <PrimaryButton
                      loading={bid.isPending}
                      onPress={submitBid}
                    >
                      Сделать ставку
                    </PrimaryButton>
                    {bid.isError && pendingAttempt ? (
                      <SecondaryButton onPress={submitBid}>
                        Повторить ставку
                      </SecondaryButton>
                    ) : null}
                    {bid.isError ? (
                      <Text
                        style={{
                          color: palette.negative,
                          fontSize: 14,
                          lineHeight: 20,
                        }}
                      >
                        Ставка не принята. Проверьте статус торгов и минимальную
                        сумму.
                      </Text>
                    ) : null}
                  </YStack>
                  </BottomActionBar>
              </EmailRulesGate>
            ) : null}
          </ModernSection>
        ) : (
          <ModernSection><AppText role="bodySmall" color={modernColors.textSecondary}>Сейчас нет активного размещения.</AppText></ModernSection>
        )}

        {/* Bid history */}
        {bids.data?.bids && bids.data.bids.length > 0 ? (
          <ModernSection eyebrow="История ставок">
            <YStack style={{ gap: mobileSpacing[2] }}>
              {bids.data.bids.map((item: BidItem) => (
                <XStack
                  key={item.id}
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <AppText role="bodySmall" color={modernColors.textSecondary}>{item.bidderAlias}</AppText>
                  <AppText role="numeric">{item.amount} BYN</AppText>
                </XStack>
              ))}
            </YStack>
          </ModernSection>
        ) : null}

        {/* Order links */}
        {participation?.orderPublicId ? (
          <Link href={{ pathname: '/order/[publicId]', params: { publicId: participation.orderPublicId } }} asChild>
            <AppButton tone="secondary">Открыть результат заказа</AppButton>
          </Link>
        ) : null}
        {listing?.status === 'ENDED' && !participation?.orderPublicId ? (
          <Link href="/me/activity" asChild>
            <AppButton tone="subtle">
              Проверить результат в «Моих покупках»
            </AppButton>
          </Link>
        ) : null}
      </YStack>
    </ModernScreen>
  );
}

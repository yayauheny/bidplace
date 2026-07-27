import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import {
  AppButton,
  AppInput,
  DetailList,
  ErrorState,
  LoadingState,
  OperationalPanel,
  Screen,
  StatusBadge,
} from '../../components/ui';
import { AppDialog, AppText, PrimaryButton, ProductGallery, SecondaryButton } from '../../components/modern-ui';
import { useListingRealtime } from '../../lib/use-listing-realtime';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { useAppThemePalette } from '../../theme/palette';
import { fontFamilies, mobileSpacing } from '../../theme/tokens';
import { EmailRulesGate } from '../auth/email-rules-gate';
import type { ApiClient } from '@bidplace/api-client';
import { validateBidAmount } from './bid-validation';

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

function listingStatusTone(
  status: ListingStatus,
): 'positive' | 'primary' | 'neutral' | 'negative' {
  if (status === 'LIVE') return 'positive';
  if (status === 'SCHEDULED') return 'primary';
  if (status === 'CANCELLED') return 'negative';
  return 'neutral';
}

function participationStatusTone(
  status: string,
): 'positive' | 'warning' | 'neutral' {
  if (status === 'LEADING' || status === 'WON') return 'positive';
  if (status === 'OUTBID') return 'warning';
  return 'neutral';
}

export function ProductScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const palette = useAppThemePalette();
  const [amount, setAmount] = useState('');
  const [pendingAttempt, setPendingAttempt] = useState<BidAttempt | null>(null);
  const [confirmationAttempt, setConfirmationAttempt] = useState<BidAttempt | null>(null);
  const [bidValidationError, setBidValidationError] = useState<string | null>(null);
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
      setBidValidationError(null);
      refreshListing();
    },
    onError: () => {
      refreshListing();
    },
  });

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState label="Загружаем предмет" />
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen>
        <ErrorState
          description="Не удалось загрузить предмет"
          onAction={() => query.refetch()}
        />
      </Screen>
    );

  const { product, sellerProfile, listing, minimumNextBid } = query.data;
  const participation = listing
    ? activity.data?.activity.find((item) => item.listing.id === listing.id)
    : undefined;

  const sendBid = (attempt: BidAttempt) => {
    setPendingAttempt(attempt);
    setConfirmationAttempt(null);
    bid.mutate(attempt);
  };

  const submitBid = () => {
    if (!listing) return;
    const validationError = validateBidAmount(amount, minimumNextBid);
    if (validationError) {
      setBidValidationError(validationError);
      return;
    }

    setBidValidationError(null);
    const nextAmount = Number(amount.replace(',', '.'));
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
    // If participation is unavailable, confirmation is required by default.
    // This prevents a stale Activity projection from bypassing first-bid consent.
    if (!participation) {
      setConfirmationAttempt(reusable);
      return;
    }

    sendBid(reusable);
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
    <Screen>
      <YStack style={{ gap: mobileSpacing[5] }}>
        <ProductGallery images={product.images} label={product.title ?? 'Предмет'} />

        {/* Title block */}
        <YStack style={{ gap: mobileSpacing[1] }}>
          <AppText role="metadata" tone="secondary">{sellerProfile.fullName}</AppText>
          <AppText role="screenTitle">{product.title ?? 'Предмет'}</AppText>
          {product.story || product.provenance ? (
            <Text
              style={{
                fontFamily: fontFamilies.sansRegular,
                fontSize: 15,
                lineHeight: 24,
                color: palette.colorSecondary,
                marginTop: mobileSpacing[2],
              }}
            >
              {[product.story, product.provenance].filter(Boolean).join('\n\n')}
            </Text>
          ) : null}
        </YStack>

        {/* Attributes */}
        {detailItems.length > 0 ? (
          <OperationalPanel eyebrow="О предмете">
            <DetailList items={detailItems} />
          </OperationalPanel>
        ) : null}

        {/* Listing panel */}
        {listing ? (
          <OperationalPanel
            eyebrow="Торги"
            footer={
              listing.status === 'LIVE' ? (
                <EmailRulesGate redirectTo={`/product/${publicId}`}>
                  <YStack style={{ gap: mobileSpacing[3] }}>
                    <AppInput
                      label="Ваша ставка, BYN"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholder={
                        minimumNextBid !== null ? `от ${minimumNextBid}` : ''
                      }
                    />
                    <AppButton
                      buttonSize="large"
                      isLoading={bid.isPending}
                      loadingLabel="Отправляем ставку"
                      onPress={submitBid}
                    >
                      Сделать ставку
                    </AppButton>
                    {bid.isError && pendingAttempt ? (
                      <AppButton tone="secondary" onPress={() => sendBid(pendingAttempt)}>
                        Повторить ставку
                      </AppButton>
                    ) : null}
                    {bidValidationError || bid.isError ? (
                      <Text
                        style={{
                          color: palette.negative,
                          fontSize: 14,
                          lineHeight: 20,
                        }}
                      >
                        {bidValidationError ?? 'Ставка не принята. Сервер обновил цену и минимальную сумму — проверьте актуальные данные.'}
                      </Text>
                    ) : null}
                  </YStack>
                </EmailRulesGate>
              ) : null
            }
          >
            <YStack style={{ gap: mobileSpacing[3] }}>
              <XStack style={{ alignItems: 'center', gap: mobileSpacing[2] }}>
                <StatusBadge tone={listingStatusTone(listing.status)}>
                  {listingStatusLabel(listing.status)}
                </StatusBadge>
                {participation ? (
                  <StatusBadge
                    tone={participationStatusTone(participation.status)}
                  >
                    {participation.status}
                  </StatusBadge>
                ) : null}
              </XStack>

              {/* Prices */}
              <YStack style={{ gap: 2 }}>
                <Text
                  style={{
                    fontFamily: fontFamilies.sansStrong,
                    fontSize: 28,
                    lineHeight: 34,
                    color: palette.color,
                    fontWeight: '700',
                  }}
                >
                  Текущая цена: {listing.currentPrice} BYN
                </Text>
                <Text
                  style={{
                    fontFamily: fontFamilies.sansRegular,
                    fontSize: 13,
                    lineHeight: 18,
                    color: palette.colorMuted,
                  }}
                >
                  {'Старт: '}
                  {listing.auctionRules.startPrice} BYN
                  {minimumNextBid !== null
                    ? ` · Мин. ставка: ${minimumNextBid} BYN`
                    : ''}
                </Text>
              </YStack>

              {/* Timer */}
              {listing.status === 'LIVE' ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{
                    fontFamily: fontFamilies.sansMedium,
                    fontSize: 15,
                    lineHeight: 22,
                    color: palette.colorSecondary,
                  }}
                >
                  До завершения: {formatRemainingTime(listing.endsAt, now)}
                </Text>
              ) : null}
              {listing.status === 'SCHEDULED' ? (
                <Text
                  style={{
                    fontFamily: fontFamilies.sansRegular,
                    fontSize: 14,
                    lineHeight: 20,
                    color: palette.colorSecondary,
                  }}
                >
                  Начало: {new Date(listing.startsAt).toLocaleString('ru-BY')}
                </Text>
              ) : null}
              <Text
                style={{
                  fontFamily: fontFamilies.sansRegular,
                  fontSize: 13,
                  lineHeight: 18,
                  color: palette.colorMuted,
                }}
              >
                Окончание: {new Date(listing.endsAt).toLocaleString('ru-BY')}
              </Text>

              {/* Realtime */}
              <Text
                style={{
                  fontFamily: fontFamilies.sansRegular,
                  fontSize: 12,
                  lineHeight: 16,
                  color: palette.colorMuted,
                }}
              >
                {realtimeState === 'connected'
                  ? 'Обновления подключены'
                  : realtimeState === 'reconnecting'
                    ? 'Восстанавливаем обновления…'
                    : 'Обновления недоступны — используем актуальную загрузку'}
              </Text>
            </YStack>
          </OperationalPanel>
        ) : (
          <OperationalPanel>
            <Text
              style={{
                fontFamily: fontFamilies.sansRegular,
                fontSize: 15,
                color: palette.colorSecondary,
              }}
            >
              Сейчас нет активного размещения.
            </Text>
          </OperationalPanel>
        )}

        {/* Bid history */}
        {bids.data?.bids && bids.data.bids.length > 0 ? (
          <OperationalPanel eyebrow="История ставок">
            <YStack style={{ gap: mobileSpacing[2] }}>
              {bids.data.bids.map((item: BidItem) => (
                <XStack
                  key={item.id}
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fontFamilies.sansRegular,
                      fontSize: 14,
                      lineHeight: 20,
                      color: palette.colorSecondary,
                    }}
                  >
                    {item.bidderAlias}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fontFamilies.sansStrong,
                      fontSize: 14,
                      lineHeight: 20,
                      color: palette.color,
                      fontWeight: '600',
                    }}
                  >
                    {item.amount} BYN
                  </Text>
                </XStack>
              ))}
            </YStack>
          </OperationalPanel>
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
        <AppDialog
          open={confirmationAttempt !== null}
          title="Подтвердите ставку"
          description={listing ? `Вы делаете ставку на «${product.title ?? 'предмет'}» на сумму ${confirmationAttempt?.amount} BYN. Минимальная сумма по данным сервера: ${minimumNextBid ?? 'недоступна'} BYN. Торги завершаются ${new Date(listing.endsAt).toLocaleString('ru-BY')}. Ставка необратима.` : undefined}
          onClose={() => setConfirmationAttempt(null)}
        >
          <PrimaryButton label="Подтвердить ставку" loading={bid.isPending} onPress={() => { if (confirmationAttempt) sendBid(confirmationAttempt); }} />
          <SecondaryButton label="Отмена" disabled={bid.isPending} onPress={() => setConfirmationAttempt(null)} />
        </AppDialog>
      </YStack>
    </Screen>
  );
}

import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  ErrorState,
  LoadingState,
  Screen,
} from '../../components/ui';
import { getApiUrl } from '../../lib/environment';
import { useListingRealtime } from '../../lib/use-listing-realtime';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';

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

function listingStatusLabel(
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'DRAFT',
): string {
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
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
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
  const otp = useMutation({ mutationFn: () => api.auth.requestPhoneOtp() });
  const verify = useMutation({
    mutationFn: () => api.auth.verifyPhoneOtp({ code }),
  });
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
  const submitBid = () => {
    if (!listing) return;
    const nextAmount = Number(amount);
    const reusable =
      pendingAttempt?.listingId === listing.id &&
      pendingAttempt.amount === nextAmount
        ? pendingAttempt
        : {
            listingId: listing.id,
            amount: nextAmount,
            idempotencyKey: newIdempotencyKey(),
          };
    setPendingAttempt(reusable);
    bid.mutate(reusable);
  };

  return (
    <Screen>
      <YStack gap="$3">
        {product.images.map((image) => (
          <Image
            key={image.id}
            source={{ uri: `${getApiUrl()}${image.url}` }}
            style={{ width: '100%', height: 280 }}
            contentFit="cover"
          />
        ))}
        <Text fontSize={30} fontWeight="600">
          {product.title ?? 'Предмет'}
        </Text>
        <Text>{product.story ?? ''}</Text>
        <Text>{product.provenance ?? ''}</Text>
        {product.technique ? <Text>Техника: {product.technique}</Text> : null}
        {product.materials ? <Text>Материалы: {product.materials}</Text> : null}
        {product.dimensions ? <Text>Размеры: {product.dimensions}</Text> : null}
        {product.condition ? <Text>Состояние: {product.condition}</Text> : null}
        {product.uniqueness ? (
          <Text>Уникальность: {product.uniqueness}</Text>
        ) : null}
        {product.city ? <Text>Город: {product.city}</Text> : null}
        {product.deliveryInfo ? (
          <Text>Передача: {product.deliveryInfo}</Text>
        ) : null}
        <Text>Автор: {sellerProfile.storeName}</Text>
        {listing ? (
          <YStack gap="$2">
            <Text>{listingStatusLabel(listing.status)}</Text>
            <Text>Стартовая цена: {listing.auctionRules.startPrice} BYN</Text>
            <Text>Текущая цена: {listing.currentPrice} BYN</Text>
            {minimumNextBid !== null ? (
              <Text>Минимальная ставка: {minimumNextBid} BYN</Text>
            ) : null}
            {listing.status === 'LIVE' ? (
              <Text accessibilityLiveRegion="polite">
                До завершения: {formatRemainingTime(listing.endsAt, now)}
              </Text>
            ) : null}
            {listing.status === 'SCHEDULED' ? (
              <Text>
                Начало: {new Date(listing.startsAt).toLocaleString('ru-BY')}
              </Text>
            ) : null}
            <Text>
              Окончание: {new Date(listing.endsAt).toLocaleString('ru-BY')}
            </Text>
            <Text>
              {realtimeState === 'connected'
                ? 'Обновления подключены'
                : realtimeState === 'reconnecting'
                  ? 'Восстанавливаем обновления'
                  : 'Обновления недоступны — используем актуальную загрузку'}
            </Text>
            {participation ? (
              <Text>Ваш статус: {participation.status}</Text>
            ) : null}
            {listing.status === 'LIVE' ? (
              <>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="Ваша ставка в BYN"
                />
                <AppButton isLoading={bid.isPending} onPress={submitBid}>
                  Сделать ставку
                </AppButton>
                {bid.isError && pendingAttempt ? (
                  <AppButton tone="secondary" onPress={submitBid}>
                    Повторить ставку
                  </AppButton>
                ) : null}
                <AppButton
                  tone="secondary"
                  isLoading={otp.isPending}
                  onPress={() => otp.mutate()}
                >
                  Получить код телефона
                </AppButton>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholder="Код из SMS"
                />
                <AppButton
                  tone="secondary"
                  isLoading={verify.isPending}
                  onPress={() => verify.mutate()}
                >
                  Подтвердить телефон
                </AppButton>
                {bid.isError ? (
                  <Text color="$danger">
                    Ставка не принята. Проверьте статус торгов и минимальную
                    сумму.
                  </Text>
                ) : null}
                {otp.isError || verify.isError ? (
                  <Text color="$danger">
                    Не удалось подтвердить телефон. Попробуйте ещё раз.
                  </Text>
                ) : null}
              </>
            ) : null}
            <Text fontWeight="600">История ставок</Text>
            {bids.data?.bids.map((item) => (
              <Text key={item.id}>
                {item.bidderAlias}: {item.amount} BYN
              </Text>
            ))}
          </YStack>
        ) : (
          <Text>Сейчас нет активного размещения.</Text>
        )}
        {participation?.orderPublicId ? (
          <Link href={`/order/${participation.orderPublicId}`}>
            Открыть результат заказа
          </Link>
        ) : null}
        {listing?.status === 'ENDED' && !participation?.orderPublicId ? (
          <Link href="/me/activity">Проверить результат в «Моих покупках»</Link>
        ) : null}
      </YStack>
    </Screen>
  );
}

import { Image } from 'expo-image';
import { useState } from 'react';
import { TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Text, YStack } from 'tamagui';

import { AppButton, ErrorState, LoadingState, Screen } from '../../components/ui';
import { getApiUrl } from '../../lib/environment';
import { useListingRealtime } from '../../lib/use-listing-realtime';
import { useApiClient } from '../../providers/api-provider';

type BidAttempt = { listingId: string; amount: number; idempotencyKey: string };

function newIdempotencyKey(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure idempotency keys are unavailable on this device');
  }
  return globalThis.crypto.randomUUID();
}

export function ProductScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [pendingAttempt, setPendingAttempt] = useState<BidAttempt | null>(null);
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
  const refreshListing = () => {
    void queryClient.invalidateQueries({ queryKey: ['products', publicId] });
    if (listingId) void queryClient.invalidateQueries({ queryKey: ['listings', listingId, 'bids'] });
  };
  const realtimeState = useListingRealtime(listingId, refreshListing);
  const otp = useMutation({ mutationFn: () => api.auth.requestPhoneOtp() });
  const verify = useMutation({ mutationFn: () => api.auth.verifyPhoneOtp({ code }) });
  const bid = useMutation({
    mutationFn: (attempt: BidAttempt) =>
      api.listings.placeBid(attempt.listingId, { amount: attempt.amount }, attempt.idempotencyKey),
    onSuccess: () => {
      setPendingAttempt(null);
      refreshListing();
    },
  });

  if (query.isLoading) return <Screen><LoadingState label="Загружаем предмет" /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState description="Не удалось загрузить предмет" onAction={() => query.refetch()} /></Screen>;

  const { product, sellerProfile, listing, minimumNextBid } = query.data;
  const submitBid = () => {
    if (!listing) return;
    const nextAmount = Number(amount);
    const reusable = pendingAttempt?.listingId === listing.id && pendingAttempt.amount === nextAmount
      ? pendingAttempt
      : { listingId: listing.id, amount: nextAmount, idempotencyKey: newIdempotencyKey() };
    setPendingAttempt(reusable);
    bid.mutate(reusable);
  };

  return <Screen><YStack gap="$3">
    {product.images.map((image) => <Image key={image.id} source={{ uri: `${getApiUrl()}${image.url}` }} style={{ width: '100%', height: 280 }} contentFit="cover" />)}
    <Text fontSize={30} fontWeight="600">{product.title ?? 'Предмет'}</Text>
    <Text>{product.story ?? ''}</Text>
    <Text>{product.provenance ?? ''}</Text>
    <Text>Автор: {sellerProfile.storeName}</Text>
    {listing ? <YStack gap="$2">
      <Text>{listing.status === 'LIVE' ? 'Торги идут' : listing.status}</Text>
      <Text>Стартовая цена: {listing.auctionRules.startPrice} BYN</Text>
      <Text>Текущая цена: {listing.currentPrice} BYN</Text>
      {minimumNextBid !== null ? <Text>Минимальная ставка: {minimumNextBid} BYN</Text> : null}
      <Text>До: {new Date(listing.endsAt).toLocaleString('ru-BY')}</Text>
      <Text>{realtimeState === 'connected' ? 'Обновления подключены' : realtimeState === 'reconnecting' ? 'Восстанавливаем обновления' : 'Обновления недоступны — используем актуальную загрузку'}</Text>
      {listing.status === 'LIVE' ? <>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Ваша ставка в BYN" />
        <AppButton isLoading={bid.isPending} onPress={submitBid}>Сделать ставку</AppButton>
        {bid.isError && pendingAttempt ? <AppButton tone="secondary" onPress={submitBid}>Повторить ставку</AppButton> : null}
        <AppButton tone="secondary" isLoading={otp.isPending} onPress={() => otp.mutate()}>Получить код телефона</AppButton>
        <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Код из SMS" />
        <AppButton tone="secondary" isLoading={verify.isPending} onPress={() => verify.mutate()}>Подтвердить телефон</AppButton>
      </> : null}
      <Text fontWeight="600">История ставок</Text>
      {bids.data?.bids.map((item) => <Text key={item.id}>{item.bidderAlias}: {item.amount} BYN</Text>)}
    </YStack> : <Text>Сейчас нет активного размещения.</Text>}
    {listing?.status === 'ENDED' ? <Link href="/me/activity">Проверить результат в «Моих покупках»</Link> : null}
  </YStack></Screen>;
}

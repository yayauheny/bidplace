import { useState } from 'react';
import { TextInput } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Text, YStack } from 'tamagui';

import { AppButton, ErrorState, LoadingState, Screen } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

export function ListingDraftScreen() {
  const api = useApiClient();
  const products = useQuery({ queryKey: ['seller', 'products'], queryFn: () => api.sellers.listProducts() });
  const [productId, setProductId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [listingId, setListingId] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => api.listings.create(productId, { startsAt, endsAt, startPrice: Number(startPrice) }),
    onSuccess: ({ listing }) => setListingId(listing.id),
  });
  const schedule = useMutation({ mutationFn: () => api.listings.update(listingId!, 'SCHEDULE') });

  if (products.isLoading) return <Screen><LoadingState label="Загружаем ваши Product" /></Screen>;
  if (products.isError || !products.data) return <Screen><ErrorState description="Не удалось загрузить Product" onAction={() => products.refetch()} /></Screen>;
  return <Screen><YStack gap="$3">
    <Text fontSize={30} fontWeight="600">Новый Auction Listing</Text>
    <Text>Валюта: BYN. Правила soft close будут зафиксированы сервером при создании.</Text>
    {products.data.products.map((product) => <AppButton key={product.id} tone={product.id === productId ? 'primary' : 'secondary'} onPress={() => setProductId(product.id)}>{product.title ?? product.id} · {product.status}</AppButton>)}
    <TextInput value={startsAt} onChangeText={setStartsAt} placeholder="Начало ISO, например 2026-07-20T12:00:00.000Z" autoCapitalize="none" />
    <TextInput value={endsAt} onChangeText={setEndsAt} placeholder="Окончание ISO" autoCapitalize="none" />
    <TextInput value={startPrice} onChangeText={setStartPrice} placeholder="Стартовая цена в BYN" keyboardType="decimal-pad" />
    <AppButton isLoading={create.isPending} onPress={() => create.mutate()}>Создать Listing</AppButton>
    {listingId ? <AppButton tone="secondary" isLoading={schedule.isPending} onPress={() => schedule.mutate()}>Запланировать Listing</AppButton> : null}
    {create.isError || schedule.isError ? <Text color="$danger">Не удалось сохранить Listing. Проверьте Product approval и даты.</Text> : null}
  </YStack></Screen>;
}

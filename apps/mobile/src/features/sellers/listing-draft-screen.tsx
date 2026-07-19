import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  AppInput,
  ErrorState,
  LoadingState,
  OperationalPanel,
  Screen,
  SectionHeader,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { useAppThemePalette } from '../../theme/palette';
import { mobileSpacing } from '../../theme/tokens';

export function ListingDraftScreen() {
  const api = useApiClient();
  const palette = useAppThemePalette();
  const products = useQuery({
    queryKey: ['seller', 'products'],
    queryFn: () => api.sellers.listProducts(),
  });
  const [productId, setProductId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [listingId, setListingId] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () =>
      api.listings.create(productId, {
        startsAt,
        endsAt,
        startPrice: Number(startPrice),
      }),
    onSuccess: ({ listing }) => setListingId(listing.id),
  });
  const schedule = useMutation({
    mutationFn: () => api.listings.update(listingId!, 'SCHEDULE'),
  });

  if (products.isLoading)
    return (
      <Screen>
        <LoadingState label="Загружаем ваши предметы" />
      </Screen>
    );
  if (products.isError || !products.data)
    return (
      <Screen>
        <ErrorState
          description="Не удалось загрузить предметы"
          onAction={() => products.refetch()}
        />
      </Screen>
    );
  return (
    <Screen>
      <YStack style={{ gap: mobileSpacing[5] }}>
        <SectionHeader
          title="Новое размещение"
          description="Валюта: BYN. Правила soft close фиксируются сервером при создании."
        />

        {/* Product selection */}
        <OperationalPanel eyebrow="Предмет">
          <YStack style={{ gap: mobileSpacing[2] }}>
            {products.data.products.map((product) => (
              <YStack key={product.id} style={{ gap: mobileSpacing[1] }}>
                <AppButton
                  tone={product.id === productId ? 'primary' : 'secondary'}
                  onPress={() => setProductId(product.id)}
                >
                  {product.title ?? product.id} · {product.status}
                </AppButton>
                <Link
                  href={{
                    pathname: '/(seller)/products/[id]',
                    params: { id: product.id },
                  }}
                  asChild
                >
                  <AppButton tone="subtle" buttonSize="small">
                    Редактировать предмет
                  </AppButton>
                </Link>
              </YStack>
            ))}
          </YStack>
        </OperationalPanel>

        {/* Schedule fields */}
        <OperationalPanel eyebrow="Расписание">
          <YStack style={{ gap: mobileSpacing[3] }}>
            <AppInput
              label="Начало"
              value={startsAt}
              onChangeText={setStartsAt}
              placeholder="2026-07-20T12:00:00.000Z"
              autoCapitalize="none"
            />
            <AppInput
              label="Окончание"
              value={endsAt}
              onChangeText={setEndsAt}
              placeholder="2026-07-21T12:00:00.000Z"
              autoCapitalize="none"
            />
            <AppInput
              label="Стартовая цена, BYN"
              value={startPrice}
              onChangeText={setStartPrice}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </YStack>
        </OperationalPanel>

        <AppButton isLoading={create.isPending} onPress={() => create.mutate()}>
          Создать размещение
        </AppButton>

        {listingId ? (
          <AppButton
            tone="secondary"
            isLoading={schedule.isPending}
            onPress={() => schedule.mutate()}
          >
            Запланировать размещение
          </AppButton>
        ) : null}

        {create.isError || schedule.isError ? (
          <Text style={{ color: palette.negative }}>
            Не удалось сохранить размещение. Проверьте approval предмета и даты.
          </Text>
        ) : null}
      </YStack>
    </Screen>
  );
}

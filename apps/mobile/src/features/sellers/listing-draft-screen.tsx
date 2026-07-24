import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listingCreateRequestSchema } from '@bidplace/contracts';
import { Link } from 'expo-router';
import { Platform } from 'react-native';
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

type ListingDraftScreenProps = {
  initialProductId?: string;
};

type CreateListingVariables = {
  productId: string;
  productPublicId: string;
  startsAt: string;
  endsAt: string;
  startPrice: number;
};

type CreatedListing = {
  id: string;
  productPublicId: string;
};

function parseMoneyInput(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

export function ListingDraftScreen({
  initialProductId,
}: ListingDraftScreenProps) {
  const api = useApiClient();
  const palette = useAppThemePalette();
  const products = useQuery({
    queryKey: ['seller', 'products'],
    queryFn: () => api.sellers.listProducts(),
  });
  const [productId, setProductId] = useState('');
  const [createdListing, setCreatedListing] = useState<CreatedListing | null>(
    null,
  );
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const [productSelectionError, setProductSelectionError] = useState<
    string | null
  >(null);

  const selectedProduct = products.data?.products.find(
    (product) => product.id === productId,
  );
  const hasHandledInitialProductIdRef = useRef(false);

  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [startPrice, setStartPrice] = useState('');

  const create = useMutation({
    mutationFn: ({
      productId: createProductId,
      startsAt: createStartsAt,
      endsAt: createEndsAt,
      startPrice: createStartPrice,
    }: CreateListingVariables) =>
      api.listings.create(createProductId, {
        startsAt: createStartsAt,
        endsAt: createEndsAt,
        startPrice: createStartPrice,
      }),
    onSuccess: ({ listing }, variables) => {
      setCreatedListing({
        id: listing.id,
        productPublicId: variables.productPublicId,
      });
      setProductSelectionError(null);
    },
  });

  const trimmedStartsAt = startsAt.trim();
  const trimmedEndsAt = endsAt.trim();
  const trimmedStartPrice = startPrice.trim();

  const hasEnteredStartPrice = trimmedStartPrice.length > 0;

  const hasStartedEnteringListingDetails =
    trimmedStartsAt.length > 0 ||
    trimmedEndsAt.length > 0 ||
    trimmedStartPrice.length > 0;

  const listingCreateRequestResult = listingCreateRequestSchema.safeParse({
    startsAt: trimmedStartsAt,
    endsAt: trimmedEndsAt,
    startPrice: parseMoneyInput(trimmedStartPrice),
  });

  const hasValidListingRequest =
    hasEnteredStartPrice && listingCreateRequestResult.success;

  const isListingDraftLocked = create.isPending || Boolean(createdListing);

  const canCreateListing =
    selectedProduct?.status === 'APPROVED' &&
    !isListingDraftLocked &&
    hasValidListingRequest;

  useEffect(() => {
    if (
      !products.data ||
      hasHandledInitialProductIdRef.current ||
      !initialProductId
    ) {
      return;
    }

    const initialProduct = products.data.products.find(
      (product) => product.id === initialProductId,
    );

    if (initialProduct?.status === 'APPROVED') {
      hasHandledInitialProductIdRef.current = true;
      setProductId(initialProduct.id);
      setProductSelectionError(null);
      return;
    }

    if (products.isFetching || products.isRefetchError) {
      return;
    }

    hasHandledInitialProductIdRef.current = true;
    setProductSelectionError(
      'Выбранный предмет не найден, не принадлежит вам или не имеет статуса APPROVED.',
    );
  }, [
    initialProductId,
    products.data,
    products.isFetching,
    products.isRefetchError,
  ]);

  useEffect(() => {
    if (productId && !create.isPending && !createdListing && products.data) {
      const p = products.data.products.find(
        (product) => product.id === productId,
      );
      if (!p || p.status !== 'APPROVED') {
        setProductId('');
        setProductSelectionError(
          'Выбранный предмет больше недоступен или не имеет статуса APPROVED.',
        );
      }
    }
  }, [productId, create.isPending, createdListing, products.data]);

  const handleProductSelect = (nextProductId: string) => {
    hasHandledInitialProductIdRef.current = true;
    setProductId(nextProductId);
    setProductSelectionError(null);
  };

  const handleCreateListing = () => {
    if (
      !selectedProduct ||
      selectedProduct.status !== 'APPROVED' ||
      createdListing ||
      !hasEnteredStartPrice ||
      !listingCreateRequestResult.success
    ) {
      return;
    }

    create.mutate({
      productId: selectedProduct.id,
      productPublicId: selectedProduct.publicId,
      startsAt: listingCreateRequestResult.data.startsAt,
      endsAt: listingCreateRequestResult.data.endsAt,
      startPrice: listingCreateRequestResult.data.startPrice,
    });
  };

  const schedule = useMutation({
    mutationFn: (id: string) => api.listings.update(id, 'SCHEDULE'),
  });

  const handleSchedule = () => {
    if (!createdListing) return;
    schedule.mutate(createdListing.id);
  };

  if (!products.data) {
    if (products.isLoading) {
      return (
        <Screen>
          <LoadingState label="Загружаем ваши предметы" />
        </Screen>
      );
    }

    return (
      <Screen>
        <ErrorState
          description="Не удалось загрузить предметы"
          onAction={() => products.refetch()}
        />
      </Screen>
    );
  }
  return (
    <Screen>
      <YStack style={{ gap: mobileSpacing[5] }}>
        <SectionHeader
          title="Новое размещение"
          description="Укажите расписание аукциона и стартовую цену. Валюта: BYN."
        />

        {/* Product selection */}
        <OperationalPanel eyebrow="Предмет">
          <YStack style={{ gap: mobileSpacing[2] }}>
            {products.isRefetchError ? (
              <YStack
                style={{
                  gap: mobileSpacing[2],
                  marginBottom: mobileSpacing[2],
                }}
              >
                <Text style={{ color: palette.negative }}>
                  Не удалось обновить список предметов.
                </Text>
                <AppButton
                  tone="subtle"
                  buttonSize="small"
                  isLoading={products.isFetching}
                  onPress={() => {
                    void products.refetch();
                  }}
                >
                  Повторить обновление
                </AppButton>
              </YStack>
            ) : null}
            {products.data.products.map((product) => {
              const isApproved = product.status === 'APPROVED';
              return (
                <YStack key={product.id} style={{ gap: mobileSpacing[1] }}>
                  <AppButton
                    tone={product.id === productId ? 'primary' : 'secondary'}
                    disabled={!isApproved || isListingDraftLocked}
                    onPress={() => handleProductSelect(product.id)}
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
                    <AppButton
                      tone="subtle"
                      buttonSize="small"
                      disabled={isListingDraftLocked}
                    >
                      Редактировать предмет
                    </AppButton>
                  </Link>
                </YStack>
              );
            })}
            {productSelectionError ? (
              <Text style={{ color: palette.negative }}>
                {productSelectionError}
              </Text>
            ) : null}
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
              editable={!isListingDraftLocked}
            />
            <AppInput
              label="Окончание"
              value={endsAt}
              onChangeText={setEndsAt}
              placeholder="2026-07-21T12:00:00.000Z"
              autoCapitalize="none"
              editable={!isListingDraftLocked}
            />
            <AppInput
              label="Стартовая цена, BYN"
              value={startPrice}
              onChangeText={setStartPrice}
              placeholder="0"
              keyboardType="decimal-pad"
              editable={!isListingDraftLocked}
            />
          </YStack>
        </OperationalPanel>

        {hasStartedEnteringListingDetails &&
        !hasValidListingRequest &&
        !createdListing ? (
          <Text style={{ color: palette.negative }}>
            Проверьте даты, их порядок и стартовую цену. Цена должна быть
            неотрицательной и содержать не более двух знаков после запятой.
          </Text>
        ) : null}

        {!createdListing ? (
          <AppButton
            isLoading={create.isPending}
            onPress={handleCreateListing}
            disabled={!canCreateListing}
          >
            Создать размещение
          </AppButton>
        ) : null}

        {createdListing && !schedule.isSuccess ? (
          <AppButton
            tone="secondary"
            isLoading={schedule.isPending}
            onPress={handleSchedule}
          >
            Запланировать размещение
          </AppButton>
        ) : null}

        {schedule.isSuccess && createdListing ? (
          <YStack style={{ gap: mobileSpacing[3] }}>
            <Link
              href={{
                pathname: '/product/[publicId]',
                params: {
                  publicId: createdListing.productPublicId,
                },
              }}
              asChild
            >
              <AppButton buttonSize="large" tone="primary">
                Открыть страницу аукциона
              </AppButton>
            </Link>
            {Platform.OS === 'web' ? (
              <YStack style={{ gap: mobileSpacing[2] }}>
                <AppButton
                  buttonSize="large"
                  tone="secondary"
                  onPress={async () => {
                    if (typeof window !== 'undefined' && navigator.clipboard) {
                      try {
                        const url = new URL(
                          `/product/${createdListing.productPublicId}`,
                          window.location.origin,
                        ).toString();
                        await navigator.clipboard.writeText(url);
                        setCopyState('success');
                      } catch {
                        setCopyState('error');
                      }
                    } else {
                      setCopyState('error');
                    }
                  }}
                >
                  Скопировать ссылку
                </AppButton>
                {copyState === 'success' ? (
                  <Text
                    style={{ color: palette.positive, textAlign: 'center' }}
                  >
                    Ссылка скопирована
                  </Text>
                ) : null}
                {copyState === 'error' ? (
                  <Text
                    style={{ color: palette.negative, textAlign: 'center' }}
                  >
                    Не удалось скопировать ссылку
                  </Text>
                ) : null}
              </YStack>
            ) : null}
          </YStack>
        ) : null}

        {create.isError ? (
          <Text style={{ color: palette.negative }}>
            Не удалось создать размещение. Повторите попытку или проверьте
            актуальность предмета.
          </Text>
        ) : null}

        {schedule.isError ? (
          <Text style={{ color: palette.negative }}>
            Размещение создано, но не удалось его запланировать. Повторите
            попытку.
          </Text>
        ) : null}
      </YStack>
    </Screen>
  );
}

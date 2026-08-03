import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listingCreateRequestSchema } from '@bidplace/contracts';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppText,
  FormSection,
  PageState,
  PrimaryButton,
  SecondaryButton,
  TextButton,
  TextField,
} from '../../components/modern-ui';
import { useApiClient } from '../../providers/api-provider';
import { formatDateTime } from '../../lib/formatters';
import {
  parseDateTimeInputValue,
  presentEnum,
  productStatusLabels,
} from '../../lib/presentation';

type ListingDraftScreenProps = { initialProductId?: string };
type CreateListingVariables = {
  productId: string;
  productPublicId: string;
  startsAt: string;
  endsAt: string;
  startPrice: number;
};
type CreatedListing = { id: string; productPublicId: string };

function parseMoneyInput(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

function parseListingDateTime(value: string): string | null {
  const isoValue = parseDateTimeInputValue(value);
  if (isoValue) return isoValue;

  const match = value
    .trim()
    .match(/^(\d{2})\.(\d{2})\.(\d{4}),?\s+(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, day, month, year, hours, minutes] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
  );
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function ListingDraftScreen({
  initialProductId,
}: ListingDraftScreenProps) {
  const api = useApiClient();
  const router = useRouter();
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
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const hasHandledInitialProductIdRef = useRef(false);
  const selectedProduct = products.data?.products.find(
    (product) => product.id === productId,
  );
  const trimmedStartsAt = startsAt.trim();
  const trimmedEndsAt = endsAt.trim();
  const trimmedStartPrice = startPrice.trim();
  const request = listingCreateRequestSchema.safeParse({
    startsAt: parseListingDateTime(trimmedStartsAt) ?? trimmedStartsAt,
    endsAt: parseListingDateTime(trimmedEndsAt) ?? trimmedEndsAt,
    startPrice: parseMoneyInput(trimmedStartPrice),
  });
  const create = useMutation({
    mutationFn: ({
      productId: id,
      startsAt: start,
      endsAt: end,
      startPrice: price,
    }: CreateListingVariables) =>
      api.listings.create(id, {
        startsAt: start,
        endsAt: end,
        startPrice: price,
      }),
    onSuccess: ({ listing }, variables) => {
      setCreatedListing({
        id: listing.id,
        productPublicId: variables.productPublicId,
      });
      setProductSelectionError(null);
    },
  });
  const schedule = useMutation({
    mutationFn: (id: string) => api.listings.update(id, 'SCHEDULE'),
  });
  const isLocked = create.isPending || Boolean(createdListing);
  const canCreate =
    selectedProduct?.status === 'APPROVED' &&
    !isLocked &&
    trimmedStartPrice.length > 0 &&
    request.success;

  useEffect(() => {
    if (
      !products.data ||
      hasHandledInitialProductIdRef.current ||
      !initialProductId
    )
      return;
    const initialProduct = products.data.products.find(
      (product) => product.id === initialProductId,
    );
    if (initialProduct?.status === 'APPROVED') {
      hasHandledInitialProductIdRef.current = true;
      setProductId(initialProduct.id);
      setProductSelectionError(null);
      return;
    }
    if (products.isFetching || products.isRefetchError) return;
    hasHandledInitialProductIdRef.current = true;
    setProductSelectionError(
      'Выбранный предмет не найден, не принадлежит вам или не одобрен.',
    );
  }, [
    initialProductId,
    products.data,
    products.isFetching,
    products.isRefetchError,
  ]);

  useEffect(() => {
    if (!productId || create.isPending || createdListing || !products.data)
      return;
    const product = products.data.products.find(
      (item) => item.id === productId,
    );
    if (!product || product.status !== 'APPROVED') {
      setProductId('');
      setProductSelectionError(
        'Выбранный предмет больше недоступен или не одобрен.',
      );
    }
  }, [productId, create.isPending, createdListing, products.data]);

  if (!products.data)
    return (
      <ListingShell>
        {products.isLoading ? (
          <PageState title="Загружаем ваши предметы…" loading />
        ) : (
          <>
            <AppText role="sectionTitle">Не удалось загрузить предметы</AppText>
            <SecondaryButton
              label="Повторить"
              onPress={() => void products.refetch()}
            />
          </>
        )}
      </ListingShell>
    );

  return (
    <ListingShell>
      <View style={{ gap: modernTokens.space.x2 }}>
        <AppText role="screenTitle">Новое размещение</AppText>
        <AppText role="bodySmall" tone="secondary">
          Укажите расписание аукциона и стартовую цену. Валюта: BYN.
        </AppText>
      </View>
      <FormSection title="Предмет">
        {products.isRefetchError ? (
          <>
            <AppText role="bodySmall" tone="danger">
              Не удалось обновить список предметов.
            </AppText>
            <SecondaryButton
              label="Повторить обновление"
              loading={products.isFetching}
              onPress={() => void products.refetch()}
            />
          </>
        ) : null}
        {products.data.products.map((product) => (
          <View key={product.id} style={{ gap: modernTokens.space.x1 }}>
            <SecondaryButton
              label={`${product.id === productId ? '✓ ' : ''}${product.title ?? product.id} · ${presentEnum(product.status, productStatusLabels, 'Неизвестный статус предмета')}`}
              disabled={product.status !== 'APPROVED' || isLocked}
              onPress={() => {
                hasHandledInitialProductIdRef.current = true;
                setProductId(product.id);
                setProductSelectionError(null);
              }}
            />
            <TextButton
              label="Редактировать предмет"
              disabled={isLocked}
              onPress={() =>
                router.push({
                  pathname: '/(seller)/products/[id]',
                  params: { id: product.id },
                })
              }
            />
          </View>
        ))}
        {productSelectionError ? (
          <AppText role="bodySmall" tone="danger">
            {productSelectionError}
          </AppText>
        ) : null}
      </FormSection>
      <FormSection title="Расписание">
        <TextField
          label="Начало"
          value={startsAt}
          onChangeText={setStartsAt}
          hint="Например: 03.08.2026, 12:00"
          placeholder="ДД.ММ.ГГГГ, ЧЧ:ММ"
          autoCapitalize="none"
          editable={!isLocked}
        />
        <TextField
          label="Окончание"
          value={endsAt}
          onChangeText={setEndsAt}
          hint="Например: 04.08.2026, 18:00"
          placeholder="ДД.ММ.ГГГГ, ЧЧ:ММ"
          autoCapitalize="none"
          editable={!isLocked}
        />
        <TextField
          label="Стартовая цена, BYN"
          value={startPrice}
          onChangeText={setStartPrice}
          placeholder="0"
          keyboardType="decimal-pad"
          editable={!isLocked}
        />
      </FormSection>
      {request.success && !createdListing ? (
        <AppText role="metadata" tone="secondary">
          Период: {formatDateTime(request.data.startsAt)} —{' '}
          {formatDateTime(request.data.endsAt)}
        </AppText>
      ) : null}
      {(trimmedStartsAt || trimmedEndsAt || trimmedStartPrice) &&
      !request.success &&
      !createdListing ? (
        <AppText role="bodySmall" tone="danger">
          Проверьте даты, их порядок и стартовую цену. Цена должна быть
          неотрицательной и содержать не более двух знаков после запятой.
        </AppText>
      ) : null}
      {!createdListing ? (
        <PrimaryButton
          label="Создать размещение"
          loading={create.isPending}
          disabled={!canCreate}
          onPress={() => {
            if (selectedProduct && request.success)
              create.mutate({
                productId: selectedProduct.id,
                productPublicId: selectedProduct.publicId,
                startsAt: request.data.startsAt,
                endsAt: request.data.endsAt,
                startPrice: request.data.startPrice,
              });
          }}
        />
      ) : null}
      {createdListing && !schedule.isSuccess ? (
        <PrimaryButton
          label="Запланировать размещение"
          loading={schedule.isPending}
          onPress={() => schedule.mutate(createdListing.id)}
        />
      ) : null}
      {schedule.isSuccess && createdListing ? (
        <FormSection title="Размещение запланировано">
          <PrimaryButton
            label="Открыть страницу аукциона"
            onPress={() =>
              router.push({
                pathname: '/product/[publicId]',
                params: { publicId: createdListing.productPublicId },
              })
            }
          />
          {Platform.OS === 'web' ? (
            <>
              <SecondaryButton
                label="Скопировать ссылку"
                onPress={() => {
                  void (async () => {
                    if (typeof window === 'undefined' || !navigator.clipboard) {
                      setCopyState('error');
                      return;
                    }
                    try {
                      await navigator.clipboard.writeText(
                        new URL(
                          `/product/${createdListing.productPublicId}`,
                          window.location.origin,
                        ).toString(),
                      );
                      setCopyState('success');
                    } catch {
                      setCopyState('error');
                    }
                  })();
                }}
              />
              {copyState === 'success' ? (
                <AppText role="bodySmall" tone="success">
                  Ссылка скопирована.
                </AppText>
              ) : null}
              {copyState === 'error' ? (
                <AppText role="bodySmall" tone="danger">
                  Не удалось скопировать ссылку.
                </AppText>
              ) : null}
            </>
          ) : null}
        </FormSection>
      ) : null}
      {create.isError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось создать размещение. Повторите попытку или проверьте
          актуальность предмета.
        </AppText>
      ) : null}
      {schedule.isError ? (
        <AppText role="bodySmall" tone="danger">
          Размещение создано, но не удалось его запланировать. Повторите
          попытку.
        </AppText>
      ) : null}
    </ListingShell>
  );
}

function ListingShell({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: modernTokens.space.x5,
        }}
      >
        <View style={{ gap: modernTokens.space.x5 }}>{children}</View>
      </ScrollView>
    </AppShell>
  );
}

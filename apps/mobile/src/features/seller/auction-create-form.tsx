import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AppButton, AppCard, AppInput, EmptyState, ErrorState, LoadingState, FormField } from '../../components/ui';
import { mobileSpacing } from '../../theme/tokens';
import { Text, XStack, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';
import {
  useCreateAuctionMutation,
  useMySellerLotsQuery,
  useMySellerProfileQuery,
} from './hooks';
import { auctionFormSchema, type AuctionFormValues } from './schemas';

function toIsoInput(value: Date) {
  return value.toISOString();
}

export function AuctionCreateForm() {
  const router = useRouter();
  const palette = useAppThemePalette();
  const profileQuery = useMySellerProfileQuery();
  const lotsQuery = useMySellerLotsQuery(undefined, profileQuery.isSuccess);
  const createAuctionMutation = useCreateAuctionMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const draftLots = useMemo(
    () => lotsQuery.data?.lots.filter((lot) => lot.status === 'draft') ?? [],
    [lotsQuery.data],
  );

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      lotId: '',
      slug: '',
      startPrice: 100,
      reservePrice: 150,
      currency: 'USD',
      startsAt: toIsoInput(new Date(Date.now() + 60 * 60 * 1000)),
      endsAt: toIsoInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      buyNowPrice: null,
    },
  });

  const selectedLotId = form.watch('lotId');
  const canSubmit = draftLots.length > 0 && !createAuctionMutation.isPending;

  if (profileQuery.isLoading) {
    return <LoadingState label="Проверяем seller profile" />;
  }

  if (profileQuery.isError) {
    const status = (profileQuery.error as { status?: number } | null)?.status;

    if (status === 404) {
      return (
        <EmptyState
          title="Сначала создайте профиль продавца"
          description="Auction creation доступен только после настройки seller profile."
          actionLabel="Создать профиль"
          onAction={() => router.push('/profile')}
        />
      );
    }

    return (
      <ErrorState
        description={
          profileQuery.error instanceof Error
            ? profileQuery.error.message
            : 'Не удалось проверить seller profile'
        }
        onAction={() => profileQuery.refetch()}
      />
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await createAuctionMutation.mutateAsync({
        lotId: values.lotId,
        slug: values.slug,
        startPrice: values.startPrice,
        reservePrice: values.reservePrice,
        currency: values.currency,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
        buyNowPrice:
          values.buyNowPrice === undefined || values.buyNowPrice === null
            ? null
            : values.buyNowPrice,
      });
      router.back();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось создать auction');
    }
  });

  if (lotsQuery.isLoading) {
    return <LoadingState label="Загружаем lot-ы" />;
  }

  if (lotsQuery.isError) {
    return (
      <ErrorState
        description={lotsQuery.error instanceof Error ? lotsQuery.error.message : 'Не удалось загрузить lot-ы'}
        onAction={() => lotsQuery.refetch()}
      />
    );
  }

  if (draftLots.length === 0) {
    return (
        <EmptyState
        title="Нет draft lot-ов"
        description="Сначала создайте lot, затем вернитесь к созданию auction."
        actionLabel="Создать lot"
        onAction={() => router.push('/lots/new')}
      />
    );
  }

  return (
    <AppCard>
      <YStack style={{ gap: mobileSpacing[4] }}>
        <YStack style={{ gap: mobileSpacing[1] }}>
          <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: '700', color: palette.text }}>
            Создать auction
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
            Выберите draft lot и задайте параметры торгов.
          </Text>
        </YStack>

        <FormField
          label="Lot"
          description="Доступны только draft lot-ы."
          error={form.formState.errors.lotId?.message}
          required
        >
          <YStack style={{ gap: mobileSpacing[2] }}>
            {draftLots.map((lot) => {
              const selected = selectedLotId === lot.id;
              return (
                <AppButton
                  key={lot.id}
                  tone={selected ? 'primary' : 'secondary'}
                  onPress={() => form.setValue('lotId', lot.id, { shouldValidate: true })}
                >
                  {lot.title}
                </AppButton>
              );
            })}
          </YStack>
        </FormField>

        <AppInput
          label="Slug"
          placeholder="demo-auction"
          autoCapitalize="none"
          autoCorrect={false}
          {...form.register('slug')}
          error={form.formState.errors.slug?.message}
        />

        <XStack style={{ gap: mobileSpacing[2], flexWrap: 'wrap' }}>
        <AppInput
          label="Start price"
          placeholder="100"
          keyboardType="decimal-pad"
          inputMode="decimal"
          {...form.register('startPrice', {
            setValueAs: (value) => Number(value),
          })}
          error={form.formState.errors.startPrice?.message}
        />
        <AppInput
          label="Reserve price"
          placeholder="150"
          keyboardType="decimal-pad"
          inputMode="decimal"
          {...form.register('reservePrice', {
            setValueAs: (value) => Number(value),
          })}
          error={form.formState.errors.reservePrice?.message}
        />
        </XStack>

        <AppInput
          label="Currency"
          placeholder="USD"
          autoCapitalize="characters"
          {...form.register('currency')}
          error={form.formState.errors.currency?.message}
        />

        <AppInput
          label="Starts at"
          description="ISO date-time, for example 2026-07-13T13:00:00.000Z"
          placeholder="2026-07-13T13:00:00.000Z"
          autoCapitalize="none"
          autoCorrect={false}
          {...form.register('startsAt')}
          error={form.formState.errors.startsAt?.message}
        />

        <AppInput
          label="Ends at"
          description="ISO date-time, for example 2026-07-14T13:00:00.000Z"
          placeholder="2026-07-14T13:00:00.000Z"
          autoCapitalize="none"
          autoCorrect={false}
          {...form.register('endsAt')}
          error={form.formState.errors.endsAt?.message}
        />

        <AppInput
          label="Buy now price"
          description="Опционально."
          placeholder="200"
          keyboardType="decimal-pad"
          inputMode="decimal"
          {...form.register('buyNowPrice', {
            setValueAs: (value) => (value === '' ? null : Number(value)),
          })}
          error={form.formState.errors.buyNowPrice?.message as string | undefined}
        />

        {submitError ? (
          <Text style={{ color: palette.danger, fontSize: 14, lineHeight: 20 }}>
            {submitError}
          </Text>
        ) : null}

        <XStack style={{ gap: mobileSpacing[2] }}>
          <AppButton tone="secondary" onPress={() => router.back()}>
            Отмена
          </AppButton>
          <AppButton onPress={onSubmit} isLoading={createAuctionMutation.isPending} disabled={!canSubmit}>
            Создать auction
          </AppButton>
        </XStack>
      </YStack>
    </AppCard>
  );
}

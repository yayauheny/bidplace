import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Text, XStack, YStack } from 'tamagui';

import {
  AppButton,
  AppCard,
  ControlledAppInput,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  PageIntro,
} from '../../components/ui';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { mobileSpacing } from '../../theme/tokens';
import {
  formatNumberInput,
  parseOptionalNumberInput,
  parseRequiredNumberInput,
  toIsoInput,
} from './form-helpers';
import { useCreateAuctionMutation, useMySellerLotsQuery } from './hooks';
import { useSellerProfileRequirement } from './profile-requirement';
import { auctionFormSchema, type AuctionFormValues } from './schemas';

export function AuctionCreateForm() {
  const router = useRouter();
  const profileRequirement = useSellerProfileRequirement(
    'Не удалось проверить seller profile',
  );
  const lotsQuery = useMySellerLotsQuery(
    undefined,
    profileRequirement.kind === 'ready',
  );
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

  if (profileRequirement.kind === 'loading') {
    return <LoadingState label="Проверяем seller profile" />;
  }

  if (profileRequirement.kind === 'missing') {
    return (
      <EmptyState
        title="Сначала создайте профиль продавца"
        description="Auction creation доступен только после настройки seller profile."
        actionLabel="Создать профиль"
        onAction={() => router.push('/profile')}
      />
    );
  }

  if (profileRequirement.kind === 'error') {
    return (
      <ErrorState
        description={profileRequirement.message}
        onAction={() => profileRequirement.retry()}
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
      setSubmitError(getUserFacingErrorMessage(error, 'Не удалось создать auction'));
    }
  });

  if (lotsQuery.isLoading) {
    return <LoadingState label="Загружаем lot-ы" />;
  }

  if (lotsQuery.isError) {
    return (
      <ErrorState
        description={getUserFacingErrorMessage(lotsQuery.error, 'Не удалось загрузить lot-ы')}
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
        <PageIntro
          title="Создать auction"
          description="Выберите draft lot и задайте параметры торгов."
        />

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

        <ControlledAppInput
          control={form.control}
          name="slug"
          label="Slug"
          placeholder="demo-auction"
          autoCapitalize="none"
          autoCorrect={false}
          error={form.formState.errors.slug?.message}
        />

        <XStack style={{ gap: mobileSpacing[2], flexWrap: 'wrap' }}>
          <ControlledAppInput
            control={form.control}
            name="startPrice"
            label="Start price"
            placeholder="100"
            keyboardType="decimal-pad"
            inputMode="decimal"
            formatValue={formatNumberInput}
            parseValue={parseRequiredNumberInput}
            error={form.formState.errors.startPrice?.message}
          />
          <ControlledAppInput
            control={form.control}
            name="reservePrice"
            label="Reserve price"
            placeholder="150"
            keyboardType="decimal-pad"
            inputMode="decimal"
            formatValue={formatNumberInput}
            parseValue={parseRequiredNumberInput}
            error={form.formState.errors.reservePrice?.message}
          />
        </XStack>

        <ControlledAppInput
          control={form.control}
          name="currency"
          label="Currency"
          placeholder="USD"
          autoCapitalize="characters"
          error={form.formState.errors.currency?.message}
        />

        <ControlledAppInput
          control={form.control}
          name="startsAt"
          label="Starts at"
          description="ISO date-time, for example 2026-07-13T13:00:00.000Z"
          placeholder="2026-07-13T13:00:00.000Z"
          autoCapitalize="none"
          autoCorrect={false}
          error={form.formState.errors.startsAt?.message}
        />

        <ControlledAppInput
          control={form.control}
          name="endsAt"
          label="Ends at"
          description="ISO date-time, for example 2026-07-14T13:00:00.000Z"
          placeholder="2026-07-14T13:00:00.000Z"
          autoCapitalize="none"
          autoCorrect={false}
          error={form.formState.errors.endsAt?.message}
        />

        <ControlledAppInput
          control={form.control}
          name="buyNowPrice"
          label="Buy now price"
          description="Опционально."
          placeholder="200"
          keyboardType="decimal-pad"
          inputMode="decimal"
          formatValue={formatNumberInput}
          parseValue={parseOptionalNumberInput}
          error={form.formState.errors.buyNowPrice?.message}
        />

        {submitError ? (
          <Text color="$danger" style={{ fontSize: 14, lineHeight: 20 }}>
            {submitError}
          </Text>
        ) : null}

        <XStack style={{ gap: mobileSpacing[2] }}>
          <AppButton tone="secondary" onPress={() => router.back()}>
            Отмена
          </AppButton>
          <AppButton
            onPress={onSubmit}
            isLoading={createAuctionMutation.isPending}
            disabled={!canSubmit}
            buttonSize="large"
          >
            Создать auction
          </AppButton>
        </XStack>
      </YStack>
    </AppCard>
  );
}

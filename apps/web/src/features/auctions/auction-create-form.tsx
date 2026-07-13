'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PrimaryButton, SelectField, TextField } from '../../components/ui/controls';
import { Heading, Text } from '../../components/ui/layout';
import { LoadingBlock } from '../../components/ui/states';
import { Card } from '../../components/ui/surfaces';
import { spacing } from '../../theme/tokens';
import { useCreateAuctionMutation, usePublishAuctionMutation } from './hooks';
import { YStack } from '../../components/ui/stack';

const auctionFormSchema = z
  .object({
    lotId: z.string().uuid(),
    slug: z.string().trim().min(1),
    startPrice: z.coerce.number().nonnegative(),
    reservePrice: z.coerce.number().nonnegative(),
    currency: z.string().trim().length(3),
    startsAt: z.string().trim().min(1),
    endsAt: z.string().trim().min(1),
    buyNowPrice: z.coerce.number().nonnegative().optional(),
  })
  .refine((value) => value.reservePrice >= value.startPrice, {
    message: 'Резерв не может быть меньше стартовой цены',
    path: ['reservePrice'],
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: 'Финиш должен быть позже старта',
    path: ['endsAt'],
  });

type AuctionFormValues = z.infer<typeof auctionFormSchema>;

export function AuctionCreateForm() {
  const router = useRouter();
  const createMutation = useCreateAuctionMutation();
  const publishMutation = usePublishAuctionMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAuction, setCreatedAuction] = useState<{
    id: string;
    slug: string;
  } | null>(null);

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      lotId: '',
      slug: '',
      startPrice: 0,
      reservePrice: 0,
      currency: 'USD',
      startsAt: '',
      endsAt: '',
      buyNowPrice: undefined,
    },
  });

  const onCreate = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const response = await createMutation.mutateAsync({
        lotId: values.lotId,
        slug: values.slug.trim(),
        startPrice: values.startPrice,
        reservePrice: values.reservePrice,
        currency: values.currency.trim().toUpperCase(),
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
        buyNowPrice:
          values.buyNowPrice === null || values.buyNowPrice === undefined
            ? undefined
            : values.buyNowPrice,
      });

      setCreatedAuction({
        id: response.auction.id,
        slug: response.auction.slug,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось создать аукцион');
    }
  });

  const onPublish = async () => {
    if (!createdAuction) {
      return;
    }

    setSubmitError(null);

    try {
      const response = await publishMutation.mutateAsync(createdAuction.id);
      router.replace(`/auctions/${response.auction.slug}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось опубликовать аукцион');
    }
  };

  if (createMutation.isPending) {
    return <LoadingBlock label="Создаем аукцион" />;
  }

  return (
    <Card>
      <YStack gap={spacing[2]}>
        <Heading level="h2">Создание аукциона</Heading>
        <Text tone="muted">
          Сначала создаем черновик, потом публикуем его отдельным действием.
        </Text>
      </YStack>

      {createdAuction ? (
        <Card>
          <Heading level="h3">Черновик создан</Heading>
          <Text tone="muted">Slug: {createdAuction.slug}</Text>
          <PrimaryButton
            onPress={onPublish}
            isLoading={publishMutation.isPending}
            loadingLabel="Публикуем"
          >
            Опубликовать аукцион
          </PrimaryButton>
        </Card>
      ) : null}

      <YStack gap={spacing[3]}>
        <TextField
          label="Lot ID"
          placeholder="UUID лота"
          {...form.register('lotId')}
          error={form.formState.errors.lotId?.message}
        />
        <TextField
          label="Slug"
          placeholder="demo-auction"
          {...form.register('slug')}
          error={form.formState.errors.slug?.message}
        />
        <TextField
          label="Стартовая цена"
          type="number"
          step="0.01"
          min={0}
          {...form.register('startPrice', { valueAsNumber: true })}
          error={form.formState.errors.startPrice?.message}
        />
        <TextField
          label="Резервная цена"
          type="number"
          step="0.01"
          min={0}
          {...form.register('reservePrice', { valueAsNumber: true })}
          error={form.formState.errors.reservePrice?.message}
        />
        <SelectField
          label="Валюта"
          {...form.register('currency')}
          error={form.formState.errors.currency?.message}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="BYN">BYN</option>
        </SelectField>
        <TextField
          label="Старт"
          type="datetime-local"
          {...form.register('startsAt')}
          error={form.formState.errors.startsAt?.message}
        />
        <TextField
          label="Финиш"
          type="datetime-local"
          {...form.register('endsAt')}
          error={form.formState.errors.endsAt?.message}
        />
        <TextField
          label="Buy now price"
          type="number"
          step="0.01"
          min={0}
          {...form.register('buyNowPrice', {
            setValueAs: (value) => (value === '' ? undefined : Number(value)),
          })}
          error={form.formState.errors.buyNowPrice?.message}
        />
        {submitError ? <Text tone="danger">{submitError}</Text> : null}
        <PrimaryButton
          onPress={onCreate}
          isLoading={form.formState.isSubmitting}
          loadingLabel="Создаем"
        >
          Создать аукцион
        </PrimaryButton>
      </YStack>
      {createdAuction ? (
        <Text size="caption" tone="muted">
          После публикации аукцион будет доступен по public route.
        </Text>
      ) : (
        <Text size="caption" tone="muted">
          Формат дат: local time в вашем браузере.
        </Text>
      )}
      <Text size="caption" tone="muted">
        Минимальный шаг и финальные статусы вычисляются сервером.
      </Text>
    </Card>
  );
}

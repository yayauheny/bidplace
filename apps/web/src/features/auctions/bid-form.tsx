'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import type { Auction } from '@bidplace/contracts';

import { PrimaryButton, TextField } from '../../components/ui/controls';
import { Text } from '../../components/ui/layout';
import { ErrorState } from '../../components/ui/states';
import { spacing } from '../../theme/tokens';
import { useAuth } from '../../providers/auth-provider';
import { formatCurrencyAmount } from '../../lib/formatters';
import { usePlaceBidMutation } from './hooks';
import { getAuctionStatusLabel } from './utils';
import { YStack } from '../../components/ui/stack';

function createBidSchema(minimumBid: number) {
  return z.object({
    amount: z
      .number({
        invalid_type_error: 'Введите сумму',
      })
      .finite()
      .positive()
      .min(minimumBid, `Минимальная ставка ${formatCurrencyAmount(minimumBid)}`),
  });
}

type BidFormProps = {
  auction: Auction;
};

export function BidForm({ auction }: BidFormProps) {
  const auth = useAuth();
  const minimumBid = useMemo(
    () => auction.currentPrice + auction.bidStep,
    [auction.currentPrice, auction.bidStep],
  );
  const schema = useMemo(() => createBidSchema(minimumBid), [minimumBid]);
  const mutation = usePlaceBidMutation(auction.id, auction.slug);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: minimumBid,
    },
  });

  const canBid = auth.isAuthenticated && auction.status === 'active';

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const response = await mutation.mutateAsync(values);
      form.reset({
        amount: response.auction.currentPrice + response.auction.bidStep,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось поставить ставку');
    }
  });

  if (!auth.ready) {
    return <Text tone="muted">Проверяем доступ...</Text>;
  }

  if (!auth.isAuthenticated) {
    return (
      <ErrorState
        title="Нужен вход"
        description="Чтобы поставить ставку, войдите в аккаунт."
        actionLabel="Перейти к входу"
        onAction={() => {
          window.location.href = '/login';
        }}
      />
    );
  }

  return (
    <YStack gap={spacing[3]}>
      <Text size="small" tone="muted">
        Минимальная ставка {formatCurrencyAmount(minimumBid, auction.currency)}
      </Text>
      <TextField
        label="Ставка"
        type="number"
        inputMode="decimal"
        step="0.01"
        min={minimumBid}
        disabled={!canBid || mutation.isPending}
        {...form.register('amount', { valueAsNumber: true })}
        error={form.formState.errors.amount?.message}
      />
      {submitError ? <Text tone="danger">{submitError}</Text> : null}
      <PrimaryButton
        onPress={onSubmit}
        disabled={!canBid}
        isLoading={mutation.isPending}
        loadingLabel="Отправляем ставку"
      >
        {auction.status === 'active'
          ? 'Поставить ставку'
          : `Аукцион ${getAuctionStatusLabel(auction.status).toLowerCase()}`}
      </PrimaryButton>
    </YStack>
  );
}

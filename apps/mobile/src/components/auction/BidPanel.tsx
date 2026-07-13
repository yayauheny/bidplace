import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Auction } from '@bidplace/contracts';
import { useRouter } from 'expo-router';

import { formatCurrencyAmount } from '../../lib/formatters';
import { AppButton, AppCard, ControlledAppInput, ErrorState } from '../ui';
import { mobileSpacing } from '../../theme/tokens';
import { useAuth } from '../../providers/auth-provider';
import { usePlaceBidMutation } from '../../features/auctions/hooks';
import { getAuctionStatusLabel } from '../../features/auctions/utils';
import { Text, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';

function createBidSchema(minimumBid: number) {
  return z.object({
    amount: z
      .coerce.number({
        invalid_type_error: 'Введите сумму',
      })
      .finite()
      .positive()
      .min(minimumBid, `Минимальная ставка ${formatCurrencyAmount(minimumBid)}`),
  });
}

function formatBidAmount(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }

  return String(value);
}

function parseBidAmount(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return Number.NaN;
  }

  return Number(trimmedValue);
}

type BidPanelProps = {
  auction: Auction;
};

export function BidPanel({ auction }: BidPanelProps) {
  const auth = useAuth();
  const router = useRouter();
  const palette = useAppThemePalette();
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
    return <Text style={{ color: palette.textMuted }}>Проверяем доступ...</Text>;
  }

  if (!auth.isAuthenticated) {
    return (
      <ErrorState
        title="Нужен вход"
        description="Чтобы поставить ставку, войдите в аккаунт."
        actionLabel="Перейти к входу"
        onAction={() => router.push('/login')}
      />
    );
  }

  if (!canBid) {
    return (
      <AppCard>
        <YStack style={{ gap: mobileSpacing[2] }}>
          <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: palette.text }}>
            Ставка недоступна
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
            Аукцион сейчас в состоянии "{getAuctionStatusLabel(auction.status).toLowerCase()}".
          </Text>
        </YStack>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <YStack style={{ gap: mobileSpacing[3] }}>
        <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: palette.text }}>
          Сделать ставку
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
          Минимальная ставка {formatCurrencyAmount(minimumBid, auction.currency)}
        </Text>
        <ControlledAppInput
          control={form.control}
          name="amount"
          label="Сумма ставки"
          inputMode="decimal"
          keyboardType="decimal-pad"
          autoComplete="off"
          editable={!mutation.isPending}
          formatValue={formatBidAmount}
          parseValue={parseBidAmount}
          error={form.formState.errors.amount?.message}
        />
        {submitError ? (
          <Text style={{ color: palette.danger, fontSize: 14, lineHeight: 20 }}>{submitError}</Text>
        ) : null}
        <AppButton
          onPress={onSubmit}
          isLoading={mutation.isPending}
          loadingLabel="Отправляем ставку"
        >
          Поставить ставку
        </AppButton>
      </YStack>
    </AppCard>
  );
}

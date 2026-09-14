import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  DestructiveButton,
  FormSection,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { useApiClient } from '../../providers/api-provider';

export function AdminRecoveryPanel() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [listingId, setListingId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const needsOrder = useQuery({
    queryKey: ['admin', 'listings', 'needs-order'],
    queryFn: () => api.admin.listListingsNeedingOrder(),
  });

  const createOrder = useMutation({
    mutationFn: (targetListingId: string) =>
      api.admin.createOrderForEndedListing(targetListingId),
    onSuccess: () => {
      setActionError(null);
      setActionMessage('Заказ создан для завершённого аукциона.');
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'listings', 'needs-order'],
      });
    },
    onError: (error) => {
      setActionMessage(null);
      setActionError(
        getUserFacingErrorMessage(error, 'Не удалось создать заказ'),
      );
    },
  });

  const emergencyCancel = useMutation({
    mutationFn: () =>
      api.admin.emergencyCancelListing(listingId.trim(), {
        reason: cancelReason.trim(),
      }),
    onSuccess: () => {
      setActionError(null);
      setActionMessage('Торги экстренно остановлены.');
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'listings', 'needs-order'],
      });
    },
    onError: (error) => {
      setActionMessage(null);
      setActionError(
        getUserFacingErrorMessage(error, 'Не удалось остановить торги'),
      );
    },
  });

  const cancelReasonMissing = cancelReason.trim().length === 0;
  const listingIdMissing = listingId.trim().length === 0;

  return (
    <View style={{ gap: designTokens.space.x4 }}>
      <FormSection
        title="Завершённые аукционы без заказа"
        description="Создайте winner Order для ENDED listings с принятыми ставками."
      >
        {needsOrder.isLoading ? (
          <AppText role="bodySmall" tone="secondary">
            Загружаем очередь…
          </AppText>
        ) : null}
        {needsOrder.isError ? (
          <AppText role="bodySmall" tone="danger">
            {getUserFacingErrorMessage(
              needsOrder.error,
              'Не удалось загрузить очередь восстановления',
            )}
          </AppText>
        ) : null}
        {needsOrder.data?.listings.map((listing) => (
          <View key={listing.listingId} style={{ gap: designTokens.space.x2 }}>
            <AppText role="bodySmall" tone="secondary">
              {listing.productTitle ?? listing.productPublicId} · ставок:{' '}
              {listing.bidCount}
              {listing.handoffReady ? '' : ' · handoff не готов'}
            </AppText>
            <SecondaryButton
              label="Создать заказ"
              loading={
                createOrder.isPending &&
                createOrder.variables === listing.listingId
              }
              disabled={createOrder.isPending}
              onPress={() => createOrder.mutate(listing.listingId)}
            />
          </View>
        ))}
        {needsOrder.data?.listings.length === 0 ? (
          <AppText role="bodySmall" tone="secondary">
            Очередь пуста.
          </AppText>
        ) : null}
      </FormSection>

      <FormSection
        title="Экстренная остановка торгов"
        description="Отменяет SCHEDULED или LIVE listing. Ставки сохраняются, заказ не создаётся."
      >
        <TextField
          label="Listing ID"
          value={listingId}
          onChangeText={setListingId}
          placeholder="UUID listing"
          autoCapitalize="none"
        />
        <TextField
          label="Причина"
          value={cancelReason}
          onChangeText={setCancelReason}
          placeholder="Кратко опишите инцидент"
        />
        <DestructiveButton
          label="Экстренно остановить"
          loading={emergencyCancel.isPending}
          disabled={
            listingIdMissing || cancelReasonMissing || emergencyCancel.isPending
          }
          onPress={() => emergencyCancel.mutate()}
        />
      </FormSection>

      {actionMessage ? (
        <AppText role="bodySmall" tone="secondary">
          {actionMessage}
        </AppText>
      ) : null}
      {actionError ? (
        <AppText role="bodySmall" tone="danger">
          {actionError}
        </AppText>
      ) : null}
    </View>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError, type ApiClient } from '@bidplace/api-client';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  DetailList,
  ErrorState,
  LoadingState,
  OperationalPanel,
  Screen,
  SectionHeader,
} from '../../components/ui';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { mobileSpacing } from '../../theme/tokens';

type SellerOrderAction = 'contacted' | 'completed' | 'handoffFailed';
type OrderResponse = Awaited<ReturnType<ApiClient['orders']['get']>>;
type SellerProjection = Extract<OrderResponse, { buyerEmailAtClose: string }>;
type BuyerProjection = Extract<OrderResponse, { sellerHandoffType: string | null }>;
type AdminProjection = Extract<OrderResponse, { handoffInitiator: string }>;

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ru-BY');
}

export function OrderScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [lastAction, setLastAction] = useState<SellerOrderAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['orders', publicId, auth.user?.id ?? 'anonymous'],
    queryFn: () => api.orders.get(publicId),
    enabled: auth.isAuthenticated,
  });

  const invalidateRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders', publicId] }),
      queryClient.invalidateQueries({ queryKey: ['user', 'activity'] }),
    ]);
  };

  const sellerActionMutation = {
    contacted: useMutation({
      mutationFn: () => api.orders.contacted(publicId),
      onMutate: () => {
        setLastAction('contacted');
        setActionError(null);
      },
      onSuccess: () => {
        setLastAction(null);
        setActionError(null);
        void invalidateRelatedQueries();
      },
      onError: (error) => {
        setLastAction('contacted');
        setActionError(
          getUserFacingErrorMessage(
            error,
            'Не удалось обновить статус передачи. Попробуйте ещё раз.',
          ),
        );
      },
    }),
    completed: useMutation({
      mutationFn: () => api.orders.completed(publicId),
      onMutate: () => {
        setLastAction('completed');
        setActionError(null);
      },
      onSuccess: () => {
        setLastAction(null);
        setActionError(null);
        void invalidateRelatedQueries();
      },
      onError: (error) => {
        setLastAction('completed');
        setActionError(
          getUserFacingErrorMessage(
            error,
            'Не удалось обновить статус передачи. Попробуйте ещё раз.',
          ),
        );
      },
    }),
    handoffFailed: useMutation({
      mutationFn: () => api.orders.handoffFailed(publicId),
      onMutate: () => {
        setLastAction('handoffFailed');
        setActionError(null);
      },
      onSuccess: () => {
        setLastAction(null);
        setActionError(null);
        void invalidateRelatedQueries();
      },
      onError: (error) => {
        setLastAction('handoffFailed');
        setActionError(
          getUserFacingErrorMessage(
            error,
            'Не удалось обновить статус передачи. Попробуйте ещё раз.',
          ),
        );
      },
    }),
  } as const;

  if (!auth.isAuthenticated || query.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем заказ" />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    const kind = query.error instanceof ApiClientError
      ? query.error.kind === 'forbidden'
        ? 'forbidden'
        : query.error.kind === 'not_found'
          ? 'notFound'
          : 'generic'
      : 'generic';

    return (
      <Screen>
        <ErrorState
          kind={kind}
          description="Заказ недоступен"
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  const response = query.data as OrderResponse;
  const { order, productSummary } = response;
  const isAdminView = auth.isAdmin;
  const isSellerView = !isAdminView && 'buyerEmailAtClose' in response;
  const sellerViewOrder = response as unknown as SellerProjection;
  const buyerViewOrder = response as unknown as BuyerProjection;
  const adminViewOrder = response as unknown as AdminProjection;
  const hasSellerContact =
    buyerViewOrder.sellerHandoffType !== null &&
    buyerViewOrder.sellerHandoffValue !== null;
  const sellerCanAct = isSellerView && !isAdminView;

  const retryLastSellerAction = () => {
    if (lastAction === 'contacted') {
      sellerActionMutation.contacted.mutate();
    } else if (lastAction === 'completed') {
      sellerActionMutation.completed.mutate();
    } else if (lastAction === 'handoffFailed') {
      sellerActionMutation.handoffFailed.mutate();
    }
  };

  const detailItems = [
    { label: 'Предмет', value: productSummary.title ?? 'Предмет' },
    { label: 'Итоговая сумма', value: `${order.finalAmount} BYN`, accent: true },
    {
      label: 'Связаться до',
      value: formatDateTime(order.contactDueAt),
    },
    { label: 'Статус', value: order.status },
  ];

  return (
    <Screen>
      <YStack style={{ gap: mobileSpacing[5] }}>
        <SectionHeader title={`Заказ ${order.publicId}`} />

        <OperationalPanel>
          <DetailList items={detailItems} />
        </OperationalPanel>

        {!isAdminView && !isSellerView ? (
          <OperationalPanel eyebrow="Контакт продавца">
            <YStack style={{ gap: mobileSpacing[2] }}>
              {hasSellerContact ? (
                <DetailList
                  items={[
                    { label: 'Тип контакта', value: String(buyerViewOrder.sellerHandoffType) },
                    { label: 'Контакт', value: String(buyerViewOrder.sellerHandoffValue) },
                  ]}
                />
              ) : (
                <Text style={{ fontSize: 14, lineHeight: 20 }}>
                  Продавец скрывает контакт в этом режиме передачи.
                </Text>
              )}
            </YStack>
          </OperationalPanel>
        ) : null}

        {sellerCanAct ? (
          <OperationalPanel eyebrow="Передача заказа">
            <YStack style={{ gap: mobileSpacing[3] }}>
              <DetailList
                items={[
                  {
                    label: 'Email покупателя',
                    value: sellerViewOrder.buyerEmailAtClose,
                  },
                ]}
              />
              <YStack style={{ gap: mobileSpacing[2] }}>
                <AppButton
                  tone="secondary"
                  isLoading={sellerActionMutation.contacted.isPending}
                  loadingLabel="Сохраняем"
                  onPress={() => sellerActionMutation.contacted.mutate()}
                >
                  Отметить контакт
                </AppButton>
                <AppButton
                  tone="primary"
                  isLoading={sellerActionMutation.completed.isPending}
                  loadingLabel="Сохраняем"
                  onPress={() => sellerActionMutation.completed.mutate()}
                >
                  Передача завершена
                </AppButton>
                <AppButton
                  tone="subtle"
                  isLoading={sellerActionMutation.handoffFailed.isPending}
                  loadingLabel="Сохраняем"
                  onPress={() => sellerActionMutation.handoffFailed.mutate()}
                >
                  Срыв передачи
                </AppButton>
              </YStack>
              {actionError ? (
                <YStack style={{ gap: mobileSpacing[2] }}>
                  <Text
                    style={{
                      color: '#b91c1c',
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {actionError}
                  </Text>
                  {lastAction ? (
                    <AppButton tone="secondary" onPress={retryLastSellerAction}>
                      Повторить действие
                    </AppButton>
                  ) : null}
                </YStack>
              ) : null}
            </YStack>
          </OperationalPanel>
        ) : null}

        {isAdminView ? (
          <OperationalPanel eyebrow="Администратор">
            <DetailList
              items={[
                {
                  label: 'Email покупателя',
                  value: adminViewOrder.buyerEmailAtClose,
                },
                {
                  label: 'Тип контакта',
                  value: adminViewOrder.sellerHandoffType ?? '—',
                },
                {
                  label: 'Контакт продавца',
                  value: adminViewOrder.sellerHandoffValue ?? '—',
                },
                {
                  label: 'Режим',
                  value: adminViewOrder.handoffInitiator,
                },
              ]}
            />
          </OperationalPanel>
        ) : null}
      </YStack>
    </Screen>
  );
}

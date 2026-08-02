import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError, type ApiClient } from '@bidplace/api-client';
import { ScrollView, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppDialog,
  AppText,
  DestructiveButton,
  PrimaryButton,
  SecondaryButton,
} from '../../components/modern-ui';
import { formatCurrencyAmount, formatDateTime } from '../../lib/formatters';
import { getUserFacingErrorMessage } from '../../lib/errors';
import {
  handoffContactTypeLabels,
  handoffInitiatorLabels,
  orderStatusLabels,
  presentEnum,
} from '../../lib/presentation';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';

type SellerOrderAction = 'contacted' | 'completed' | 'handoffFailed';
type OrderResponse = Awaited<ReturnType<ApiClient['orders']['get']>>;
type SellerProjection = Extract<OrderResponse, { buyerEmailAtClose: string }>;
type BuyerProjection = Extract<
  OrderResponse,
  { sellerHandoffType: string | null }
>;
type AdminProjection = Extract<OrderResponse, { handoffInitiator: string }>;

function Panel({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        gap: modernTokens.space.x4,
        borderRadius: modernTokens.radius.panel,
        borderWidth: 1,
        borderColor: modernTokens.color.border,
        backgroundColor: modernTokens.color.surface,
        padding: modernTokens.space.x5,
      }}
    >
      {eyebrow ? (
        <AppText role="metadata" tone="secondary">
          {eyebrow}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

function Details({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={{ gap: modernTokens.space.x3 }}>
      {items.map((item) => (
        <View
          key={item.label}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: modernTokens.space.x4,
          }}
        >
          <AppText role="bodySmall" tone="secondary">
            {item.label}
          </AppText>
          <AppText
            role="bodySmall"
            style={{ flexShrink: 1, textAlign: 'right' }}
          >
            {item.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function OrderScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [lastAction, setLastAction] = useState<SellerOrderAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmFailure, setConfirmFailure] = useState(false);
  const query = useQuery({
    queryKey: ['orders', publicId, auth.user?.id ?? 'anonymous'],
    queryFn: () => api.orders.get(publicId),
    enabled: auth.isAuthenticated,
  });
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders', publicId] }),
      queryClient.invalidateQueries({ queryKey: ['user', 'activity'] }),
    ]);
  const action = (kind: SellerOrderAction) => ({
    mutationFn: () =>
      kind === 'contacted'
        ? api.orders.contacted(publicId)
        : kind === 'completed'
          ? api.orders.completed(publicId)
          : api.orders.handoffFailed(publicId),
    onMutate: () => {
      setLastAction(kind);
      setActionError(null);
    },
    onSuccess: () => {
      setLastAction(null);
      setActionError(null);
      setConfirmFailure(false);
      void invalidate();
    },
    onError: (error: unknown) =>
      setActionError(
        getUserFacingErrorMessage(
          error,
          'Не удалось обновить статус передачи. Попробуйте ещё раз.',
        ),
      ),
  });
  const contacted = useMutation(action('contacted'));
  const completed = useMutation(action('completed'));
  const handoffFailed = useMutation(action('handoffFailed'));
  if (!auth.isAuthenticated || query.isLoading)
    return (
      <Shell>
        <AppText role="bodySmall" tone="secondary">
          Загружаем заказ…
        </AppText>
      </Shell>
    );
  if (query.isError || !query.data) {
    const message =
      query.error instanceof ApiClientError && query.error.kind === 'forbidden'
        ? 'Заказ недоступен'
        : 'Не удалось загрузить заказ';
    return (
      <Shell>
        <View style={{ gap: modernTokens.space.x4 }}>
          <AppText role="sectionTitle">{message}</AppText>
          <SecondaryButton
            label="Повторить"
            onPress={() => void query.refetch()}
          />
        </View>
      </Shell>
    );
  }
  const response = query.data;
  const { order, productSummary } = response;
  const isAdmin = auth.isAdmin;
  const isSeller = !isAdmin && 'buyerEmailAtClose' in response;
  const seller = response as SellerProjection;
  const buyer = response as BuyerProjection;
  const admin = response as AdminProjection;
  const retry = () => {
    if (lastAction === 'contacted') contacted.mutate();
    else if (lastAction === 'completed') completed.mutate();
    else if (lastAction === 'handoffFailed') handoffFailed.mutate();
  };
  return (
    <Shell>
      <View style={{ gap: modernTokens.space.x6 }}>
        <View style={{ gap: modernTokens.space.x2 }}>
          <AppText role="metadata" tone="secondary">
            Заказ {order.publicId}
          </AppText>
          <AppText role="screenTitle">
            {productSummary.title ?? 'Предмет'}
          </AppText>
        </View>
        <Panel>
          <Details
            items={[
              {
                label: 'Итоговая сумма',
                value: formatCurrencyAmount(order.finalAmount),
              },
              {
                label: 'Связаться до',
                value: formatDateTime(order.contactDueAt),
              },
              {
                label: 'Статус',
                value: presentEnum(order.status, orderStatusLabels, 'Статус заказа'),
              },
            ]}
          />
        </Panel>
        {!isAdmin && !isSeller ? (
          <Panel eyebrow="Контакт продавца">
            {buyer.sellerHandoffType && buyer.sellerHandoffValue ? (
              <Details
                items={[
                  {
                    label: 'Тип контакта',
                    value: presentEnum(
                      buyer.sellerHandoffType,
                      handoffContactTypeLabels,
                      'Тип контакта',
                    ),
                  },
                  { label: 'Контакт', value: buyer.sellerHandoffValue },
                ]}
              />
            ) : (
              <AppText role="bodySmall" tone="secondary">
                Продавец скрывает контакт в этом режиме передачи.
              </AppText>
            )}
          </Panel>
        ) : null}
        {isSeller ? (
          <Panel eyebrow="Передача заказа">
            <Details
              items={[
                { label: 'Email покупателя', value: seller.buyerEmailAtClose },
              ]}
            />
            <View style={{ gap: modernTokens.space.x2 }}>
              <SecondaryButton
                label="Отметить контакт"
                loading={contacted.isPending}
                onPress={() => contacted.mutate()}
              />
              <PrimaryButton
                label="Передача завершена"
                loading={completed.isPending}
                onPress={() => completed.mutate()}
              />
              <DestructiveButton
                label="Срыв передачи"
                loading={handoffFailed.isPending}
                onPress={() => setConfirmFailure(true)}
              />
            </View>
            {actionError ? (
              <View style={{ gap: modernTokens.space.x2 }}>
                <AppText role="bodySmall" tone="danger">
                  {actionError}
                </AppText>
                {lastAction ? (
                  <SecondaryButton label="Повторить действие" onPress={retry} />
                ) : null}
              </View>
            ) : null}
          </Panel>
        ) : null}
        {isAdmin ? (
          <Panel eyebrow="Администратор">
            <Details
              items={[
                { label: 'Email покупателя', value: admin.buyerEmailAtClose },
                {
                  label: 'Тип контакта',
                  value: admin.sellerHandoffType
                    ? presentEnum(
                        admin.sellerHandoffType,
                        handoffContactTypeLabels,
                        'Тип контакта',
                      )
                    : '—',
                },
                {
                  label: 'Контакт продавца',
                  value: admin.sellerHandoffValue ?? '—',
                },
                {
                  label: 'Режим',
                  value: presentEnum(
                    admin.handoffInitiator,
                    handoffInitiatorLabels,
                    'Режим контакта',
                  ),
                },
              ]}
            />
          </Panel>
        ) : null}
      </View>
      <AppDialog
        open={confirmFailure}
        title="Подтвердите срыв передачи"
        description="Это необратимо изменит статус заказа и потребует дальнейшего сопровождения администратором."
        onClose={() => setConfirmFailure(false)}
      >
        <DestructiveButton
          label="Подтвердить срыв"
          loading={handoffFailed.isPending}
          onPress={() => handoffFailed.mutate()}
        />
        <SecondaryButton
          label="Отмена"
          disabled={handoffFailed.isPending}
          onPress={() => setConfirmFailure(false)}
        />
      </AppDialog>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: modernTokens.space.x5,
          gap: modernTokens.space.x6,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </AppShell>
  );
}

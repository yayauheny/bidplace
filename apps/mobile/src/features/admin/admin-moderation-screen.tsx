import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiClient } from '@bidplace/api-client';
import { ScrollView, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppDialog,
  AppText,
  DestructiveButton,
  FormSection,
  PageHeader,
  PageState,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../../components/modern-ui';
import { useApiClient } from '../../providers/api-provider';

type AdminSellersData = Awaited<
  ReturnType<ApiClient['admin']['listSellerProfiles']>
>;
type AdminProductsData = Awaited<
  ReturnType<ApiClient['admin']['listProducts']>
>;
type RankedBidsData = Awaited<ReturnType<ApiClient['admin']['listRankedBids']>>;
type SellerProfile = AdminSellersData['sellerProfiles'][number];
type AdminProduct = AdminProductsData['products'][number];
type RankedBid = RankedBidsData['bids'][number];
type Confirmation =
  | { kind: 'seller-suspend'; id: string }
  | { kind: 'product-archive'; id: string }
  | { kind: 'order-cancel' }
  | { kind: 'order-replace'; bidId: string };

function moderationStatusLabel(status: string): string {
  return (
    {
      PENDING_REVIEW: 'На модерации',
      APPROVED: 'Одобрен',
      CHANGES_REQUESTED: 'Нужны правки',
      REJECTED: 'Отклонён',
      SUSPENDED: 'Приостановлен',
      DRAFT: 'Черновик',
      ARCHIVED: 'В архиве',
    }[status] ?? status
  );
}

export function AdminModerationScreen() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const sellers = useQuery({
    queryKey: ['admin', 'seller-profiles'],
    queryFn: () => api.admin.listSellerProfiles(),
  });
  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.admin.listProducts(),
  });
  const [orderPublicId, setOrderPublicId] = useState('');
  const [cancelReason, setCancelReason] = useState<
    'BUYER_DECLINED' | 'BUYER_UNREACHABLE' | 'ADMIN_CANCELLED'
  >('BUYER_DECLINED');
  const [cancelledOrder, setCancelledOrder] = useState<{
    publicId: string;
    listingId: string;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ['admin', 'seller-profiles'],
    });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  };
  const sellerStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'APPROVED' | 'SUSPENDED';
    }) => api.admin.updateSellerStatus(id, { status }),
    onSuccess: refresh,
  });
  const productStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'APPROVED' | 'ARCHIVED';
    }) => api.admin.updateProductStatus(id, { status }),
    onSuccess: refresh,
  });
  const cancelOrder = useMutation({
    mutationFn: () =>
      api.admin.cancelOrder(orderPublicId, { reason: cancelReason }),
    onSuccess: (data) => {
      setCancelledOrder({
        publicId: data.order.publicId,
        listingId: data.order.listingId,
      });
      setConfirmation(null);
    },
  });
  const rankedBids = useQuery({
    queryKey: ['admin', 'ranked-bids', cancelledOrder?.listingId],
    queryFn: () => api.admin.listRankedBids(cancelledOrder!.listingId),
    enabled: Boolean(cancelledOrder),
  });
  const replaceOrder = useMutation({
    mutationFn: (bidId: string) =>
      api.admin.replaceOrder(cancelledOrder!.publicId, { bidId }),
    onSuccess: () => {
      setCancelledOrder(null);
      setOrderPublicId('');
      setConfirmation(null);
    },
  });
  const confirming =
    sellerStatus.isPending ||
    productStatus.isPending ||
    cancelOrder.isPending ||
    replaceOrder.isPending;

  if (sellers.isLoading || products.isLoading)
    return (
      <AdminShell>
        <PageState title="Загружаем модерацию…" loading />
      </AdminShell>
    );
  if (sellers.isError || products.isError || !sellers.data || !products.data)
    return (
      <AdminShell>
        <PageState
          title="Не удалось загрузить модерацию"
          retry={() => {
            void sellers.refetch();
            void products.refetch();
          }}
        />
      </AdminShell>
    );

  const confirm = () => {
    if (!confirmation) return;
    if (confirmation.kind === 'seller-suspend')
      sellerStatus.mutate({ id: confirmation.id, status: 'SUSPENDED' });
    if (confirmation.kind === 'product-archive')
      productStatus.mutate({ id: confirmation.id, status: 'ARCHIVED' });
    if (confirmation.kind === 'order-cancel') cancelOrder.mutate();
    if (confirmation.kind === 'order-replace')
      replaceOrder.mutate(confirmation.bidId);
  };
  const confirmationText: Record<
    Confirmation['kind'],
    { title: string; description: string; label: string }
  > = {
    'seller-suspend': {
      title: 'Приостановить продавца?',
      description:
        'Продавец потеряет возможность работать с профилем в текущем статусе.',
      label: 'Приостановить',
    },
    'product-archive': {
      title: 'Архивировать предмет?',
      description: 'Предмет будет исключён из дальнейшей работы модерации.',
      label: 'Архивировать',
    },
    'order-cancel': {
      title: 'Отменить Order?',
      description:
        'Текущий покупатель потеряет active Order. Затем можно выбрать следующую принятую ставку.',
      label: 'Отменить Order',
    },
    'order-replace': {
      title: 'Создать replacement Order?',
      description: 'Выбранная ставка станет новым активным Order.',
      label: 'Создать replacement Order',
    },
  };

  return (
    <AdminShell>
      <PageHeader
        title="Модерация"
        description="Проверка продавцов и предметов перед публикацией."
      />
      <FormSection title="Продавцы">
        {sellers.data.sellerProfiles.map((seller: SellerProfile) => (
          <ModerationCard
            key={seller.id}
            title={seller.fullName}
            status={moderationStatusLabel(seller.status)}
          >
            {seller.status === 'PENDING_REVIEW' ? (
              <PrimaryButton
                label="Одобрить"
                loading={sellerStatus.isPending}
                onPress={() =>
                  sellerStatus.mutate({ id: seller.id, status: 'APPROVED' })
                }
              />
            ) : null}
            <DestructiveButton
              disabled={seller.status === 'SUSPENDED'}
              label="Приостановить"
              loading={sellerStatus.isPending}
              onPress={() =>
                setConfirmation({ kind: 'seller-suspend', id: seller.id })
              }
            />
          </ModerationCard>
        ))}
        {sellers.data.sellerProfiles.length === 0 ? (
          <AppText role="bodySmall" tone="secondary">
            Нет продавцов
          </AppText>
        ) : null}
        {sellerStatus.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось изменить статус продавца. Проверьте полномочия и
            повторите попытку.
          </AppText>
        ) : null}
      </FormSection>
      <FormSection title="Предметы">
        {products.data.products.map((product: AdminProduct) => (
          <ModerationCard
            key={product.id}
            title={product.title ?? 'Без названия'}
            status={moderationStatusLabel(product.status)}
          >
            {product.status === 'PENDING_REVIEW' ? (
              <PrimaryButton
                label="Одобрить"
                loading={productStatus.isPending}
                onPress={() =>
                  productStatus.mutate({ id: product.id, status: 'APPROVED' })
                }
              />
            ) : null}
            <DestructiveButton
              disabled={product.status === 'ARCHIVED'}
              label="Архивировать"
              loading={productStatus.isPending}
              onPress={() =>
                setConfirmation({ kind: 'product-archive', id: product.id })
              }
            />
          </ModerationCard>
        ))}
        {products.data.products.length === 0 ? (
          <AppText role="bodySmall" tone="secondary">
            Нет предметов
          </AppText>
        ) : null}
        {productStatus.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось изменить статус предмета. Проверьте полномочия и
            повторите попытку.
          </AppText>
        ) : null}
      </FormSection>
      <FormSection title="Отмена и переназначение заказа">
        <AppText role="bodySmall" tone="secondary">
          После внешнего согласования отмените активный Order и выберите
          следующую принятую ставку. Контакты участников здесь не раскрываются.
        </AppText>
        <TextField
          label="Номер заказа"
          value={orderPublicId}
          onChangeText={(value) => {
            setOrderPublicId(value);
            setConfirmation(null);
          }}
          placeholder="ORD-..."
          autoCapitalize="none"
        />
        <AppText role="bodySmall" tone="secondary">
          Причина отмены: {cancelReason}
        </AppText>
        {(
          ['BUYER_DECLINED', 'BUYER_UNREACHABLE', 'ADMIN_CANCELLED'] as const
        ).map((reason) => (
          <SecondaryButton
            key={reason}
            label={`${cancelReason === reason ? '✓ ' : ''}${reason}`}
            onPress={() => setCancelReason(reason)}
          />
        ))}
        <DestructiveButton
          label="Отменить Order"
          disabled={!orderPublicId}
          onPress={() => setConfirmation({ kind: 'order-cancel' })}
        />
        {cancelOrder.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось отменить Order. Проверьте номер, статус и полномочия.
          </AppText>
        ) : null}
        {cancelledOrder ? (
          <View style={{ gap: modernTokens.space.x2 }}>
            <AppText role="bodySmall" tone="secondary">
              Выберите replacement Bid для Listing {cancelledOrder.listingId}.
            </AppText>
            {rankedBids.isLoading ? (
              <AppText role="bodySmall" tone="secondary">
                Загружаем принятые ставки…
              </AppText>
            ) : null}
            {rankedBids.isError ? (
              <SecondaryButton
                label="Повторить загрузку ставок"
                onPress={() => void rankedBids.refetch()}
              />
            ) : null}
            {rankedBids.data?.bids.map((bid: RankedBid) => (
              <SecondaryButton
                key={bid.id}
                label={`Назначить ${bid.bidderAlias}: ${bid.amount} BYN`}
                loading={replaceOrder.isPending}
                onPress={() =>
                  setConfirmation({ kind: 'order-replace', bidId: bid.id })
                }
              />
            ))}
            {replaceOrder.isError ? (
              <AppText role="bodySmall" tone="danger">
                Не удалось создать replacement Order. Проверьте статус и
                повторите попытку.
              </AppText>
            ) : null}
          </View>
        ) : null}
      </FormSection>
      {confirmation ? (
        <AppDialog
          open
          title={confirmationText[confirmation.kind].title}
          description={confirmationText[confirmation.kind].description}
          onClose={() => setConfirmation(null)}
        >
          <DestructiveButton
            label={confirmationText[confirmation.kind].label}
            loading={confirming}
            onPress={confirm}
          />
          <SecondaryButton
            label="Отмена"
            disabled={confirming}
            onPress={() => setConfirmation(null)}
          />
        </AppDialog>
      ) : null}
    </AdminShell>
  );
}

function ModerationCard({
  title,
  status,
  children,
}: {
  title: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        gap: modernTokens.space.x2,
        borderBottomWidth: 1,
        borderBottomColor: modernTokens.color.border,
        paddingBottom: modernTokens.space.x4,
      }}
    >
      <AppText role="label">{title}</AppText>
      <AppText role="bodySmall" tone="secondary">
        {status}
      </AppText>
      {children}
    </View>
  );
}
function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShell mode="admin">
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

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, YStack } from 'tamagui';
import type { ApiClient } from '@bidplace/api-client';

import {
  AppButton,
  AppInput,
  ErrorState,
  LoadingState,
  OperationalPanel,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { useAppThemePalette } from '../../theme/palette';
import { mobileSpacing } from '../../theme/tokens';

// Derive types from the API client to stay in sync with the contract.
type AdminSellersData = Awaited<ReturnType<ApiClient['admin']['listSellerProfiles']>>;
type AdminProductsData = Awaited<ReturnType<ApiClient['admin']['listProducts']>>;
type RankedBidsData = Awaited<ReturnType<ApiClient['admin']['listRankedBids']>>;

type SellerProfile = AdminSellersData['sellerProfiles'][number];
type AdminProduct = AdminProductsData['products'][number];
type RankedBid = RankedBidsData['bids'][number];

type SellerStatusTone = 'positive' | 'warning' | 'negative' | 'neutral';
type ProductStatusTone = 'positive' | 'neutral' | 'negative';

function sellerStatusTone(status: string): SellerStatusTone {
  if (status === 'APPROVED') return 'positive';
  if (status === 'PENDING') return 'warning';
  if (status === 'SUSPENDED') return 'negative';
  return 'neutral';
}

function productStatusTone(status: string): ProductStatusTone {
  if (status === 'APPROVED') return 'positive';
  if (status === 'ARCHIVED') return 'negative';
  return 'neutral';
}

export function AdminModerationScreen() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const palette = useAppThemePalette();
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
  const [
    awaitingCancellationConfirmation,
    setAwaitingCancellationConfirmation,
  ] = useState(false);
  const [cancelledOrder, setCancelledOrder] = useState<{
    publicId: string;
    listingId: string;
  } | null>(null);

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

  const rankedBids = useQuery({
    queryKey: ['admin', 'ranked-bids', cancelledOrder?.listingId],
    queryFn: () => api.admin.listRankedBids(cancelledOrder!.listingId),
    enabled: Boolean(cancelledOrder),
  });

  const cancelOrder = useMutation({
    mutationFn: () =>
      api.admin.cancelOrder(orderPublicId, { reason: cancelReason }),
    onSuccess: (data) => {
      setCancelledOrder({
        publicId: data.order.publicId,
        listingId: data.order.listingId,
      });
      setAwaitingCancellationConfirmation(false);
    },
  });

  const replaceOrder = useMutation({
    mutationFn: (bidId: string) =>
      api.admin.replaceOrder(cancelledOrder!.publicId, { bidId }),
    onSuccess: () => {
      setCancelledOrder(null);
      setOrderPublicId('');
    },
  });

  if (sellers.isLoading || products.isLoading)
    return (
      <Screen mode="admin">
        <LoadingState label="Загружаем moderation" />
      </Screen>
    );
  if (sellers.isError || products.isError || !sellers.data || !products.data)
    return (
      <Screen mode="admin">
        <ErrorState
          description="Не удалось загрузить moderation"
          onAction={() => {
            void sellers.refetch();
            void products.refetch();
          }}
        />
      </Screen>
    );

  return (
    <Screen mode="admin">
      <YStack style={{ gap: mobileSpacing[6] }}>
        <SectionHeader title="Модерация" />

        {/* Sellers */}
        <YStack style={{ gap: mobileSpacing[3] }}>
          <Text
            style={{
              fontSize: 18,
              lineHeight: 24,
              fontWeight: '600',
              color: palette.color,
            }}
          >
            Продавцы
          </Text>
          {sellers.data.sellerProfiles.map((seller: SellerProfile) => (
            <OperationalPanel key={seller.id}>
              <YStack style={{ gap: mobileSpacing[3] }}>
                <YStack style={{ gap: mobileSpacing[1] }}>
                  <Text
                    style={{
                      fontSize: 15,
                      lineHeight: 22,
                      fontWeight: '600',
                      color: palette.color,
                    }}
                  >
                    {seller.storeName}
                  </Text>
                  <StatusBadge tone={sellerStatusTone(seller.status)}>
                    {seller.status}
                  </StatusBadge>
                </YStack>
                <YStack style={{ gap: mobileSpacing[2] }}>
                  <AppButton
                    tone="secondary"
                    buttonSize="small"
                    isLoading={sellerStatus.isPending}
                    onPress={() =>
                      sellerStatus.mutate({ id: seller.id, status: 'APPROVED' })
                    }
                  >
                    Approve
                  </AppButton>
                  <AppButton
                    tone="subtle"
                    buttonSize="small"
                    isLoading={sellerStatus.isPending}
                    onPress={() =>
                      sellerStatus.mutate({
                        id: seller.id,
                        status: 'SUSPENDED',
                      })
                    }
                  >
                    Suspend
                  </AppButton>
                </YStack>
              </YStack>
            </OperationalPanel>
          ))}
        </YStack>

        {/* Products */}
        <YStack style={{ gap: mobileSpacing[3] }}>
          <Text
            style={{
              fontSize: 18,
              lineHeight: 24,
              fontWeight: '600',
              color: palette.color,
            }}
          >
            Предметы
          </Text>
          {products.data.products.map((product: AdminProduct) => (
            <OperationalPanel key={product.id}>
              <YStack style={{ gap: mobileSpacing[3] }}>
                <YStack style={{ gap: mobileSpacing[1] }}>
                  <Text
                    style={{
                      fontSize: 15,
                      lineHeight: 22,
                      fontWeight: '600',
                      color: palette.color,
                    }}
                  >
                    {product.title ?? 'Без названия'}
                  </Text>
                  <StatusBadge tone={productStatusTone(product.status)}>
                    {product.status}
                  </StatusBadge>
                </YStack>
                <YStack style={{ gap: mobileSpacing[2] }}>
                  <AppButton
                    tone="secondary"
                    buttonSize="small"
                    isLoading={productStatus.isPending}
                    onPress={() =>
                      productStatus.mutate({
                        id: product.id,
                        status: 'APPROVED',
                      })
                    }
                  >
                    Approve
                  </AppButton>
                  <AppButton
                    tone="subtle"
                    buttonSize="small"
                    isLoading={productStatus.isPending}
                    onPress={() =>
                      productStatus.mutate({
                        id: product.id,
                        status: 'ARCHIVED',
                      })
                    }
                  >
                    Archive
                  </AppButton>
                </YStack>
              </YStack>
            </OperationalPanel>
          ))}
        </YStack>

        {/* Order replacement */}
        <OperationalPanel eyebrow="Замена заказа" title="Отмена и переназначение">
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: palette.colorSecondary,
            }}
          >
            После внешнего согласования отмените активный Order и выберите
            следующую принятую ставку. Контакты bidders здесь не раскрываются.
          </Text>

          <AppInput
            label="Номер заказа"
            value={orderPublicId}
            onChangeText={(value) => {
              setOrderPublicId(value);
              setAwaitingCancellationConfirmation(false);
            }}
            placeholder="ORD-..."
            autoCapitalize="none"
          />

          <YStack style={{ gap: mobileSpacing[2] }}>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 18,
                color: palette.colorMuted,
              }}
            >
              Причина отмены: {cancelReason}
            </Text>
            {(
              [
                'BUYER_DECLINED',
                'BUYER_UNREACHABLE',
                'ADMIN_CANCELLED',
              ] as const
            ).map((reason) => (
              <AppButton
                key={reason}
                buttonSize="small"
                tone={cancelReason === reason ? 'primary' : 'secondary'}
                onPress={() => setCancelReason(reason)}
              >
                {reason}
              </AppButton>
            ))}
          </YStack>

          {!awaitingCancellationConfirmation ? (
            <AppButton
              tone="subtle"
              disabled={!orderPublicId}
              onPress={() => setAwaitingCancellationConfirmation(true)}
            >
              Перейти к подтверждению отмены
            </AppButton>
          ) : (
            <YStack style={{ gap: mobileSpacing[2] }}>
              <Text
                style={{ color: palette.negative, fontSize: 14, lineHeight: 20 }}
              >
                Подтвердите отмену: текущий buyer потеряет active Order.
              </Text>
              <AppButton
                tone="danger"
                isLoading={cancelOrder.isPending}
                onPress={() => cancelOrder.mutate()}
              >
                Подтвердить отмену Order
              </AppButton>
            </YStack>
          )}

          {cancelOrder.isError ? (
            <Text
              style={{ color: palette.negative, fontSize: 14, lineHeight: 20 }}
            >
              Не удалось отменить Order. Проверьте номер и текущий статус.
            </Text>
          ) : null}

          {cancelledOrder ? (
            <YStack style={{ gap: mobileSpacing[2] }}>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: palette.colorSecondary,
                }}
              >
                Выберите replacement Bid для Listing {cancelledOrder.listingId}
              </Text>
              {rankedBids.isLoading ? (
                <LoadingState label="Загружаем принятые ставки" />
              ) : null}
              {rankedBids.isError ? (
                <Text
                  style={{ color: palette.negative, fontSize: 14, lineHeight: 20 }}
                >
                  Не удалось загрузить принятые ставки.
                </Text>
              ) : null}
              {rankedBids.data?.bids.map((bid: RankedBid) => (
                <AppButton
                  key={bid.id}
                  tone="secondary"
                  isLoading={replaceOrder.isPending}
                  onPress={() => replaceOrder.mutate(bid.id)}
                >
                  Назначить {bid.bidderAlias}: {bid.amount} BYN
                </AppButton>
              ))}
              {replaceOrder.isError ? (
                <Text
                  style={{ color: palette.negative, fontSize: 14, lineHeight: 20 }}
                >
                  Не удалось создать replacement Order.
                </Text>
              ) : null}
            </YStack>
          ) : null}
        </OperationalPanel>
      </YStack>
    </Screen>
  );
}

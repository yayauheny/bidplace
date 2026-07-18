import { useState } from 'react';
import { TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  ErrorState,
  LoadingState,
  Screen,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

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
    onSuccess: ({ order }) => {
      setCancelledOrder({
        publicId: order.publicId,
        listingId: order.listingId,
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
      <Screen>
        <LoadingState label="Загружаем moderation" />
      </Screen>
    );
  if (sellers.isError || products.isError || !sellers.data || !products.data)
    return (
      <Screen>
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
    <Screen>
      <YStack gap="$3">
        <Text fontSize={30} fontWeight="600">
          Moderation
        </Text>
        <Text fontSize={20}>Seller profiles</Text>
        {sellers.data.sellerProfiles.map((seller) => (
          <YStack key={seller.id} gap="$1">
            <Text>
              {seller.storeName} · {seller.status}
            </Text>
            <AppButton
              tone="secondary"
              isLoading={sellerStatus.isPending}
              onPress={() =>
                sellerStatus.mutate({ id: seller.id, status: 'APPROVED' })
              }
            >
              Approve
            </AppButton>
            <AppButton
              tone="subtle"
              isLoading={sellerStatus.isPending}
              onPress={() =>
                sellerStatus.mutate({ id: seller.id, status: 'SUSPENDED' })
              }
            >
              Suspend
            </AppButton>
          </YStack>
        ))}
        <Text fontSize={20}>Products</Text>
        {products.data.products.map((product) => (
          <YStack key={product.id} gap="$1">
            <Text>
              {product.title ?? 'Untitled'} · {product.status}
            </Text>
            <AppButton
              tone="secondary"
              isLoading={productStatus.isPending}
              onPress={() =>
                productStatus.mutate({ id: product.id, status: 'APPROVED' })
              }
            >
              Approve
            </AppButton>
            <AppButton
              tone="subtle"
              isLoading={productStatus.isPending}
              onPress={() =>
                productStatus.mutate({ id: product.id, status: 'ARCHIVED' })
              }
            >
              Archive
            </AppButton>
          </YStack>
        ))}
        <Text fontSize={20}>Order replacement</Text>
        <Text>
          После внешнего согласования отмените активный Order и выберите
          следующую принятую ставку. Контакты bidders здесь не раскрываются.
        </Text>
        <TextInput
          value={orderPublicId}
          onChangeText={(value) => {
            setOrderPublicId(value);
            setAwaitingCancellationConfirmation(false);
          }}
          placeholder="Номер Order"
          autoCapitalize="none"
        />
        <Text>Причина отмены: {cancelReason}</Text>
        {(
          ['BUYER_DECLINED', 'BUYER_UNREACHABLE', 'ADMIN_CANCELLED'] as const
        ).map((reason) => (
          <AppButton
            key={reason}
            tone={cancelReason === reason ? 'primary' : 'secondary'}
            onPress={() => setCancelReason(reason)}
          >
            {reason}
          </AppButton>
        ))}
        {!awaitingCancellationConfirmation ? (
          <AppButton
            tone="subtle"
            disabled={!orderPublicId}
            onPress={() => setAwaitingCancellationConfirmation(true)}
          >
            Перейти к подтверждению отмены
          </AppButton>
        ) : (
          <YStack gap="$1">
            <Text color="$danger">
              Подтвердите отмену: текущий buyer потеряет active Order.
            </Text>
            <AppButton
              tone="subtle"
              isLoading={cancelOrder.isPending}
              onPress={() => cancelOrder.mutate()}
            >
              Подтвердить отмену Order
            </AppButton>
          </YStack>
        )}
        {cancelOrder.isError ? (
          <Text color="$danger">
            Не удалось отменить Order. Проверьте номер и текущий статус.
          </Text>
        ) : null}
        {cancelledOrder ? (
          <YStack gap="$2">
            <Text>
              Выберите replacement Bid для Listing {cancelledOrder.listingId}
            </Text>
            {rankedBids.isLoading ? (
              <LoadingState label="Загружаем принятые ставки" />
            ) : null}
            {rankedBids.isError ? (
              <Text color="$danger">Не удалось загрузить принятые ставки.</Text>
            ) : null}
            {rankedBids.data?.bids.map((bid) => (
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
              <Text color="$danger">Не удалось создать replacement Order.</Text>
            ) : null}
          </YStack>
        ) : null}
      </YStack>
    </Screen>
  );
}

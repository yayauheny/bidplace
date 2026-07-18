import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, YStack } from 'tamagui';

import { AppButton, ErrorState, LoadingState, Screen } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

export function AdminModerationScreen() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const sellers = useQuery({ queryKey: ['admin', 'seller-profiles'], queryFn: () => api.admin.listSellerProfiles() });
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => api.admin.listProducts() });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'seller-profiles'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  };
  const sellerStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'SUSPENDED' }) => api.admin.updateSellerStatus(id, { status }), onSuccess: refresh });
  const productStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'ARCHIVED' }) => api.admin.updateProductStatus(id, { status }), onSuccess: refresh });

  if (sellers.isLoading || products.isLoading) return <Screen><LoadingState label="Загружаем moderation" /></Screen>;
  if (sellers.isError || products.isError || !sellers.data || !products.data) return <Screen><ErrorState description="Не удалось загрузить moderation" onAction={() => { void sellers.refetch(); void products.refetch(); }} /></Screen>;
  return <Screen><YStack gap="$3"><Text fontSize={30} fontWeight="600">Moderation</Text>
    <Text fontSize={20}>Seller profiles</Text>
    {sellers.data.sellerProfiles.map((seller) => <YStack key={seller.id} gap="$1"><Text>{seller.storeName} · {seller.status}</Text><AppButton tone="secondary" isLoading={sellerStatus.isPending} onPress={() => sellerStatus.mutate({ id: seller.id, status: 'APPROVED' })}>Approve</AppButton><AppButton tone="subtle" isLoading={sellerStatus.isPending} onPress={() => sellerStatus.mutate({ id: seller.id, status: 'SUSPENDED' })}>Suspend</AppButton></YStack>)}
    <Text fontSize={20}>Products</Text>
    {products.data.products.map((product) => <YStack key={product.id} gap="$1"><Text>{product.title ?? 'Untitled'} · {product.status}</Text><AppButton tone="secondary" isLoading={productStatus.isPending} onPress={() => productStatus.mutate({ id: product.id, status: 'APPROVED' })}>Approve</AppButton><AppButton tone="subtle" isLoading={productStatus.isPending} onPress={() => productStatus.mutate({ id: product.id, status: 'ARCHIVED' })}>Archive</AppButton></YStack>)}
  </YStack></Screen>;
}

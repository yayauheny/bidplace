import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';

import { ErrorState, LoadingState, Screen } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

export function ProductListScreen() {
  const api = useApiClient();
  const query = useQuery({ queryKey: ['products'], queryFn: () => api.products.list() });
  if (query.isLoading) return <Screen><LoadingState label="Загружаем предметы" /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState description="Не удалось загрузить предметы" onAction={() => query.refetch()} /></Screen>;
  return <Screen><YStack gap="$3"><Text fontSize={30} fontWeight="600">Предметы</Text>{query.data.products.map(({ product, listing }) => <Link key={product.id} href={`/product/${product.publicId}`} asChild><Pressable><YStack gap="$1"><Text>{product.title ?? 'Предмет'}</Text><Text>{listing ? `${listing.currentPrice} BYN` : 'Скоро появится'}</Text></YStack></Pressable></Link>)}</YStack></Screen>;
}

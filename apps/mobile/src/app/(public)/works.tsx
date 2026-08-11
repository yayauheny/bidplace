import { useLocalSearchParams } from 'expo-router';

import type { PublicDiscoverySort } from '@bidplace/contracts';
import { ProductListScreen } from '../../features/products/product-list-screen';

export default function WorksRoute() {
  const params = useLocalSearchParams<{
    status?: 'LIVE' | 'SCHEDULED' | 'ENDED';
    sort?: PublicDiscoverySort;
    category?: string;
    material?: string;
  }>();

  return (
    <ProductListScreen
      status={params.status}
      sort={params.sort ?? 'newest'}
      category={params.category}
      material={params.material}
    />
  );
}

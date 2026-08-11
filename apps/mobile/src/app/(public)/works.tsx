import { useLocalSearchParams } from 'expo-router';

import type { PublicDiscoverySort } from '@bidplace/contracts';
import { ProductListScreen } from '../../features/products/product-list-screen';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePrice(value: string | string[] | undefined) {
  const parsed = Number(firstParam(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default function WorksRoute() {
  const params = useLocalSearchParams<{
    status?: 'LIVE' | 'SCHEDULED' | 'ENDED';
    sort?: PublicDiscoverySort;
    category?: string;
    material?: string;
    author?: string;
    uniqueness?: string;
    priceMin?: string;
    priceMax?: string;
  }>();

  return (
    <ProductListScreen
      status={params.status}
      sort={params.sort ?? 'activity'}
      category={params.category}
      material={params.material}
      author={params.author}
      uniqueness={params.uniqueness}
      priceMin={parsePrice(params.priceMin)}
      priceMax={parsePrice(params.priceMax)}
    />
  );
}

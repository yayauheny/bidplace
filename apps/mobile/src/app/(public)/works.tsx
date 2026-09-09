import { useLocalSearchParams } from 'expo-router';

import { ProductListScreen } from '../../features/products/product-list-screen';
import type { PortfolioCatalogSort } from '../../features/products/portfolio-works-query';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function WorksRoute() {
  const params = useLocalSearchParams<{
    sort?: PortfolioCatalogSort;
    category?: string;
    material?: string;
  }>();
  const sort = firstParam(params.sort) === 'oldest' ? 'oldest' : 'newest';

  return (
    <ProductListScreen
      sort={sort}
      category={firstParam(params.category)}
      material={firstParam(params.material)}
    />
  );
}

import { useLocalSearchParams } from 'expo-router';

import { ProductListScreen } from '../../features/products/product-list-screen';
import type { PortfolioCatalogSort } from '../../features/products/portfolio-works-query';
import {
  firstQueryParam,
  parseCsvParam,
  parsePageParam,
} from '../../features/search/catalog-query';

export default function WorksRoute() {
  const params = useLocalSearchParams<{
    q?: string;
    sort?: PortfolioCatalogSort;
    category?: string;
    materials?: string;
    material?: string;
    page?: string;
  }>();
  const sort = firstQueryParam(params.sort) === 'oldest' ? 'oldest' : 'newest';
  const materials = [
    ...parseCsvParam(params.materials),
    ...parseCsvParam(params.material),
  ];

  return (
    <ProductListScreen
      query={firstQueryParam(params.q)}
      sort={sort}
      category={firstQueryParam(params.category)}
      materials={materials}
      page={parsePageParam(params.page)}
    />
  );
}

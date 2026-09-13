import { useLocalSearchParams } from 'expo-router';

import { ProductListScreen } from '../../features/products/product-list-screen';
import { toPortfolioWorksRouteState } from '../../features/products/portfolio-works-query';

export default function WorksRoute() {
  const params = useLocalSearchParams<{
    q?: string | string[];
    sort?: string | string[];
    category?: string | string[];
    material?: string | string[];
  }>();
  return <ProductListScreen state={toPortfolioWorksRouteState(params)} />;
}

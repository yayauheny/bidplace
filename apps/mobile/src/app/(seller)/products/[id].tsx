import { useLocalSearchParams } from 'expo-router';

import { ProductDraftScreen } from '../../../features/sellers/product-draft-screen';
import { firstRouteParam } from '../../../features/sellers/product-draft-wizard';

export default function ProductDraftRoute() {
  const { id, flow, step } = useLocalSearchParams<{
    id: string | string[];
    flow?: string | string[];
    step?: string | string[];
  }>();
  return (
    <ProductDraftScreen
      productId={firstRouteParam(id)}
      flow={firstRouteParam(flow)}
      stepParam={step}
    />
  );
}

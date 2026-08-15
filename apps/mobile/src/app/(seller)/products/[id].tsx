import { useLocalSearchParams } from 'expo-router';

import { ProductDraftScreen } from '../../../features/sellers/product-draft-screen';

export default function ProductDraftRoute() {
  const { id, flow, step } = useLocalSearchParams<{
    id: string;
    flow?: string;
    step?: string | string[];
  }>();
  return <ProductDraftScreen productId={id} flow={flow} stepParam={step} />;
}

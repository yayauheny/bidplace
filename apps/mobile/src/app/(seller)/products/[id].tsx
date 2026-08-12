import { useLocalSearchParams } from 'expo-router';

import { ProductDraftScreen } from '../../../features/sellers/product-draft-screen';

export default function ProductDraftRoute() {
  const { id, flow, step } = useLocalSearchParams<{
    id: string;
    flow?: string;
    step?: string;
  }>();
  const initialStep = Number.parseInt(step ?? '1', 10);
  return (
    <ProductDraftScreen
      productId={id}
      flow={flow}
      initialStep={Number.isFinite(initialStep) ? initialStep : 1}
    />
  );
}

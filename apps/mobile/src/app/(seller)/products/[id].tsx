import { useLocalSearchParams } from 'expo-router';

import { ProductDraftScreen } from '../../../features/sellers/product-draft-screen';

export default function ProductDraftRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDraftScreen productId={id} />;
}

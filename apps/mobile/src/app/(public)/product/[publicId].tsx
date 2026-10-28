import { useLocalSearchParams } from 'expo-router';

import { ProductScreen } from '../../../features/products/product-screen';

export default function ProductRoute() {
  const { publicId } = useLocalSearchParams<{ publicId: string }>();

  return <ProductScreen publicId={publicId} />;
}

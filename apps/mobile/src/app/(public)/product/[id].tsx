import { useLocalSearchParams } from 'expo-router';

import { StorefrontProductScreen } from '../../../features/storefront/storefront-product-screen';

export default function ProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <StorefrontProductScreen slug={id} />;
}

import { useLocalSearchParams } from 'expo-router';

import { OrderScreen } from '../../../../features/commerce/order-screen';

export default function OrderRoute() {
  const { publicId } = useLocalSearchParams<{ publicId?: string }>();
  if (!publicId) return null;
  return <OrderScreen publicId={publicId} />;
}

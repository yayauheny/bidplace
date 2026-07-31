import { useLocalSearchParams } from 'expo-router';

import { PublicSellerScreen } from '../../../features/sellers/public-seller-screen';

export default function PublicSellerRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <PublicSellerScreen slug={slug} />;
}

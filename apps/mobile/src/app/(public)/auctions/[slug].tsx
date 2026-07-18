import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AuctionRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return <Redirect href={`/product/${slug}`} />;
}

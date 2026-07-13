import { useLocalSearchParams } from 'expo-router';

import { AuctionDetailScreen } from '../../../features/auctions/auction-detail-screen';

export default function AuctionRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return <AuctionDetailScreen slug={slug} />;
}

import { AuctionDetailScreen } from '../../../src/features/auctions/auction-detail-screen';

type AuctionPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AuctionPage({ params }: AuctionPageProps) {
  const { slug } = await params;

  return <AuctionDetailScreen slug={slug} />;
}

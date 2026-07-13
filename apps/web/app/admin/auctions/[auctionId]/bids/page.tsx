import { AdminAuctionBidsScreen } from '../../../../../src/features/admin/admin-screens';

type AdminAuctionBidsPageProps = {
  params: Promise<{ auctionId: string }>;
};

export default async function AdminAuctionBidsPage({
  params,
}: AdminAuctionBidsPageProps) {
  const { auctionId } = await params;

  return <AdminAuctionBidsScreen auctionId={auctionId} />;
}

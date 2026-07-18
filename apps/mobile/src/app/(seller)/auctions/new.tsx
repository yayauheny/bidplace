import { Screen } from '../../../components/ui';
import { AuctionCreateForm } from '../../../features/seller/auction-create-form';

export default function SellerNewAuctionScreen() {
  return (
    <Screen mode="seller">
      <AuctionCreateForm />
    </Screen>
  );
}

import { Screen } from '../../../components/ui';
import { LotCreateForm } from '../../../features/seller/lot-create-form';

export default function SellerNewLotScreen() {
  return (
    <Screen mode="seller">
      <LotCreateForm />
    </Screen>
  );
}

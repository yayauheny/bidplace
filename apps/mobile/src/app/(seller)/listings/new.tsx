import { useLocalSearchParams } from 'expo-router';
import { ListingDraftScreen } from '../../../features/sellers/listing-draft-screen';

export default function NewListingRoute() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  return <ListingDraftScreen initialProductId={productId} />;
}

import { useLocalSearchParams } from 'expo-router';
import type { PublicSellerSort } from '@bidplace/contracts';
import { PublicAuthorsScreen } from '../../features/sellers/public-authors-screen';

export default function AuthorsRoute() {
  const params = useLocalSearchParams<{ sort?: PublicSellerSort }>();
  return <PublicAuthorsScreen sort={params.sort ?? 'activity'} />;
}

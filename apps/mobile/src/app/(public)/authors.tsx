import { useLocalSearchParams } from 'expo-router';
import type { PortfolioAuthorsQuery } from '@bidplace/contracts';
import { PublicAuthorsScreen } from '../../features/sellers/public-authors-screen';

export default function AuthorsRoute() {
  const params = useLocalSearchParams<{ sort?: PortfolioAuthorsQuery['sort'] }>();
  const sort = params.sort === 'name' ? 'name' : 'added';
  return <PublicAuthorsScreen sort={sort} />;
}

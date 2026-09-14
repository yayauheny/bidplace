import { useLocalSearchParams } from 'expo-router';

import { PublicAuthorsScreen } from '../../features/sellers/public-authors-screen';
import { toPortfolioAuthorsRouteState } from '../../features/sellers/portfolio-authors-query';

export default function AuthorsRoute() {
  const params = useLocalSearchParams<{
    q?: string | string[];
    tag?: string | string[];
    city?: string | string[];
    sort?: string | string[];
  }>();
  return <PublicAuthorsScreen state={toPortfolioAuthorsRouteState(params)} />;
}

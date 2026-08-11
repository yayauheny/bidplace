import { useLocalSearchParams } from 'expo-router';

import { SearchScreen } from '../../features/search/search-screen';

export default function SearchRoute() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const query = Array.isArray(params.q) ? params.q[0] : params.q;

  return <SearchScreen query={query?.trim() ?? ''} />;
}

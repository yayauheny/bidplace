import { useLocalSearchParams } from 'expo-router';

import {
  firstSearchParam,
  optionalRouteText,
} from '../../features/discovery/catalog-query';
import { SearchScreen } from '../../features/search/search-screen';

export default function SearchRoute() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const query =
    optionalRouteText('q', firstSearchParam(params.q), 120).q ?? '';

  return <SearchScreen query={query} />;
}

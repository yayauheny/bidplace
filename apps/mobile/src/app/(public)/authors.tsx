import { useLocalSearchParams } from 'expo-router';
import type { PortfolioAuthorsQuery } from '@bidplace/contracts';

import { PublicAuthorsScreen } from '../../features/sellers/public-authors-screen';
import {
  firstQueryParam,
  parsePageParam,
} from '../../features/search/catalog-query';

export default function AuthorsRoute() {
  const params = useLocalSearchParams<{
    q?: string;
    tag?: string;
    city?: string;
    sort?: PortfolioAuthorsQuery['sort'];
    page?: string;
  }>();
  const sort = firstQueryParam(params.sort) === 'name' ? 'name' : 'added';
  return (
    <PublicAuthorsScreen
      query={firstQueryParam(params.q)}
      tag={firstQueryParam(params.tag)}
      city={firstQueryParam(params.city)}
      sort={sort}
      page={parsePageParam(params.page)}
    />
  );
}

import { useInfiniteQuery } from '@tanstack/react-query';

import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import {
  nextCatalogPage,
  uniqueCatalogItems,
} from '../discovery/catalog-pagination';
import {
  AUTHORS_PAGE_SIZE,
  toPortfolioAuthorsListQuery,
  type PortfolioAuthorsRouteState,
} from './portfolio-authors-query';

export function usePortfolioAuthors(state: PortfolioAuthorsRouteState) {
  const api = useApiClient();
  const listQuery = {
    ...toPortfolioAuthorsListQuery(state),
    limit: AUTHORS_PAGE_SIZE,
  };
  const query = useInfiniteQuery({
    queryKey: ['portfolio-authors', listQuery],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.portfolio.listAuthors({ ...listQuery, page: pageParam }, { signal }),
    getNextPageParam: (page) => nextCatalogPage(page.pagination),
    enabled: true,
    retry: retryTransientPublicQuery,
  });
  const items = uniqueCatalogItems(
    query.data?.pages.flatMap((page) => page.authors) ?? [],
    (item) => item.author.id,
  );
  return { ...query, items, listQuery };
}

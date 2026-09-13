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

export function usePortfolioAuthors(
  state: PortfolioAuthorsRouteState,
  enabled = true,
) {
  const api = useApiClient();
  const listQuery = {
    ...toPortfolioAuthorsListQuery(state),
    limit: AUTHORS_PAGE_SIZE,
  };
  const query = useInfiniteQuery({
    queryKey: ['portfolio-authors', listQuery],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.portfolio.listAuthors({ ...listQuery, page: pageParam }),
    getNextPageParam: (page) => nextCatalogPage(page.pagination),
    enabled,
    retry: retryTransientPublicQuery,
  });
  const items = uniqueCatalogItems(
    query.data?.pages.flatMap((page) => page.authors) ?? [],
    (item) => item.author.id,
  );
  return { ...query, items, listQuery };
}

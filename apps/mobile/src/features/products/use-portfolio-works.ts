import { useInfiniteQuery } from '@tanstack/react-query';

import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import {
  nextCatalogPage,
  uniqueCatalogItems,
} from '../discovery/catalog-pagination';
import {
  toPortfolioWorksListQuery,
  WORKS_PAGE_SIZE,
  type PortfolioWorksRouteState,
} from './portfolio-works-query';

export function usePortfolioWorks(
  state: PortfolioWorksRouteState,
  enabled = true,
) {
  const api = useApiClient();
  const listQuery = {
    ...toPortfolioWorksListQuery(state),
    limit: WORKS_PAGE_SIZE,
  };
  const query = useInfiniteQuery({
    queryKey: ['portfolio-works', listQuery],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.portfolio.listWorks({ ...listQuery, page: pageParam }),
    getNextPageParam: (page) => nextCatalogPage(page.pagination),
    enabled,
    retry: retryTransientPublicQuery,
  });
  const items = uniqueCatalogItems(
    query.data?.pages.flatMap((page) => page.works) ?? [],
    (item) => item.work.id,
  );
  return { ...query, items, listQuery };
}

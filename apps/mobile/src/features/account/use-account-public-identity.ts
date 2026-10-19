import { useInfiniteQuery } from '@tanstack/react-query';

import { useApiClient } from '../../providers/api-provider';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import {
  sellerProfileGcMs,
  sellerProfileStaleMs,
} from '../sellers/seller-profile-data';
import { publicAuthorKeys } from '../sellers/use-author-works';

/**
 * Публичная identity аккаунта: тот же cache/key/shape, что у публичного
 * экрана автора (author первой страницы). Только для APPROVED с валидным
 * slug; fetchNextPage не вызывается. freshness — общие 60s/5min константы.
 * Ошибка не блочит экран: fallback share path строится по slug.
 */
export function useAccountPublicIdentity({
  enabled,
  slug,
}: {
  enabled: boolean;
  slug: string | null;
}) {
  const api = useApiClient();
  const query = useInfiniteQuery({
    queryKey: publicAuthorKeys.detail(slug ?? '', 'newest'),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.portfolio.getAuthor(
        slug ?? '',
        { sort: 'newest', page: pageParam, limit: 20 },
        { signal },
      ),
    getNextPageParam: (page) =>
      page.pagination.page * page.pagination.limit < page.pagination.total
        ? page.pagination.page + 1
        : undefined,
    enabled: enabled && Boolean(slug),
    staleTime: sellerProfileStaleMs,
    gcTime: sellerProfileGcMs,
    retry: retryTransientPublicQuery,
  });
  return query.data?.pages[0]?.author ?? null;
}

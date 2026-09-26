import { useInfiniteQuery } from '@tanstack/react-query';

import { useApiClient } from '../../providers/api-provider';
import { retryTransientPublicQuery } from '../../lib/query-retry';

export const publicAuthorKeys = {
  detail: (
    slug: string,
    sort: 'newest' | 'oldest',
    category?: string,
  ) => ['public-author', slug, { sort, category }] as const,
};

export function canReusePreviousAuthorData(
  previousQuery: { queryKey: readonly unknown[] } | undefined,
  slug: string,
) {
  const [root, previousSlug] = previousQuery?.queryKey ?? [];

  return root === 'public-author' && previousSlug === slug;
}

export function useAuthorWorks(
  slug: string,
  sort: 'newest' | 'oldest',
  category?: string,
) {
  const api = useApiClient();
  return useInfiniteQuery({
    queryKey: publicAuthorKeys.detail(slug, sort, category),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.portfolio.getAuthor(slug, {
        sort,
        category,
        page: pageParam,
        limit: 20,
      }),
    placeholderData: (previousData, previousQuery) =>
      canReusePreviousAuthorData(previousQuery, slug)
        ? previousData
        : undefined,
    getNextPageParam: (page) =>
      page.pagination.page * page.pagination.limit < page.pagination.total
        ? page.pagination.page + 1
        : undefined,
    enabled: Boolean(slug),
    retry: retryTransientPublicQuery,
  });
}

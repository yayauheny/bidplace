import { useInfiniteQuery } from '@tanstack/react-query';

import type { ApiClient } from '@bidplace/api-client';

import { useApiClient } from '../../providers/api-provider';
import { retryTransientPublicQuery } from '../../lib/query-retry';

export const publicAuthorKeys = {
  detail: (
    slug: string,
    sort: 'newest' | 'oldest',
    category?: string,
    categories?: string[],
  ) => ['public-author', slug, { sort, category, ...(categories?.length ? { categories } : {}) }] as const,
};

// Shared base options for every observer of a public-author key, so the
// public screen and the account identity deduplicate on one request and never
// drift in queryFn/shape.
export function authorWorksBaseOptions(
  api: ApiClient,
  slug: string,
  sort: 'newest' | 'oldest',
  category?: string,
  categories?: string[],
) {
  const queryFn = async ({
    pageParam,
    signal,
  }: {
    pageParam: number;
    signal: AbortSignal;
  }) =>
    api.portfolio.getAuthor(
      slug,
      {
        sort,
        category,
        categories,
        page: pageParam,
        limit: 20,
      },
      { signal },
    );
  return {
    queryKey: publicAuthorKeys.detail(slug, sort, category, categories),
    initialPageParam: 1,
    queryFn,
    getNextPageParam: (
      page: Awaited<ReturnType<typeof queryFn>>,
    ) =>
      page.pagination.page * page.pagination.limit < page.pagination.total
        ? page.pagination.page + 1
        : undefined,
    retry: retryTransientPublicQuery,
  };
}

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
  categories?: string[],
) {
  const api = useApiClient();
  return useInfiniteQuery({
    ...authorWorksBaseOptions(api, slug, sort, category, categories),
    placeholderData: (previousData, previousQuery) =>
      canReusePreviousAuthorData(previousQuery, slug)
        ? previousData
        : undefined,
    enabled: Boolean(slug),
  });
}

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useApiClient } from '../../providers/api-provider';
import { retryTransientPublicQuery } from '../../lib/query-retry';

export function useAuthorWorks(slug: string, sort: 'newest' | 'oldest') {
  const api = useApiClient();
  const [category, setCategory] = useState<string>();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
    retry: retryTransientPublicQuery,
  });
  const filtered = useInfiniteQuery({
    queryKey: ['public-author', slug, { sort, category }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.portfolio.getAuthor(slug, {
        sort,
        category,
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (page) =>
      page.pagination.page * page.pagination.limit < page.pagination.total
        ? page.pagination.page + 1
        : undefined,
    enabled: Boolean(slug && category),
    retry: retryTransientPublicQuery,
  });
  return { category, setCategory, categories, filtered };
}

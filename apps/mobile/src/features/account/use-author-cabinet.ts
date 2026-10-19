import { useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { SellerProfile } from '@bidplace/contracts';

import { canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import {
  AUTHOR_CABINET_PAGE_SIZE,
  authorCabinetWorksFromPages,
} from '../sellers/author-cabinet-state';
import { isAuthorCabinetAvailable } from '../../hooks/use-seller-capability';
import { invalidateOwnerWorks, ownerWorkQueryKeys } from '../sellers/owner-work-query';

/**
 * Единый owner-контроллер кабинета: /cabinet и /account делят этот hook,
 * запрос не дублируется (один query key, дедупликация react-query).
 */
export function useAuthorCabinetWorks(
  status: SellerProfile['status'] | null,
) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ownerWorkQueryKeys.cabinet,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const epoch = currentAuthEpoch(queryClient);
      const page = await api.portfolio.listCabinetWorks({
        page: pageParam,
        limit: AUTHOR_CABINET_PAGE_SIZE,
      });
      if (!canWritePrivateCache(queryClient, epoch)) {
        throw new Error('Private cache is closed');
      }
      return page;
    },
    getNextPageParam: (page) =>
      page.pagination.page * page.pagination.limit < page.pagination.total
        ? page.pagination.page + 1
        : undefined,
    enabled: isAuthorCabinetAvailable(status),
  });
  return {
    ...query,
    works: authorCabinetWorksFromPages(query.data?.pages ?? []),
  };
}

export function useAuthorCabinetVisibility() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [pendingHideId, setPendingHideId] = useState<string | null>(null);

  const invalidate = () => {
    void invalidateOwnerWorks(queryClient);
    void queryClient.invalidateQueries({ queryKey: ['public-author'] });
    void queryClient.invalidateQueries({ queryKey: ['portfolio-home'] });
    void queryClient.invalidateQueries({ queryKey: ['portfolio-work'] });
    void queryClient.invalidateQueries({ queryKey: ['portfolio-works'] });
  };
  const mutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? api.portfolio.unhideWork(id) : api.portfolio.hideWork(id),
    onSuccess: () => {
      setPendingHideId(null);
      invalidate();
    },
  });

  return { pendingHideId, setPendingHideId, mutation };
}

import { useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { SellerProfile } from '@bidplace/contracts';

import {
  canWritePrivateCache,
  currentAuthEpoch,
  invalidateWorkSurfaces,
} from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import {
  AUTHOR_CABINET_PAGE_SIZE,
  authorCabinetWorksFromPages,
} from '../sellers/author-cabinet-state';
import { isAuthorCabinetAvailable } from '../../hooks/use-seller-capability';
import { ownerWorkQueryKeys } from '../sellers/owner-work-query';

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

export type CabinetVisibilityAction = 'hide' | 'restore';

/**
 * Операция видимости целиком принадлежает одному intent {workId, action}:
 * ошибка и retry не могут адресовать другую работу, чем подтверждает
 * пользователь. Начало нового intent сбрасывает ошибку предыдущего;
 * во время pending смена цели запрещена; поздний успех не закрывает
 * чужой confirm.
 */
export type CabinetVisibilityIntent = {
  workId: string;
  action: CabinetVisibilityAction;
};

function sameIntent(
  a: CabinetVisibilityIntent | null,
  b: CabinetVisibilityIntent | null,
) {
  return a?.workId === b?.workId && a?.action === b?.action;
}

export function useAuthorCabinetVisibility() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [intent, setIntent] = useState<CabinetVisibilityIntent | null>(null);

  const invalidate = () => {
    void invalidateWorkSurfaces(queryClient);
  };
  const mutation = useMutation({
    mutationFn: ({ workId, action }: CabinetVisibilityIntent) =>
      action === 'restore'
        ? api.portfolio.unhideWork(workId)
        : api.portfolio.hideWork(workId),
    onSuccess: (_data, vars) => {
      // Поздний ответ предыдущего intent не закрывает чужой confirm.
      setIntent((current) => (sameIntent(current, vars) ? null : current));
      invalidate();
    },
  });

  const begin = (next: CabinetVisibilityIntent): boolean => {
    // Пока операция pending, она владеет сессией: другую карточку не начать.
    if (mutation.isPending && !sameIntent(intent, next)) return false;
    if (!sameIntent(intent, next)) mutation.reset();
    setIntent(next);
    return true;
  };
  const cancel = () => {
    if (mutation.isPending) return;
    mutation.reset();
    setIntent(null);
  };
  // Restore — одношаговый intent: начало = исполнение.
  const restore = (workId: string) => {
    if (mutation.isPending) return;
    const next: CabinetVisibilityIntent = { workId, action: 'restore' };
    if (!sameIntent(intent, next)) mutation.reset();
    setIntent(next);
    mutation.mutate(next);
  };
  const confirm = () => {
    if (intent) mutation.mutate(intent);
  };
  // Повтор той же неотменённой операции: retry адресует текущий intent.
  const retry = () => {
    if (intent && !mutation.isPending) mutation.mutate(intent);
  };

  return { intent, begin, cancel, restore, confirm, retry, mutation };
}

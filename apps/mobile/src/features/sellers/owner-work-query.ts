import type { QueryClient } from '@tanstack/react-query';

import { canWritePrivateCache, ownerWorkKeys } from '../../lib/query-cache';

export const ownerWorkQueryKeys = ownerWorkKeys;

export async function invalidateOwnerWorks(
  queryClient: QueryClient,
  productId?: string,
): Promise<void> {
  if (!canWritePrivateCache(queryClient)) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ownerWorkQueryKeys.cabinet }),
    queryClient.invalidateQueries({
      queryKey: productId
        ? ownerWorkQueryKeys.detail(productId)
        : ownerWorkQueryKeys.detailRoot,
    }),
  ]);
}

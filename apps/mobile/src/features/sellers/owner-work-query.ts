import type { QueryClient } from '@tanstack/react-query';

import { canWritePrivateCache } from '../../lib/query-cache';

export const ownerWorkQueryKeys = {
  cabinet: ['seller', 'cabinet', 'works'] as const,
  detailRoot: ['seller', 'product'] as const,
  detail: (productId: string) => ['seller', 'product', productId] as const,
};

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

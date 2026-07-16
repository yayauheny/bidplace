import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  catalogueKeys,
  clearAuthScopedQueries,
  invalidateAuthScopedQueries,
  isAuthScopedQueryKey,
} from './query-cache';

describe('query cache auth boundaries', () => {
  it('recognizes auth-scoped query keys', () => {
    expect(isAuthScopedQueryKey(['seller', 'lots'])).toBe(true);
    expect(isAuthScopedQueryKey(['admin', 'users'])).toBe(true);
    expect(isAuthScopedQueryKey(['user', 'session'])).toBe(true);
    expect(isAuthScopedQueryKey(['auctions', 'list'])).toBe(false);
    expect(isAuthScopedQueryKey(catalogueKeys.categories)).toBe(false);
  });

  it('removes only auth-scoped query data', async () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(['auctions', 'list'], { page: 1 });
    queryClient.setQueryData(catalogueKeys.categories, ['art']);
    queryClient.setQueryData(['seller', 'lots'], [{ id: 'lot-1' }]);
    queryClient.setQueryData(['admin', 'users'], [{ id: 'user-1' }]);

    await clearAuthScopedQueries(queryClient);

    expect(queryClient.getQueryData(['auctions', 'list'])).toEqual({ page: 1 });
    expect(queryClient.getQueryData(catalogueKeys.categories)).toEqual(['art']);
    expect(queryClient.getQueryData(['seller', 'lots'])).toBeUndefined();
    expect(queryClient.getQueryData(['admin', 'users'])).toBeUndefined();
  });

  it('invalidates only auth-scoped queries', async () => {
    const queryClient = new QueryClient();
    const sellerQuery = queryClient.getQueryCache().build(queryClient, {
      queryKey: ['seller', 'lots'],
      queryFn: async () => [],
      initialData: [],
    });
    const publicQuery = queryClient.getQueryCache().build(queryClient, {
      queryKey: ['auctions', 'list'],
      queryFn: async () => [],
      initialData: [],
    });

    expect(sellerQuery.state.isInvalidated).toBe(false);
    expect(publicQuery.state.isInvalidated).toBe(false);

    await invalidateAuthScopedQueries(queryClient);

    expect(sellerQuery.state.isInvalidated).toBe(true);
    expect(publicQuery.state.isInvalidated).toBe(false);
  });
});

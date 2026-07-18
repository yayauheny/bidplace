import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  productKeys,
  clearAuthScopedQueries,
  invalidateAuthScopedQueries,
  isAuthScopedQueryKey,
} from './query-cache';

describe('query cache auth boundaries', () => {
  it('recognizes auth-scoped query keys', () => {
    expect(isAuthScopedQueryKey(['seller', 'products'])).toBe(true);
    expect(isAuthScopedQueryKey(['admin', 'users'])).toBe(true);
    expect(isAuthScopedQueryKey(['user', 'session'])).toBe(true);
    expect(isAuthScopedQueryKey(['products', 'list'])).toBe(false);
    expect(isAuthScopedQueryKey(productKeys.categories)).toBe(false);
  });

  it('removes only auth-scoped query data', async () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(['products', 'list'], { page: 1 });
    queryClient.setQueryData(productKeys.categories, ['art']);
    queryClient.setQueryData(['seller', 'products'], [{ id: 'product-1' }]);
    queryClient.setQueryData(['admin', 'users'], [{ id: 'user-1' }]);

    await clearAuthScopedQueries(queryClient);

    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    expect(queryClient.getQueryData(productKeys.categories)).toEqual(['art']);
    expect(queryClient.getQueryData(['seller', 'products'])).toBeUndefined();
    expect(queryClient.getQueryData(['admin', 'users'])).toBeUndefined();
  });

  it('invalidates only auth-scoped queries', async () => {
    const queryClient = new QueryClient();
    const sellerQuery = queryClient.getQueryCache().build(queryClient, {
      queryKey: ['seller', 'products'],
      queryFn: async () => [],
      initialData: [],
    });
    const publicQuery = queryClient.getQueryCache().build(queryClient, {
      queryKey: ['products', 'list'],
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

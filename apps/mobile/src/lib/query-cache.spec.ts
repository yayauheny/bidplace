import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  authKeys,
  clearAuthenticatedSession,
  clearAuthScopedDataExceptSession,
  productKeys,
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

  it('removes only non-session auth-scoped query data', async () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(['products', 'list'], { page: 1 });
    queryClient.setQueryData(productKeys.categories, ['art']);
    queryClient.setQueryData(authKeys.session, { id: 'user-1' });
    queryClient.setQueryData(['seller', 'products'], [{ id: 'product-1' }]);
    queryClient.setQueryData(['admin', 'users'], [{ id: 'user-1' }]);

    await clearAuthScopedDataExceptSession(queryClient);

    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    expect(queryClient.getQueryData(productKeys.categories)).toEqual(['art']);
    expect(queryClient.getQueryData(['seller', 'products'])).toBeUndefined();
    expect(queryClient.getQueryData(['admin', 'users'])).toBeUndefined();
    expect(queryClient.getQueryData(authKeys.session)).toEqual({
      id: 'user-1',
    });
  });

  it('makes the session anonymous while removing protected query data', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.session, { id: 'user-1' });
    queryClient.setQueryData(['seller', 'products'], [{ id: 'product-1' }]);
    queryClient.setQueryData(['products', 'list'], { page: 1 });

    await clearAuthenticatedSession(queryClient);

    expect(queryClient.getQueryData(authKeys.session)).toBeNull();
    expect(queryClient.getQueryData(['seller', 'products'])).toBeUndefined();
    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
  });

  it('keeps an accepted session response while clearing other protected data', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.session, { id: 'user-1' });
    queryClient.setQueryData(['user', 'profile'], { id: 'user-1' });
    queryClient.setQueryData(['seller', 'products'], [{ id: 'product-1' }]);

    await clearAuthScopedDataExceptSession(queryClient);

    expect(queryClient.getQueryData(authKeys.session)).toEqual({
      id: 'user-1',
    });
    expect(queryClient.getQueryData(['user', 'profile'])).toBeUndefined();
    expect(queryClient.getQueryData(['seller', 'products'])).toBeUndefined();
  });
});

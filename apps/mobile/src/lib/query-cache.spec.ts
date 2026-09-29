import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  authKeys,
  canWritePrivateCache,
  categoryKeys,
  clearAuthenticatedSession,
  clearAuthScopedDataExceptSession,
  currentAuthEpoch,
  isAuthScopedQueryKey,
  replaceAuthenticatedSession,
} from './query-cache';

describe('query cache auth boundaries', () => {
  it('recognizes auth-scoped query keys', () => {
    expect(isAuthScopedQueryKey(['seller', 'products'])).toBe(true);
    expect(isAuthScopedQueryKey(['admin', 'users'])).toBe(true);
    expect(isAuthScopedQueryKey(['user', 'session'])).toBe(true);
    expect(isAuthScopedQueryKey(['products', 'list'])).toBe(false);
    expect(isAuthScopedQueryKey(categoryKeys.all)).toBe(false);
  });

  it('removes only non-session auth-scoped query data', async () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(['products', 'list'], { page: 1 });
    queryClient.setQueryData(categoryKeys.all, ['art']);
    queryClient.setQueryData(authKeys.session, { id: 'user-1' });
    queryClient.setQueryData(['seller', 'products'], [{ id: 'product-1' }]);
    queryClient.setQueryData(['admin', 'users'], [{ id: 'user-1' }]);

    await clearAuthScopedDataExceptSession(queryClient);

    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    expect(queryClient.getQueryData(categoryKeys.all)).toEqual(['art']);
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

  it('closes private writes before cleanup awaits and drops a restored profile', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(authKeys.session, { id: 'user-a' });
    queryClient.setQueryData(['seller', 'profile'], { city: 'Minsk' });
    queryClient.setQueryData(['products', 'list'], { page: 1 });
    const started = currentAuthEpoch(queryClient);
    expect(canWritePrivateCache(queryClient, started)).toBe(true);

    let resolveRead: (value: { city: string }) => void = () => undefined;
    const reading = queryClient.fetchQuery({
      queryKey: authKeys.session,
      queryFn: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
    });
    const clearing = clearAuthenticatedSession(queryClient);
    expect(canWritePrivateCache(queryClient, started)).toBe(false);
    expect(canWritePrivateCache(queryClient)).toBe(false);
    resolveRead({ city: 'Late A' });
    await Promise.allSettled([reading, clearing]);

    expect(queryClient.getQueryData(authKeys.session)).toBeNull();
    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    expect(canWritePrivateCache(queryClient, started)).toBe(false);
  });

  it('keeps a newer published session when an older retirement finishes late', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(authKeys.session, { id: 'user-a' });
    queryClient.setQueryData(['seller', 'profile'], { city: 'A' });
    const logout = clearAuthenticatedSession(queryClient);
    const login = replaceAuthenticatedSession(queryClient, { id: 'user-b' });
    await Promise.all([logout, login]);

    expect(queryClient.getQueryData(authKeys.session)).toEqual({ id: 'user-b' });
    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    expect(canWritePrivateCache(queryClient)).toBe(true);
  });
});

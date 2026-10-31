import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  authKeys,
  canWritePrivateCache,
  captureDraftWriteLease,
  categoryKeys,
  clearAuthenticatedSession,
  clearAuthScopedDataExceptSession,
  commerceKeys,
  currentAuthEpoch,
  draftWriteLeaseIsValid,
  invalidateWorkSurfaces,
  isAuthScopedQueryKey,
  issueDraftWriteLease,
  ownerWorkKeys,
  portfolioKeys,
  replaceAuthenticatedSession,
  retireDraftWriteLease,
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

    expect(queryClient.getQueryData(authKeys.session)).toEqual({
      id: 'user-b',
    });
    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    expect(canWritePrivateCache(queryClient)).toBe(true);
  });

  it('drops a late private response after the next session is installed', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await replaceAuthenticatedSession(queryClient, { id: 'user-a' });
    const epoch = currentAuthEpoch(queryClient);
    let resolveLot: (value: { bid: number }) => void = () => undefined;
    let resolveContacts: (value: { phone: string }) => void = () => undefined;
    const readPrivate = <T>(
      queryKey: readonly unknown[],
      wait: (resolve: (value: T) => void) => void,
    ) =>
      queryClient
        .fetchQuery({
          queryKey: [...queryKey],
          queryFn: async () => {
            const value = await new Promise<T>((resolve) => {
              wait(resolve);
            });
            if (!canWritePrivateCache(queryClient, epoch)) {
              throw new Error('Private cache is closed');
            }
            return value;
          },
        })
        .catch((error: unknown) => error);

    const lotA = readPrivate(
      commerceKeys.lot('work-1', 'user-a'),
      (resolve) => {
        resolveLot = resolve;
      },
    );
    const contactsA = readPrivate(commerceKeys.contacts(), (resolve) => {
      resolveContacts = resolve;
    });

    await clearAuthenticatedSession(queryClient);
    await replaceAuthenticatedSession(queryClient, { id: 'user-b' });
    queryClient.setQueryData(commerceKeys.lot('work-1', 'user-b'), { bid: 2 });
    queryClient.setQueryData(commerceKeys.contacts(), { phone: 'b' });

    resolveLot({ bid: 1 });
    resolveContacts({ phone: 'a' });
    await Promise.all([lotA, contactsA]);

    expect(
      queryClient.getQueryData(commerceKeys.lot('work-1', 'user-b')),
    ).toEqual({ bid: 2 });
    expect(
      queryClient.getQueryData(commerceKeys.lot('work-1', 'user-a')),
    ).toBeUndefined();
    expect(queryClient.getQueryData(commerceKeys.contacts())).toEqual({
      phone: 'b',
    });
  });
});

describe('draft write lease', () => {
  it('starts open and invalidates captured leases on retire', () => {
    const queryClient = new QueryClient();
    const lease = captureDraftWriteLease(queryClient);
    expect(lease).not.toBeNull();
    retireDraftWriteLease(queryClient);
    expect(draftWriteLeaseIsValid(queryClient, lease)).toBe(false);
    expect(captureDraftWriteLease(queryClient)).toBeNull();
  });

  it('re-arms only through a newly issued lease, never for old captures', () => {
    const queryClient = new QueryClient();
    const before = captureDraftWriteLease(queryClient);
    retireDraftWriteLease(queryClient);
    issueDraftWriteLease(queryClient);
    const after = captureDraftWriteLease(queryClient);
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
    expect(draftWriteLeaseIsValid(queryClient, before)).toBe(false);
    expect(draftWriteLeaseIsValid(queryClient, after)).toBe(true);
  });

  it('issues a fresh lease when a replacement session installs', async () => {
    const queryClient = new QueryClient();
    const before = captureDraftWriteLease(queryClient);
    retireDraftWriteLease(queryClient);
    await replaceAuthenticatedSession(queryClient, { id: 'user-b' });
    const after = captureDraftWriteLease(queryClient);
    expect(after).not.toBeNull();
    expect(draftWriteLeaseIsValid(queryClient, before)).toBe(false);
  });
});

describe('commerce query keys', () => {
  it('scopes private sale data under the user root and leaves bids public', () => {
    expect(commerceKeys.lot('work-1', 'viewer-1')).toEqual([
      'user',
      'viewer-1',
      'lot',
      'work-1',
    ]);
    expect(commerceKeys.lot('work-1', null)).toEqual([
      'user',
      'anonymous',
      'lot',
      'work-1',
    ]);
    expect(commerceKeys.orders('buying', 'active')[0]).toBe('user');
    expect(commerceKeys.order('order-1')[0]).toBe('user');
    expect(commerceKeys.attention()[0]).toBe('user');
    expect(commerceKeys.favorites()[0]).toBe('user');
    expect(commerceKeys.favorite('product-1')[0]).toBe('user');
    expect(commerceKeys.contacts()[0]).toBe('user');
    expect(commerceKeys.notificationSettings()[0]).toBe('user');
    expect(commerceKeys.bids('listing-1')[0]).not.toBe('user');
    expect(portfolioKeys.work('work-1')).toEqual(['portfolio-work', 'work-1']);
    expect(portfolioKeys.works({ page: 1 })).toEqual([
      'portfolio-works',
      { page: 1 },
    ]);
  });

  it('drops private sale cache on logout and keeps public bids', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.session, { id: 'viewer-1' });
    queryClient.setQueryData(commerceKeys.lot('work-1', 'viewer-1'), {
      bid: 1,
    });
    queryClient.setQueryData(commerceKeys.lot('work-1', null), { bid: 0 });
    queryClient.setQueryData(commerceKeys.orders('buying', 'active'), []);
    queryClient.setQueryData(commerceKeys.order('order-1'), { id: 'order-1' });
    queryClient.setQueryData(commerceKeys.attention(), { count: 1 });
    queryClient.setQueryData(commerceKeys.favorites(), []);
    queryClient.setQueryData(commerceKeys.favorite('product-1'), true);
    queryClient.setQueryData(commerceKeys.contacts(), { phone: '1' });
    queryClient.setQueryData(commerceKeys.notificationSettings(), {
      email: true,
    });
    queryClient.setQueryData(commerceKeys.bids('listing-1'), [{ amount: 1 }]);
    queryClient.setQueryData(portfolioKeys.home, { ok: true });

    await clearAuthenticatedSession(queryClient);

    expect(
      queryClient.getQueryData(commerceKeys.lot('work-1', 'viewer-1')),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(commerceKeys.lot('work-1', null)),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(commerceKeys.orders('buying', 'active')),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(commerceKeys.order('order-1')),
    ).toBeUndefined();
    expect(queryClient.getQueryData(commerceKeys.attention())).toBeUndefined();
    expect(queryClient.getQueryData(commerceKeys.favorites())).toBeUndefined();
    expect(
      queryClient.getQueryData(commerceKeys.favorite('product-1')),
    ).toBeUndefined();
    expect(queryClient.getQueryData(commerceKeys.contacts())).toBeUndefined();
    expect(
      queryClient.getQueryData(commerceKeys.notificationSettings()),
    ).toBeUndefined();
    expect(queryClient.getQueryData(commerceKeys.bids('listing-1'))).toEqual([
      { amount: 1 },
    ]);
    expect(queryClient.getQueryData(portfolioKeys.home)).toEqual({ ok: true });
  });

  it('invalidates only the work, lot, list, home, author, and owner-work prefixes', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.session, { id: 'viewer-1' });
    queryClient.setQueryData(portfolioKeys.work('w1'), { a: 1 });
    queryClient.setQueryData(portfolioKeys.work('w2'), { a: 2 });
    queryClient.setQueryData(portfolioKeys.works({ page: 1 }), { items: [] });
    queryClient.setQueryData(portfolioKeys.home, {});
    queryClient.setQueryData(portfolioKeys.author('ann'), {});
    queryClient.setQueryData(portfolioKeys.author('bob'), {});
    queryClient.setQueryData(commerceKeys.lot('w1', 'viewer-1'), {});
    queryClient.setQueryData(commerceKeys.lot('w2', 'viewer-1'), {});
    queryClient.setQueryData(commerceKeys.bids('listing-1'), []);
    queryClient.setQueryData(ownerWorkKeys.cabinet, []);
    queryClient.setQueryData(ownerWorkKeys.detail('product-1'), {});
    queryClient.setQueryData(categoryKeys.all, ['art']);

    await invalidateWorkSurfaces(queryClient, {
      publicId: 'w1',
      sellerSlug: 'ann',
    });

    expect(
      queryClient.getQueryState(portfolioKeys.work('w1'))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(portfolioKeys.work('w2'))?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(portfolioKeys.works({ page: 1 }))
        ?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(portfolioKeys.home)?.isInvalidated).toBe(
      true,
    );
    expect(
      queryClient.getQueryState(portfolioKeys.author('ann'))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(portfolioKeys.author('bob'))?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(commerceKeys.lot('w1', 'viewer-1'))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(commerceKeys.lot('w2', 'viewer-1'))
        ?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(commerceKeys.bids('listing-1'))?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(ownerWorkKeys.cabinet)?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(ownerWorkKeys.detail('product-1'))
        ?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(categoryKeys.all)?.isInvalidated).toBe(
      false,
    );
  });

  it('invalidates every work, lot, and author when no id is given', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.session, { id: 'viewer-1' });
    queryClient.setQueryData(portfolioKeys.work('w1'), { a: 1 });
    queryClient.setQueryData(portfolioKeys.author('ann'), {});
    queryClient.setQueryData(commerceKeys.lot('w1', null), {});

    await invalidateWorkSurfaces(queryClient, {});

    expect(
      queryClient.getQueryState(portfolioKeys.work('w1'))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(portfolioKeys.author('ann'))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(commerceKeys.lot('w1', null))?.isInvalidated,
    ).toBe(true);
  });
});

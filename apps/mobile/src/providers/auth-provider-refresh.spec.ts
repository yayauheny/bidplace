/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  authKeys,
  canWritePrivateCache,
  currentAuthEpoch,
} from '../lib/query-cache';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
}));

vi.mock('./api-provider', () => ({
  useApiClient: () => ({
    auth: {
      me: harness.me,
      login: harness.login,
      logout: vi.fn(),
    },
  }),
}));

import { AuthProvider, useAuth } from './auth-provider';

const userA = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'a@example.com',
  phone: null,
  emailVerifiedAt: null,
  phoneVerifiedAt: null,
  acceptedRulesVersion: null,
  displayName: 'Author A',
  role: 'user' as const,
  status: 'active' as const,
  createdAt: '2026-09-27T00:00:00.000Z',
  updatedAt: '2026-09-27T00:00:00.000Z',
};

const userB = {
  ...userA,
  id: '22222222-2222-4222-8222-222222222222',
  email: 'b@example.com',
  displayName: 'Author B',
};

let refreshSession: (() => Promise<unknown>) | null = null;
let login: ((input: { email: string; password: string }) => Promise<unknown>) | null =
  null;

function Capture() {
  const auth = useAuth();
  refreshSession = auth.refreshSession;
  login = auth.login;
  return createElement('div', null, auth.user?.id ?? 'anonymous');
}

function mount(queryClient: QueryClient) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(AuthProvider, null, createElement(Capture)),
      ),
    );
  });
  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function settleInitialSession(view: { container: HTMLElement }) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (view.container.textContent?.includes(userA.id)) return;
    await flush();
  }
}

function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

afterEach(() => {
  refreshSession = null;
  login = null;
  document.body.replaceChildren();
  harness.me.mockReset();
  harness.login.mockReset();
});

describe('AuthProvider.refreshSession identity', () => {
  it('loads the initial session without dropping public cache', async () => {
    const queryClient = client();
    queryClient.setQueryData(['products', 'list'], { page: 1 });
    harness.me.mockResolvedValue({ user: userA });
    const view = mount(queryClient);
    await settleInitialSession(view);

    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userA.id });
    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    view.unmount();
  });

  it('retires private cache when refresh replaces user A with user B', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    const view = mount(queryClient);
    await settleInitialSession(view);
    const epoch = currentAuthEpoch(queryClient);
    queryClient.setQueryData(['seller', 'profile'], { owner: 'A' });
    queryClient.setQueryData(['products', 'list'], { page: 1 });
    harness.me.mockResolvedValue({ user: userB });

    await act(async () => {
      await expect(refreshSession?.()).resolves.toMatchObject({ id: userB.id });
    });

    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    expect(canWritePrivateCache(queryClient, epoch)).toBe(false);
    expect(canWritePrivateCache(queryClient)).toBe(true);
    view.unmount();
  });

  it('keeps the private profile and epoch when the same user refreshes metadata', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    const view = mount(queryClient);
    await settleInitialSession(view);
    const epoch = currentAuthEpoch(queryClient);
    queryClient.setQueryData(['seller', 'profile'], { city: 'Minsk' });
    const verified = {
      ...userA,
      emailVerifiedAt: '2026-09-29T00:00:00.000Z',
    };
    harness.me.mockResolvedValue({ user: verified });

    await act(async () => {
      await refreshSession?.();
    });

    expect(currentAuthEpoch(queryClient)).toBe(epoch);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({
      id: userA.id,
      emailVerifiedAt: verified.emailVerifiedAt,
    });
    expect(queryClient.getQueryData(['seller', 'profile'])).toEqual({ city: 'Minsk' });
    expect(canWritePrivateCache(queryClient, epoch)).toBe(true);
    view.unmount();
  });

  it('clears the local session when refresh is unauthorized and keeps it when refresh fails on the network', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    const view = mount(queryClient);
    await settleInitialSession(view);
    queryClient.setQueryData(['seller', 'profile'], { owner: 'A' });
    queryClient.setQueryData(['products', 'list'], { page: 1 });
    harness.me.mockRejectedValue(
      new ApiClientError('Network request failed', { kind: 'network', status: 0 }),
    );

    await act(async () => {
      await expect(refreshSession?.()).rejects.toMatchObject({ kind: 'network' });
    });
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userA.id });
    expect(queryClient.getQueryData(['seller', 'profile'])).toEqual({ owner: 'A' });

    harness.me.mockRejectedValue(
      new ApiClientError('Unauthorized', { kind: 'unauthorized', status: 401 }),
    );
    await act(async () => {
      await expect(refreshSession?.()).resolves.toBeNull();
    });
    expect(queryClient.getQueryData(authKeys.session)).toBeNull();
    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    view.unmount();
  });

  it('does not let a late callback from user A restore the private profile after refresh to B', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    const view = mount(queryClient);
    await settleInitialSession(view);
    const epoch = currentAuthEpoch(queryClient);
    queryClient.setQueryData(['seller', 'profile'], { city: 'Minsk' });
    harness.me.mockResolvedValue({
      user: userB,
    });

    await act(async () => {
      await refreshSession?.();
    });
    if (canWritePrivateCache(queryClient, epoch)) {
      queryClient.setQueryData(['seller', 'profile'], { city: 'Late A' });
    }

    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    view.unmount();
  });

  it('isolates an explicit same-account login from the previous private cache', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    harness.login.mockResolvedValue({ user: userA });
    const view = mount(queryClient);
    await settleInitialSession(view);
    const epoch = currentAuthEpoch(queryClient);
    queryClient.setQueryData(['seller', 'profile'], { city: 'Minsk' });

    await act(async () => {
      await login?.({ email: userA.email, password: 'secret' });
    });

    expect(currentAuthEpoch(queryClient)).not.toBe(epoch);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userA.id });
    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    expect(canWritePrivateCache(queryClient, epoch)).toBe(false);
    view.unmount();
  });
});

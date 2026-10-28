/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flush } from '../testing/dom';

import {
  authKeys,
  canWritePrivateCache,
  clearAuthenticatedSession,
  currentAuthEpoch,
  readAuthEpoch,
  subscribeAuthEpoch,
} from '../lib/query-cache';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('./api-provider', () => ({
  useApiClient: () => ({
    auth: {
      me: harness.me,
      login: harness.login,
      register: harness.register,
      logout: harness.logout,
    },
  }),
}));

import { AuthProvider, registerSessionChangeIsOwn, useAuth } from './auth-provider';

const userA = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'a@example.com',
  phone: null,
  emailVerifiedAt: null,
  phoneVerifiedAt: null,
  acceptedRulesVersion: null,
  displayName: 'Author A',
  slug: null,
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
let login: ((
  input: { email: string; password: string },
  options?: { signal?: AbortSignal },
) => Promise<unknown>) | null = null;
let register: ((
  input: { email: string; password: string; slug: string },
  options?: { signal?: AbortSignal },
) => Promise<unknown>) | null = null;
let logout: (() => Promise<void>) | null = null;

function Capture() {
  const auth = useAuth();
  refreshSession = auth.refreshSession;
  login = auth.login;
  register = auth.register as NonNullable<typeof register>;
  logout = auth.logout;
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
  register = null;
  logout = null;
  document.body.replaceChildren();
  harness.me.mockReset();
  harness.login.mockReset();
  harness.register.mockReset();
  harness.logout.mockReset();
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

function abortError() {
  return new DOMException('The operation was aborted', 'AbortError');
}

function deferred<T>(signal: AbortSignal | undefined, respectAbort: boolean) {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, reject) => {
    resolve = resolvePromise;
    if (!signal) return;
    const fail = () => reject(abortError());
    if (signal.aborted) fail();
    else if (respectAbort) signal.addEventListener('abort', fail, { once: true });
  });
  return { promise, resolve, signal };
}

function gateCancelQueries(queryClient: QueryClient) {
  const original = queryClient.cancelQueries.bind(queryClient);
  let opened = false;
  let open: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    open = () => {
      opened = true;
      resolve();
    };
  });
  queryClient.cancelQueries = ((...args: Parameters<QueryClient['cancelQueries']>) => {
    if (opened) return original(...args);
    return gate.then(() => original(...args));
  }) as QueryClient['cancelQueries'];
  return { release: open };
}

describe('AuthProvider auth-write owner', () => {
  it('aborts login A when login B takes the write and keeps B after A is rejected', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    const calls: Array<ReturnType<typeof deferred<{ user: typeof userB }>>> = [];
    harness.login.mockImplementation((_input, options?: { signal?: AbortSignal }) => {
      const pending = deferred<{ user: typeof userB }>(options?.signal, true);
      calls.push(pending);
      return pending.promise;
    });
    const view = mount(queryClient);
    await settleInitialSession(view);

    const loginA = login?.({ email: userA.email, password: 'secret-a' });
    const rejectedA = expect(loginA).rejects.toMatchObject({ name: 'AbortError' });
    expect(calls).toHaveLength(1);
    const signalA = calls[0]?.signal;
    if (!signalA) throw new Error('missing login A signal');

    await act(async () => {
      const loginB = login?.({ email: userB.email, password: 'secret-b' });
      calls[1]?.resolve({ user: userB });
      await loginB;
    });

    expect(signalA.aborted).toBe(true);
    expect(calls[1]?.signal?.aborted).toBe(false);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    await rejectedA;
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    view.unmount();
  });

  it('aborts register A when login B takes the write and does not install A', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    let registerSignal: AbortSignal | undefined;
    let resolveRegister: (value: { user: typeof userA }) => void = () => undefined;
    harness.register.mockImplementation((_input, options?: { signal?: AbortSignal }) => {
      registerSignal = options?.signal;
      return new Promise((resolve, reject) => {
        resolveRegister = resolve;
        options?.signal?.addEventListener('abort', () => reject(abortError()), { once: true });
      });
    });
    harness.login.mockResolvedValue({ user: userB });
    const view = mount(queryClient);
    await settleInitialSession(view);
    queryClient.setQueryData(['seller', 'profile'], { owner: 'A' });

    const registerA = register?.({
      email: userA.email,
      password: 'secret-a',
      slug: 'author-a',
    });
    const rejectedA = expect(registerA).rejects.toMatchObject({ name: 'AbortError' });

    await act(async () => {
      await login?.({ email: userB.email, password: 'secret-b' });
    });

    expect(registerSignal?.aborted).toBe(true);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    await rejectedA;
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    resolveRegister({ user: userA });
    await flush();
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    view.unmount();
  });

  it('does not let a superseded logout clear login B', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    let logoutSignal: AbortSignal | undefined;
    harness.logout.mockImplementation((options?: { signal?: AbortSignal }) => {
      logoutSignal = options?.signal;
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => reject(abortError()), { once: true });
      });
    });
    harness.login.mockResolvedValue({ user: userB });
    const view = mount(queryClient);
    await settleInitialSession(view);
    queryClient.setQueryData(['seller', 'profile'], { owner: 'A' });

    const logoutA = logout?.();
    const rejectedLogout = expect(logoutA).rejects.toMatchObject({ name: 'AbortError' });

    await act(async () => {
      await login?.({ email: userB.email, password: 'secret-b' });
    });
    queryClient.setQueryData(['seller', 'profile'], { owner: 'B' });

    expect(logoutSignal?.aborted).toBe(true);
    await rejectedLogout;
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    expect(queryClient.getQueryData(['seller', 'profile'])).toEqual({ owner: 'B' });
    view.unmount();
  });

  it('rejects a stale login A resolution without replacing login B cache', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    const calls: Array<ReturnType<typeof deferred<{ user: typeof userA }>>> = [];
    harness.login.mockImplementation((_input, options?: { signal?: AbortSignal }) => {
      if (calls.length === 0) {
        const pending = deferred<{ user: typeof userA }>(options?.signal, false);
        calls.push(pending);
        return pending.promise;
      }
      return Promise.resolve({ user: userB });
    });
    const view = mount(queryClient);
    await settleInitialSession(view);

    const loginA = login?.({ email: userA.email, password: 'secret-a' });
    const rejectedA = expect(loginA).rejects.toMatchObject({ name: 'AbortError' });

    await act(async () => {
      await login?.({ email: userB.email, password: 'secret-b' });
    });
    queryClient.setQueryData(['seller', 'profile'], { owner: 'B' });
    queryClient.setQueryData(['products', 'list'], { page: 1 });

    calls[0]?.resolve({ user: userA });
    await rejectedA;
    expect(calls[0]?.signal?.aborted).toBe(true);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    expect(queryClient.getQueryData(['seller', 'profile'])).toEqual({ owner: 'B' });
    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    view.unmount();
  });

  it('rejects a stale logout resolution without clearing login B', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    let logoutSignal: AbortSignal | undefined;
    let resolveLogout: (value: { ok: true }) => void = () => undefined;
    harness.logout.mockImplementation((options?: { signal?: AbortSignal }) => {
      logoutSignal = options?.signal;
      return new Promise((resolve) => {
        resolveLogout = resolve;
      });
    });
    harness.login.mockResolvedValue({ user: userB });
    const view = mount(queryClient);
    await settleInitialSession(view);

    const logoutA = logout?.();
    const rejectedLogout = expect(logoutA).rejects.toMatchObject({ name: 'AbortError' });

    await act(async () => {
      await login?.({ email: userB.email, password: 'secret-b' });
    });
    queryClient.setQueryData(['seller', 'profile'], { owner: 'B' });

    resolveLogout({ ok: true });
    await rejectedLogout;
    expect(logoutSignal?.aborted).toBe(true);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    expect(queryClient.getQueryData(['seller', 'profile'])).toEqual({ owner: 'B' });
    view.unmount();
  });

  it('installs the current register without aborting that write and records its own epochs', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    let registerSignal: AbortSignal | undefined;
    harness.register.mockImplementation((_input, options?: { signal?: AbortSignal }) => {
      registerSignal = options?.signal;
      return Promise.resolve({ user: userB });
    });
    const view = mount(queryClient);
    await settleInitialSession(view);
    const startEpoch = currentAuthEpoch(queryClient);
    const during: boolean[] = [];
    const stop = subscribeAuthEpoch(queryClient, () => {
      during.push(registerSessionChangeIsOwn(queryClient, currentAuthEpoch(queryClient)));
    });

    await act(async () => {
      await register?.({
        email: userB.email,
        password: 'secret-b',
        slug: 'author-b',
      });
    });
    stop();

    expect(registerSignal?.aborted).toBe(false);
    expect(during).toEqual([true, true]);
    expect(registerSessionChangeIsOwn(queryClient, startEpoch + 1)).toBe(true);
    expect(registerSessionChangeIsOwn(queryClient, startEpoch + 2)).toBe(true);
    expect(registerSessionChangeIsOwn(queryClient, startEpoch)).toBe(false);
    expect(currentAuthEpoch(queryClient)).toBe(startEpoch + 2);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    view.unmount();
  });

  it('aborts the current auth write when the provider unmounts', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    let signal: AbortSignal | undefined;
    harness.login.mockImplementation((_input, options?: { signal?: AbortSignal }) => {
      signal = options?.signal;
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => reject(abortError()), { once: true });
      });
    });
    const view = mount(queryClient);
    await settleInitialSession(view);

    const pending = login?.({ email: userB.email, password: 'secret-b' });
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    view.unmount();
    await rejected;
    expect(signal?.aborted).toBe(true);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userA.id });
    queryClient.clear();
  });

  it('rejects a same-user login when a foreign clear retires its install', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    harness.login.mockResolvedValue({ user: userA });
    const gate = gateCancelQueries(queryClient);
    const view = mount(queryClient);
    await settleInitialSession(view);

    const loginPromise = login?.({ email: userA.email, password: 'secret' });
    const rejected = expect(loginPromise).rejects.toMatchObject({ name: 'AbortError' });
    await flush();
    const retired = readAuthEpoch(queryClient);
    expect(retired.writesOpen).toBe(false);
    const clearPromise = clearAuthenticatedSession(queryClient);
    const foreign = readAuthEpoch(queryClient);
    expect(foreign.writesOpen).toBe(false);
    expect(foreign.id).toBe(retired.id + 1);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userA.id });

    gate.release();
    await act(async () => {
      await rejected;
      await clearPromise;
    });
    expect(queryClient.getQueryData(authKeys.session)).toBeNull();
    view.unmount();
  });

  it('keeps login B when login A is still inside its cache install', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    let calls = 0;
    let signalB: AbortSignal | undefined;
    harness.login.mockImplementation((_input, options?: { signal?: AbortSignal }) => {
      calls += 1;
      if (calls === 1) return Promise.resolve({ user: userA });
      signalB = options?.signal;
      return Promise.resolve({ user: userB });
    });
    const gate = gateCancelQueries(queryClient);
    const view = mount(queryClient);
    await settleInitialSession(view);

    const loginA = login?.({ email: userA.email, password: 'secret-a' });
    const rejectedA = expect(loginA).rejects.toMatchObject({ name: 'AbortError' });
    await flush();
    expect(calls).toBe(1);
    expect(readAuthEpoch(queryClient).writesOpen).toBe(false);

    const loginB = login?.({ email: userB.email, password: 'secret-b' });
    expect(calls).toBe(1);
    gate.release();
    await act(async () => {
      await rejectedA;
      await loginB;
    });

    expect(calls).toBe(2);
    expect(signalB?.aborted).toBe(false);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    expect(readAuthEpoch(queryClient).writesOpen).toBe(true);
    view.unmount();
  });

  it('keeps login B when logout A is still inside its cache clear', async () => {
    const queryClient = client();
    harness.me.mockResolvedValue({ user: userA });
    harness.logout.mockResolvedValue(undefined);
    let signalB: AbortSignal | undefined;
    harness.login.mockImplementation((_input, options?: { signal?: AbortSignal }) => {
      signalB = options?.signal;
      return Promise.resolve({ user: userB });
    });
    const gate = gateCancelQueries(queryClient);
    const view = mount(queryClient);
    await settleInitialSession(view);

    const logoutA = logout?.();
    const rejectedLogout = expect(logoutA).rejects.toMatchObject({ name: 'AbortError' });
    await flush();
    expect(readAuthEpoch(queryClient).writesOpen).toBe(false);

    const loginB = login?.({ email: userB.email, password: 'secret-b' });
    gate.release();
    await act(async () => {
      await rejectedLogout;
      await loginB;
    });

    expect(signalB?.aborted).toBe(false);
    expect(queryClient.getQueryData(authKeys.session)).toMatchObject({ id: userB.id });
    expect(readAuthEpoch(queryClient).writesOpen).toBe(true);
    view.unmount();
  });
});

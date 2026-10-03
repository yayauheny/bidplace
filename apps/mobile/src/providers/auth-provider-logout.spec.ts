/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flush } from '../testing/dom';

import { authKeys } from '../lib/query-cache';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  me: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('./api-provider', () => ({
  useApiClient: () => ({
    auth: {
      me: harness.me,
      logout: harness.logout,
    },
  }),
}));

vi.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string | { pathname?: string } }) =>
    createElement('div', {
      'data-redirect': typeof href === 'string' ? href : (href.pathname ?? ''),
    }),
  usePathname: () => '/cabinet',
  useGlobalSearchParams: () => ({}),
  useSegments: () => ['(seller)', 'cabinet'],
}));

vi.mock('../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('../components/shared/InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: ({ status }: { status: string }) =>
    createElement('div', null, status),
}));

import { ProtectedRoute } from '../components/shared/protected-route';
import { AuthProvider, useAuth } from './auth-provider';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'author@example.com',
  phone: null,
  emailVerifiedAt: '2026-09-27T00:00:00.000Z',
  phoneVerifiedAt: null,
  acceptedRulesVersion: null,
  displayName: 'Author',
  role: 'user' as const,
  status: 'active' as const,
  createdAt: '2026-09-27T00:00:00.000Z',
  updatedAt: '2026-09-27T00:00:00.000Z',
};

let logout: (() => Promise<void>) | null = null;

function Capture() {
  const auth = useAuth();
  logout = auth.logout;
  return createElement(ProtectedRoute, null, createElement('div', null, 'private-cabinet'));
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

afterEach(() => {
  logout = null;
  document.body.replaceChildren();
  harness.me.mockReset();
  harness.logout.mockReset();
});

describe('AuthProvider.logout', () => {
  it('clears the local session and private cache when server logout rejects, then the protected route requires login', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    harness.me.mockResolvedValue({ user });
    harness.logout.mockRejectedValue(new Error('offline'));
    const view = mount(queryClient);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (view.container.textContent?.includes('private-cabinet')) break;
      await flush();
    }
    expect(view.container.textContent).toContain('private-cabinet');
    queryClient.setQueryData(['seller', 'profile'], { private: true });
    queryClient.setQueryData(['products', 'list'], { page: 1 });

    await act(async () => {
      await expect(logout?.()).rejects.toThrow('offline');
    });
    await flush();

    expect(queryClient.getQueryData(authKeys.session)).toBeNull();
    expect(queryClient.getQueryData(['seller', 'profile'])).toBeUndefined();
    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
    expect(view.container.textContent).not.toContain('private-cabinet');
    expect(view.container.querySelector('[data-redirect]')?.getAttribute('data-redirect')).toBe(
      '/login',
    );
    expect(harness.logout).toHaveBeenCalledTimes(1);

    view.unmount();
    queryClient.clear();
  });
});

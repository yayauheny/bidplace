/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClient, type ApiClient } from '@bidplace/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flush } from '../../testing/dom';

import { ProtectedRoute } from './protected-route';
import { AuthProvider, useAuth } from '../../providers/auth-provider';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type MeOutcome = 'network' | 'unauthorized' | 'user';

const harness = vi.hoisted(() => ({
  outcomes: [] as MeOutcome[],
  client: null as ApiClient | null,
}));

const user = {
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

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => {
    if (!harness.client) {
      throw new Error('API client is not ready');
    }
    return harness.client;
  },
}));

vi.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string | { pathname?: string } }) =>
    createElement('div', {
      'data-redirect': typeof href === 'string' ? href : (href.pathname ?? ''),
    }),
  usePathname: () => '/account',
  useGlobalSearchParams: () => ({}),
  useSegments: () => ['account'],
}));

vi.mock('../layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('./InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: ({
    status,
    onRetry,
  }: {
    status: 'loading' | 'error';
    onRetry: () => void;
  }) =>
    createElement(
      'div',
      null,
      createElement('span', { 'data-status': status }, status),
      createElement('button', { type: 'button', onClick: onRetry }, 'Повторить'),
    ),
}));

function SessionProbe({ onRefreshFailure }: { onRefreshFailure: (error: unknown) => void }) {
  const auth = useAuth();
  return createElement(
    'button',
    {
      type: 'button',
      'data-probe': 'session',
      onClick: () => {
        void auth.refreshSession().then(
          () => undefined,
          (error: unknown) => {
            onRefreshFailure(error);
          },
        );
      },
    },
    auth.user?.id === user.id ? 'session' : 'signed-out',
  );
}

function mount(outcomes: MeOutcome[], onRefreshFailure: (error: unknown) => void) {
  harness.outcomes = [...outcomes];
  harness.client = createApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl: async (input: RequestInfo | URL) => {
      const path = String(input);
      if (!path.endsWith('/api/auth/me')) {
        throw new Error(`unexpected ${path}`);
      }
      const outcome = harness.outcomes.shift();
      if (outcome === 'network') {
        throw new TypeError('Failed to fetch');
      }
      if (outcome === 'unauthorized') {
        return new Response(
          JSON.stringify({ status: 401, code: 'unauthorized', message: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        );
      }
      if (outcome === 'user') {
        return new Response(JSON.stringify({ user }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error('unexpected /api/auth/me');
    },
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          AuthProvider,
          null,
          createElement(
            ProtectedRoute,
            null,
            createElement(
              'div',
              null,
              'private',
              createElement(SessionProbe, { onRefreshFailure }),
            ),
          ),
        ),
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
      queryClient.clear();
    },
  };
}

async function settle(container: HTMLElement, text: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (container.textContent?.includes(text)) return;
    await flush();
  }
}

describe('ProtectedRoute refresh rejection', () => {
  afterEach(() => {
    harness.outcomes = [];
    harness.client = null;
    document.body.replaceChildren();
  });

  it('keeps the error retry after a second network failure without an unhandled rejection', async () => {
    const view = mount(['network', 'network', 'user'], () => undefined);
    await settle(view.container, 'error');
    expect(view.container.textContent).toContain('error');

    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    try {
      const retry = view.container.querySelector('button');
      expect(retry).toBeTruthy();
      await act(async () => {
        retry?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await settle(view.container, 'error');
      await flush();
      expect(view.container.querySelector('[data-status]')?.getAttribute('data-status')).toBe(
        'error',
      );
      expect(unhandled).toEqual([]);
      expect(view.container.textContent).toContain('Повторить');

      await act(async () => {
        view.container
          .querySelector('button')
          ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await settle(view.container, 'private');
      expect(view.container.textContent).toContain('private');
    } finally {
      process.off('unhandledRejection', onUnhandled);
      view.unmount();
    }
  });

  it('clears the session when a refresh from the error state is unauthorized', async () => {
    const view = mount(['network', 'unauthorized'], () => undefined);
    await settle(view.container, 'error');
    await act(async () => {
      view.container
        .querySelector('button')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (view.container.querySelector('[data-redirect]')) break;
      await flush();
    }
    expect(view.container.querySelector('[data-redirect]')?.getAttribute('data-redirect')).toBe(
      '/login',
    );
    view.unmount();
  });

  it('keeps an existing session when a later refresh fails on the network', async () => {
    const failures: unknown[] = [];
    const view = mount(['user', 'network'], (error) => {
      failures.push(error);
    });
    await settle(view.container, 'session');
    expect(view.container.textContent).toContain('session');
    await act(async () => {
      view.container
        .querySelector('[data-probe="session"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (failures.length > 0) break;
      await flush();
    }
    expect(failures[0]).toMatchObject({ kind: 'network' });
    expect(view.container.textContent).toContain('session');
    view.unmount();
  });
});

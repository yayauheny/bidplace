/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from './protected-route';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const auth = vi.hoisted(() => ({
  canModerate: false,
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    ready: true,
    status: 'ready',
    isAuthenticated: true,
    canModerate: auth.canModerate,
    user: { emailVerifiedAt: '2026-11-02T00:00:00.000Z' },
    refreshSession: vi.fn(),
  }),
}));

vi.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string | { pathname?: string } }) =>
    createElement('div', {
      'data-redirect': typeof href === 'string' ? href : (href.pathname ?? ''),
    }),
  usePathname: () => '/admin/commerce',
  useGlobalSearchParams: () => ({}),
  useSegments: () => ['admin', 'commerce'],
}));

vi.mock('../layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('./InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: () => null,
}));

describe('admin route gate', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
    auth.canModerate = false;
  });

  function mount() {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        createElement(ProtectedRoute, {
          requireAdmin: true,
          children: createElement('div', null, 'commerce-admin'),
        }),
      );
    });
  }

  it('sends a signed-in non-admin away from the commerce screen', () => {
    mount();
    expect(container?.querySelector('[data-redirect]')?.getAttribute('data-redirect')).toBe(
      '/',
    );
    expect(container?.textContent).not.toContain('commerce-admin');
  });

  it('keeps the commerce screen for an admin', () => {
    auth.canModerate = true;
    mount();
    expect(container?.textContent).toContain('commerce-admin');
    expect(container?.querySelector('[data-redirect]')).toBeNull();
  });
});

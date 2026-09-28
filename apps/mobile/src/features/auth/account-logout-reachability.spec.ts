/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  logout: vi.fn<() => Promise<void>>(),
  replace: vi.fn(),
  push: vi.fn(),
  getMyProfile: vi.fn(),
  listCabinetWorks: vi.fn(),
  listSellerProfiles: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Image: () => null,
  ScrollView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-image', () => ({
  Image: () => null,
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    replace: harness.replace,
    push: harness.push,
  }),
  Link: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isAdmin: false,
    logout: harness.logout,
    refreshSession: vi.fn(),
    user: {
      email: 'author@example.com',
      emailVerifiedAt: '2026-09-27T00:00:00.000Z',
      role: 'user',
    },
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    sellers: { getMyProfile: harness.getMyProfile },
    portfolio: { listCabinetWorks: harness.listCabinetWorks },
    admin: { listSellerProfiles: harness.listSellerProfiles },
    auth: {
      requestEmailVerification: vi.fn(),
      verifyEmailVerification: vi.fn(),
    },
  }),
}));

vi.mock('../../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  FormPageShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/shared/InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: ({ status }: { status: string }) =>
    createElement('div', null, status),
}));

vi.mock('../../components/ui', () => {
  function PressButton({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) {
    return createElement(
      'button',
      {
        type: 'button',
        disabled: Boolean(disabled),
        onClick: () => {
          if (!disabled) onPress?.();
        },
      },
      label,
    );
  }

  return {
    AppDialog: ({ open, children }: { open: boolean; children?: ReactNode }) =>
      (open ? createElement('div', { role: 'dialog' }, children) : null),
    AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
    DestructiveButton: PressButton,
    FormSection: ({ children }: { children?: ReactNode }) => createElement('section', null, children),
    ImagePlaceholder: () => null,
    PageHeader: ({ title }: { title: string }) => createElement('h1', null, title),
    PageState: ({ title }: { title: string }) => createElement('p', null, title),
    PrimaryButton: PressButton,
    ResilientRemoteImage: () => null,
    SecondaryButton: PressButton,
    TextButton: PressButton,
    TextField: () => createElement('input'),
  };
});

import { VerifyEmailForm } from './verify-email-form';
import { AdminModerationScreen } from '../admin/admin-moderation-screen';
import { AuthorCabinetScreen } from '../sellers/author-cabinet-screen';

function seller(status: 'APPROVED' | 'SUSPENDED') {
  return {
    sellerProfile: {
      id: '11111111-1111-4111-8111-111111111111',
      status,
      fullName: 'Author Name',
      slug: 'author',
    },
    editingRevision: null,
  };
}

function mount(node: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(createElement(QueryClientProvider, { client: queryClient }, node));
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

async function until(container: HTMLElement, marker: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (container.textContent?.includes(marker)) return;
    await flush();
  }
  throw new Error(`Timed out waiting for ${marker}. Body: ${container.textContent}`);
}

afterEach(() => {
  document.body.replaceChildren();
  harness.logout.mockReset();
  harness.replace.mockReset();
  harness.push.mockReset();
  harness.getMyProfile.mockReset();
  harness.listCabinetWorks.mockReset();
  harness.listSellerProfiles.mockReset();
});

describe('account logout reachability', () => {
  it('shows logout in the approved author cabinet', async () => {
    harness.getMyProfile.mockResolvedValue(seller('APPROVED'));
    harness.listCabinetWorks.mockResolvedValue({
      works: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    const view = mount(createElement(AuthorCabinetScreen));
    await until(view.container, 'Кабинет автора');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Выйти')).toBe(true);
    view.unmount();
  });

  it('shows logout in the suspended author cabinet', async () => {
    harness.getMyProfile.mockResolvedValue(seller('SUSPENDED'));
    harness.listCabinetWorks.mockResolvedValue({
      works: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    const view = mount(createElement(AuthorCabinetScreen));
    await until(view.container, 'Профиль ограничен');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Выйти')).toBe(true);
    view.unmount();
  });

  it('shows logout on the admin moderation destination', async () => {
    harness.listSellerProfiles.mockResolvedValue({ sellerProfiles: [] });
    const view = mount(createElement(AdminModerationScreen));
    await until(view.container, 'Модерация');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Выйти')).toBe(true);
    view.unmount();
  });

  it('shows logout on the email verification destination', async () => {
    const view = mount(
      createElement(VerifyEmailForm, { redirectTo: '/profile', autoRequest: false }),
    );
    await until(view.container, 'Подтвердите email');
    expect([...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Выйти')).toBe(true);
    view.unmount();
  });
});

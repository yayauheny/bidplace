/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ApiClientError } from '@bidplace/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  params: {} as { intro?: string; step?: string },
  logout: vi.fn<() => Promise<void>>(),
  replace: vi.fn(),
  push: vi.fn(),
  setParams: vi.fn(),
  getMyProfile: vi.fn(),
  updateProfile: vi.fn(),
  createProfile: vi.fn(),
  getAuthorApplicationPhoto: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Image: () => null,
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    replace: harness.replace,
    push: harness.push,
    setParams: harness.setParams,
  }),
  useLocalSearchParams: () => harness.params,
  Link: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: harness.launchImageLibraryAsync,
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isAdmin: false,
    logout: harness.logout,
    user: {
      email: 'author@example.com',
      emailVerifiedAt: '2026-09-27T00:00:00.000Z',
      role: 'user',
    },
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    sellers: {
      getMyProfile: harness.getMyProfile,
      updateProfile: harness.updateProfile,
      createProfile: harness.createProfile,
    },
    portfolio: {
      getAuthorApplicationPhoto: harness.getAuthorApplicationPhoto,
      advanceAuthorApplication: vi.fn(),
      submitAuthorApplication: vi.fn(),
    },
  }),
}));

vi.mock('../../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  FormPageShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  FormPageColumns: ({
    children,
    sidebar,
  }: {
    children?: ReactNode;
    sidebar?: ReactNode;
  }) => createElement('div', null, sidebar, children),
}));

vi.mock('../../components/shared/InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: ({ status }: { status: string }) =>
    createElement('div', null, status),
}));

vi.mock('./AuthorApplicationAchievements', () => ({
  AuthorApplicationAchievements: () => null,
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
    AppDialog: ({
      open,
      title,
      children,
    }: {
      open: boolean;
      title: string;
      children?: ReactNode;
    }) => (open ? createElement('div', { role: 'dialog', 'aria-label': title }, children) : null),
    AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
    FormSection: ({ children }: { children?: ReactNode }) => createElement('section', null, children),
    ImagePlaceholder: () => null,
    PageHeader: ({ title }: { title: string }) => createElement('h1', null, title),
    PrimaryButton: PressButton,
    SecondaryButton: PressButton,
    ResilientRemoteImage: () => null,
    TextField: ({
      label,
      value,
      onChangeText,
    }: {
      label: string;
      value?: string;
      onChangeText?: (value: string) => void;
    }) =>
      createElement('input', {
        'aria-label': label,
        value: value ?? '',
        onChange: (event: { target: { value: string } }) => onChangeText?.(event.target.value),
      }),
  };
});

import { SellerProfileScreen } from './seller-profile-screen';

function profile(status: string) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'author',
    fullName: 'Author Name',
    discipline: 'Painting',
    country: 'BY',
    city: 'Minsk',
    practice: null,
    socialLink: null,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    publicEmail: null,
    shortDescription: 'Short description',
    status,
    profilePhotoUrl: '/photo.png',
    updatedAt: '2026-09-27T00:00:00.000Z',
    applicationStage: 'ACHIEVEMENTS',
  };
}

function mount() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(QueryClientProvider, { client: queryClient }, createElement(SellerProfileScreen)),
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

async function until(container: HTMLElement, predicate: () => boolean, label: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (predicate()) return;
    await flush();
  }
  throw new Error(`Timed out waiting for ${label}. Body: ${container.textContent}`);
}

function click(container: ParentNode, label: string) {
  const target = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === label,
  );
  if (!target) throw new Error(`Missing button ${label}`);
  act(() => {
    target.click();
  });
}

function dialog(container: ParentNode) {
  return container.querySelector('[role="dialog"]');
}

function setCity(container: ParentNode, value: string) {
  const input = container.querySelector('[aria-label="Город"]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Missing city field');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

beforeEach(() => {
  harness.params = {};
  harness.logout.mockReset();
  harness.replace.mockReset();
  harness.push.mockReset();
  harness.setParams.mockReset();
  harness.getMyProfile.mockReset();
  harness.updateProfile.mockReset();
  harness.createProfile.mockReset();
  harness.getAuthorApplicationPhoto.mockReset();
  harness.launchImageLibraryAsync.mockReset();
  harness.logout.mockResolvedValue(undefined);
  harness.getAuthorApplicationPhoto.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  harness.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
  harness.getMyProfile.mockResolvedValue({
    sellerProfile: profile('APPROVED'),
    editingRevision: null,
  });
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('seller profile logout', () => {
  it('does not logout immediately when the profile is dirty and opens the existing exit guard', async () => {
    const view = mount();
    await until(view.container, () => view.container.querySelector('[aria-label="Город"]') instanceof HTMLInputElement, 'city field');
    setCity(view.container, 'Hrodna');
    click(view.container, 'Выйти');
    expect(harness.logout).not.toHaveBeenCalled();
    expect(dialog(view.container)?.getAttribute('aria-label')).toBe('Выйти из заявки?');
    view.unmount();
  });

  it('does not logout immediately when only the photo changed', async () => {
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:photo' }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => new Blob(['photo']) })),
    );
    const view = mount();
    await until(
      view.container,
      () => [...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Изменить фото'),
      'photo button',
    );
    click(view.container, 'Изменить фото');
    await flush();
    await flush();
    click(view.container, 'Выйти');
    expect(harness.logout).not.toHaveBeenCalled();
    expect(dialog(view.container)?.getAttribute('aria-label')).toBe('Выйти из заявки?');
    view.unmount();
  });

  it('does not logout when the author continues filling the form', async () => {
    const view = mount();
    await until(view.container, () => view.container.querySelector('[aria-label="Город"]') instanceof HTMLInputElement, 'city field');
    setCity(view.container, 'Hrodna');
    click(view.container, 'Выйти');
    click(view.container, 'Продолжить заполнение');
    expect(harness.logout).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(dialog(view.container)).toBeNull();
    expect(view.container.querySelector('[aria-label="Город"]')).not.toBeNull();
    view.unmount();
  });

  it('saves, then logs out, then replaces home after the exit guard is confirmed', async () => {
    const order: string[] = [];
    harness.updateProfile.mockImplementation(async () => {
      order.push('save');
      return { sellerProfile: profile('APPROVED'), editingRevision: null };
    });
    harness.logout.mockImplementation(async () => {
      order.push('logout');
    });
    harness.replace.mockImplementation((path: string) => {
      order.push(`replace:${path}`);
    });
    const view = mount();
    await until(view.container, () => view.container.querySelector('[aria-label="Город"]') instanceof HTMLInputElement, 'city field');
    setCity(view.container, 'Hrodna');
    click(view.container, 'Выйти');
    click(view.container, 'Сохранить и выйти');
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (order.includes('replace:/')) break;
      await flush();
    }
    expect(order).toEqual(['save', 'logout', 'replace:/']);
    view.unmount();
  });

  it('stays on the form and does not logout when saving fails', async () => {
    harness.updateProfile.mockRejectedValue(new Error('save failed'));
    const view = mount();
    await until(view.container, () => view.container.querySelector('[aria-label="Город"]') instanceof HTMLInputElement, 'city field');
    setCity(view.container, 'Hrodna');
    click(view.container, 'Выйти');
    click(view.container, 'Сохранить и выйти');
    await flush();
    await flush();
    expect(harness.logout).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(dialog(view.container)?.getAttribute('aria-label')).toBe('Выйти из заявки?');
    expect(view.container.textContent).toContain('Не удалось сохранить профиль');
    expect(view.container.querySelector('[aria-label="Город"]')).not.toBeNull();
    view.unmount();
  });

  it('logs out directly when the profile is clean', async () => {
    const view = mount();
    await until(view.container, () => view.container.querySelector('[aria-label="Город"]') instanceof HTMLInputElement, 'city field');
    click(view.container, 'Выйти');
    await flush();
    expect(dialog(view.container)).toBeNull();
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.logout).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith('/');
    view.unmount();
  });

  it('keeps a clean close on the home path without logout', async () => {
    harness.getMyProfile.mockResolvedValue({
      sellerProfile: profile('DRAFT'),
      editingRevision: { status: 'DRAFT', updatedAt: '2026-09-27T00:00:00.000Z' },
    });
    const view = mount();
    await until(
      view.container,
      () => [...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Закрыть'),
      'close button',
    );
    click(view.container, 'Закрыть');
    expect(harness.logout).not.toHaveBeenCalled();
    expect(harness.replace).toHaveBeenCalledWith('/');
    view.unmount();
  });

  it('shows logout for a missing profile, a draft, and a profile in review', async () => {
    harness.params = { intro: '1' };
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    const missing = mount();
    await until(
      missing.container,
      () => dialog(missing.container)?.getAttribute('aria-label') === 'Стать автором на Bidplace',
      'intro dialog',
    );
    expect([...missing.container.querySelectorAll('button')].some((button) => button.textContent === 'Выйти')).toBe(true);
    missing.unmount();

    harness.params = {};
    harness.getMyProfile.mockResolvedValue({
      sellerProfile: profile('DRAFT'),
      editingRevision: { status: 'DRAFT', updatedAt: '2026-09-27T00:00:00.000Z' },
    });
    const draft = mount();
    await until(
      draft.container,
      () => [...draft.container.querySelectorAll('button')].some((button) => button.textContent === 'Закрыть'),
      'draft logout',
    );
    expect([...draft.container.querySelectorAll('button')].some((button) => button.textContent === 'Выйти')).toBe(true);
    draft.unmount();

    harness.getMyProfile.mockResolvedValue({
      sellerProfile: profile('PENDING_REVIEW'),
      editingRevision: null,
    });
    const pending = mount();
    await until(
      pending.container,
      () => pending.container.textContent?.includes('Сейчас профиль нельзя редактировать.') === true,
      'pending profile',
    );
    expect([...pending.container.querySelectorAll('button')].some((button) => button.textContent === 'Выйти')).toBe(true);
    pending.unmount();
  });
});

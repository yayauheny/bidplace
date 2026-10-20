/**
 * @vitest-environment jsdom
 *
 * AC-07: account consumer-регрессии — identity/ошибки/действия кабинета
 * против реального AccountScreen. Session-switch/guard-семантика кэша
 * покрыта author-cabinet-work-cache и не дублируется здесь.
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';
import { lightColorMap } from '@bidplace/design-tokens';

import { flush } from '../../testing/dom';
import { publicAuthorKeys, useAuthorWorks } from '../sellers/use-author-works';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const productId = '11111111-1111-4111-8111-111111111111';
const notFound = () =>
  new ApiClientError('Seller profile not found', {
    kind: 'not_found',
    status: 404,
  });

const harness = vi.hoisted(() => ({
  getMyProfile: vi.fn(),
  listCabinetWorks: vi.fn(),
  getAuthor: vi.fn(),
  hideWork: vi.fn(),
  unhideWork: vi.fn(),
  auth: {
    isAuthenticated: true,
    isAdmin: false,
    logout: vi.fn(),
    user: {
      email: 'account@example.com',
      emailVerifiedAt: '2026-09-27T00:00:00.000Z',
      role: 'user',
      displayName: 'Account User',
      slug: 'account-user',
    },
  },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({
    children,
    style,
  }: {
    children?: ReactNode;
    style?: { backgroundColor?: string } & Record<string, unknown>;
  }) =>
    createElement(
      'div',
      { style, 'data-bg': style?.backgroundColor },
      children,
    ),
  ActivityIndicator: () => null,
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
  }: {
    children?: ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
  }) =>
    createElement(
      'button',
      { type: 'button', onClick: onPress, 'aria-label': accessibilityLabel },
      children,
    ),
  StyleSheet: {
    create: (styles: unknown) => styles,
    flatten: (style: unknown) => style,
    compose: (a: unknown) => a,
    absoluteFill: {},
  },
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    setParams: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
  }),
  Link: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('expo-image', () => ({
  Image: () => null,
}));

vi.mock('react-native-svg', () => {
  const shape = ({ children }: { children?: ReactNode }) =>
    createElement('svg', null, children);
  return {
    default: shape,
    Svg: shape,
    SvgXml: shape,
    Circle: shape,
    Ellipse: shape,
    G: shape,
    Line: shape,
    Path: shape,
    Rect: shape,
  };
});

vi.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));

vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => harness.auth,
}));

vi.mock('../../providers/theme-provider', () => ({
  useAppTheme: () => lightColorMap,
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    sellers: { getMyProfile: harness.getMyProfile },
    portfolio: {
      listCabinetWorks: harness.listCabinetWorks,
      getAuthor: harness.getAuthor,
      hideWork: harness.hideWork,
      unhideWork: harness.unhideWork,
    },
  }),
}));

vi.mock('../../components/layout', () => ({
  FormPageShell: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('../../components/shared/InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: ({ status }: { status: string }) =>
    createElement(
      'div',
      null,
      status === 'loading' ? 'Загрузка…' : 'Ошибка загрузки',
    ),
}));

vi.mock('../../components/ui', () => {
  function PressButton({
    label,
    onPress,
    disabled,
    loading,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) {
    return createElement(
      'button',
      {
        type: 'button',
        disabled: Boolean(disabled || loading),
        onClick: () => {
          if (!disabled && !loading) onPress?.();
        },
      },
      label,
    );
  }
  return {
    AppDialog: ({
      open,
      title,
      description,
      children,
    }: {
      open: boolean;
      title: string;
      description?: string;
      children?: ReactNode;
    }) =>
      open
        ? createElement(
            'div',
            { role: 'dialog' },
            title,
            description,
            children,
          )
        : null,
    AppText: ({ children }: { children?: ReactNode }) =>
      createElement('span', null, children),
    PageState: ({ title, message }: { title: string; message: string }) =>
      createElement('div', null, title, message),
    ImagePlaceholder: ({ label }: { label: string }) =>
      createElement('div', null, label),
    PrimaryButton: PressButton,
    SecondaryButton: PressButton,
  };
});

vi.mock('../../components/ui/AppText', () => ({
  AppText: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
}));

vi.mock('../../components/ui/ResilientRemoteImage', () => ({
  ResilientRemoteImage: ({ accessibilityLabel }: { accessibilityLabel?: string }) =>
    createElement('div', { 'data-remote-image': accessibilityLabel ?? '' }),
}));

vi.mock('../../components/figma/BackButton', () => ({
  BackButton: ({ onPress, label = 'Назад' }: { onPress: () => void; label?: string }) =>
    createElement('button', { type: 'button', onClick: onPress }, label),
}));

vi.mock('../../components/figma/FigmaButton', () => ({
  FigmaButton: ({ label, href }: { label: string; href?: string }) =>
    createElement(
      href ? 'a' : 'button',
      href ? { href } : { type: 'button' },
      label,
    ),
}));

vi.mock('../../components/figma/FigmaIconButton', () => ({
  FigmaIconButton: ({ label, onPress }: { label: string; onPress?: () => void }) =>
    createElement(
      'button',
      { type: 'button', 'aria-label': label, onClick: onPress },
      label,
    ),
}));

vi.mock('../../components/figma/WorkCoverCard', () => ({
  WorkCoverCard: ({
    title,
    authorLabel,
  }: {
    title: string;
    authorLabel?: string;
  }) => createElement('div', { 'data-cover': title }, title, authorLabel),
  WorkCoverCaption: ({ author, title }: { author: string; title: string }) =>
    createElement('div', null, `${author} — ${title}`),
}));

vi.mock('../auth/AccountLogoutButton', () => ({
  AccountLogoutButton: () =>
    createElement('button', { type: 'button' }, 'Выйти'),
}));

vi.mock('../sellers/AuthorShare', () => ({
  AuthorShare: ({ sharePath }: { sharePath: string }) =>
    createElement(
      'button',
      { type: 'button', 'aria-label': 'Поделиться профилем', 'data-share-path': sharePath },
      'Поделиться профилем',
    ),
}));

import { AccountScreen } from './account-screen';

const sellerProfile = (status: string, fullName = 'Editing Name B') => ({
  sellerProfile: {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'owner-a',
    fullName,
    status,
    updatedAt: '2026-09-27T00:00:00.000Z',
  },
  editingRevision: null,
});

const publicAuthor = (overrides: Record<string, unknown> = {}) => ({
  id: '66666666-6666-4666-8666-666666666666',
  slug: 'owner-a',
  fullName: 'Public Name A',
  country: 'Россия',
  city: null,
  discipline: null,
  directionCategoryIds: [],
  directions: [],
  practice: null,
  biography: null,
  profilePhotoUrl: '/api/sellers/owner-a/photo',
  telegramUrl: null,
  instagramUrl: null,
  websiteUrl: null,
  publicEmail: null,
  shortDescription: 'Короткое описание',
  achievements: [],
  sharePath: '/authors/owner-a',
  ...overrides,
});

const authorPage = (author: ReturnType<typeof publicAuthor>) => ({
  author,
  works: [],
  pagination: { page: 1, limit: 20, total: 0 },
});

const cabinetWork = (status: string, overrides: Record<string, unknown> = {}) => ({
  id: productId,
  publicId: 'work00000a1',
  title: 'Work title',
  status,
  editingRevisionStatus: null,
  updatedAt: '2026-09-27T00:00:00.000Z',
  moderationMessage: null,
  coverImage: {
    id: '55555555-5555-4555-8555-555555555555',
    position: 0,
    url: '/api/images/55555555-5555-4555-8555-555555555555',
    mimeType: 'image/png',
    byteLength: 4,
    checksum: 'a'.repeat(64),
    width: null,
    height: null,
  },
  ...overrides,
});

function PublicAuthorProbe() {
  const query = useAuthorWorks('owner-a', 'newest');
  const author = query.data?.pages[0]?.author;
  return createElement('div', { 'data-probe-author': author?.fullName ?? '' });
}

// Owner-query probe: читает тот же кэш продавца, что capability экрана.
function CapabilityProbe() {
  const query = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => harness.getMyProfile(),
  });
  return createElement('div', {
    'data-probe-capability': query.data?.sellerProfile?.status ?? '',
  });
}

function mount(extra: ReactNode = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(['user', 'me'], { id: 'user-a' });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(AccountScreen),
        extra,
      ),
    );
  });
  return {
    container,
    queryClient,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function until(
  container: HTMLElement,
  predicate: () => boolean,
  label: string,
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await flush();
  }
  throw new Error(
    `Timed out waiting for ${label}. Body: ${container.textContent}`,
  );
}

function buttons(container: HTMLElement) {
  return [...container.querySelectorAll('button')];
}

function clickButton(container: HTMLElement, match: string, scope?: HTMLElement) {
  const target = (scope ?? container);
  const button = buttons(target as HTMLElement).find(
    (item) => item.textContent === match || item.getAttribute('aria-label') === match,
  );
  expect(button, `button "${match}"`).toBeTruthy();
  act(() => button?.click());
}

beforeEach(() => {
  harness.getMyProfile.mockReset();
  harness.listCabinetWorks.mockReset();
  harness.getAuthor.mockReset();
  harness.hideWork.mockReset();
  harness.unhideWork.mockReset();
  harness.auth.user = {
    email: 'account@example.com',
    emailVerifiedAt: '2026-09-27T00:00:00.000Z',
    role: 'user',
    displayName: 'Account User',
    slug: 'account-user',
  };
  harness.listCabinetWorks.mockResolvedValue({
    works: [cabinetWork('APPROVED')],
    pagination: { page: 1, limit: 20, total: 1 },
  });
  harness.getAuthor.mockResolvedValue(authorPage(publicAuthor()));
  harness.hideWork.mockResolvedValue(undefined);
  harness.unhideWork.mockResolvedValue(undefined);
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('account screen consumers', () => {
  it('plain account: identity from the account, author CTA, no works section', async () => {
    harness.getMyProfile.mockRejectedValue(notFound());
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Стать автором') === true,
      'account identity',
    );
    expect(view.container.textContent).toContain('Account User');
    expect(view.container.textContent).toContain('@account-user');
    expect(view.container.textContent).not.toContain('Работы');
    expect(harness.getAuthor).not.toHaveBeenCalled();
    // Share/settings actions доступны; share — typed public path от slug аккаунта.
    const share = buttons(view.container).find(
      (item) => item.getAttribute('aria-label') === 'Поделиться профилем',
    );
    expect(share).toBeTruthy();
    expect(share?.getAttribute('data-share-path')).toBe('/authors/account-user');
    expect(
      buttons(view.container).some(
        (item) => item.getAttribute('aria-label') === 'Настройки',
      ),
    ).toBe(true);
    view.unmount();
  });

  it('approved: published identity A wins over editing overlay B', async () => {
    harness.getMyProfile.mockResolvedValue(sellerProfile('APPROVED'));
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Public Name A') === true,
      'published identity',
    );
    expect(view.container.textContent).toContain('@owner-a');
    expect(view.container.textContent).not.toContain('Editing Name B');
    expect(view.container.textContent).toContain('Создать работу');
    // Фото берётся из публичного author, не из owner profile.
    expect(
      view.container.querySelector('[data-remote-image]')?.getAttribute('data-remote-image'),
    ).toBe('Фото профиля: Public Name A');
    expect(harness.getAuthor).toHaveBeenCalledWith(
      'owner-a',
      expect.objectContaining({ sort: 'newest' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    view.unmount();
  });

  it('shares one public-author request with the author screen observer', async () => {
    harness.getMyProfile.mockResolvedValue(sellerProfile('APPROVED'));
    const view = mount(createElement(PublicAuthorProbe));
    await until(
      view.container,
      () =>
        view.container.querySelector('[data-probe-author]')?.getAttribute(
          'data-probe-author',
        ) === 'Public Name A',
      'shared author query',
    );
    expect(harness.getAuthor.mock.calls.length).toBe(1);
    expect(
      view.queryClient.getQueryData(publicAuthorKeys.detail('owner-a', 'newest')),
    ).toBeTruthy();
    view.unmount();
  });

  it('identity error: local retry, cabinet keeps working', async () => {
    harness.getMyProfile.mockResolvedValue(sellerProfile('APPROVED'));
    harness.getAuthor.mockRejectedValue(notFound());
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Не удалось загрузить профиль') ===
        true,
      'identity error',
    );
    // Кабинет ниже identity живёт.
    expect(view.container.textContent).toContain('Work title');
    const calls = harness.getAuthor.mock.calls.length;
    clickButton(view.container, 'Повторить');
    await until(
      view.container,
      () => harness.getAuthor.mock.calls.length > calls,
      'identity refetch',
    );
    view.unmount();
  });

  it('suspended: cached public identity is not shown, works are read-only', async () => {
    harness.getMyProfile.mockResolvedValue(sellerProfile('SUSPENDED'));
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Профиль ограничен') === true,
      'suspended state',
    );
    expect(harness.getAuthor).not.toHaveBeenCalled();
    expect(view.container.textContent).not.toContain('Public Name A');
    expect(view.container.textContent).toContain('Account User');
    expect(view.container.textContent).toContain('Work title');
    expect(
      buttons(view.container).some((item) => item.textContent === 'Скрыть'),
    ).toBe(false);
    expect(
      buttons(view.container).some(
        (item) => item.textContent === 'Вернуть в профиль',
      ),
    ).toBe(false);
    view.unmount();
  });

  it('failed hide keeps the dialog open with an in-dialog retry', async () => {
    harness.getMyProfile.mockResolvedValue(sellerProfile('APPROVED'));
    harness.hideWork.mockRejectedValue(new Error('network'));
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Work title') === true,
      'cabinet works',
    );
    clickButton(view.container, 'Скрыть');
    await until(
      view.container,
      () => view.container.textContent?.includes('Скрыть работу?') === true,
      'hide dialog',
    );
    clickButton(view.container, 'Скрыть', view.container.querySelector('[role="dialog"]') as HTMLElement);
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Не удалось скрыть работу') === true,
      'hide error',
    );
    expect(harness.hideWork).toHaveBeenCalledTimes(1);
    const dialog = view.container.querySelector('[role="dialog"]') as HTMLElement;
    clickButton(dialog, 'Повторить');
    await until(
      view.container,
      () => harness.hideWork.mock.calls.length === 2,
      'hide retry',
    );
    expect(view.container.textContent).toContain('Не удалось скрыть работу');
    view.unmount();
  });

  it('failed restore surfaces an inline error with a retry of the same attempt', async () => {
    harness.getMyProfile.mockResolvedValue(sellerProfile('APPROVED'));
    harness.listCabinetWorks.mockResolvedValue({
      works: [cabinetWork('ARCHIVED')],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    harness.unhideWork.mockRejectedValue(new Error('network'));
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Work title') === true,
      'cabinet works',
    );
    clickButton(view.container, 'Вернуть в профиль');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes(
          'Не удалось изменить видимость работы',
        ) === true,
      'restore error',
    );
    expect(harness.unhideWork).toHaveBeenCalledTimes(1);
    expect(
      view.container.querySelector('[role="dialog"]'),
    ).toBeNull();
    clickButton(view.container, 'Повторить');
    await until(
      view.container,
      () => harness.unhideWork.mock.calls.length === 2,
      'restore retry',
    );
    expect(view.container.textContent).toContain('Work title');
    view.unmount();
  });

  it('next-page failure keeps the works and offers an inline retry', async () => {
    harness.getMyProfile.mockResolvedValue(sellerProfile('APPROVED'));
    let pageTwoCalls = 0;
    harness.listCabinetWorks.mockImplementation(
      async ({ page }: { page: number }) => {
        if (page === 1) {
          return {
            works: [cabinetWork('APPROVED')],
            pagination: { page: 1, limit: 20, total: 21 },
          };
        }
        pageTwoCalls += 1;
        if (pageTwoCalls === 1) throw new Error('network');
        return {
          works: [
            cabinetWork('APPROVED', {
              id: '22222222-2222-4222-8222-222222222222',
              publicId: 'work00000b2',
              title: 'Second work',
            }),
          ],
          pagination: { page: 2, limit: 20, total: 2 },
        };
      },
    );
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Показать ещё') === true,
      'next page button',
    );
    clickButton(view.container, 'Показать ещё');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes(
          'Не удалось загрузить следующие работы',
        ) === true,
      'next page error',
    );
    // Данные первой страницы сохранились.
    expect(view.container.textContent).toContain('Work title');
    clickButton(view.container, 'Повторить');
    await until(
      view.container,
      () => view.container.textContent?.includes('Second work') === true,
      'next page retry',
    );
    expect(harness.listCabinetWorks.mock.calls.length).toBe(3);
    view.unmount();
  });

  it('keeps one capability request shared with other owner observers', async () => {
    harness.getMyProfile.mockRejectedValue(notFound());
    const view = mount(createElement(CapabilityProbe));
    await until(
      view.container,
      () =>
        harness.getMyProfile.mock.calls.length === 1 &&
        view.container
          .querySelector('[data-probe-capability]')
          ?.getAttribute('data-probe-capability') === '',
      'capability observer',
    );
    expect(harness.getMyProfile.mock.calls.length).toBe(1);
    view.unmount();
  });
});

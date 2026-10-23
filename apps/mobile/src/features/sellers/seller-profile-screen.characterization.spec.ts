/**
 * @vitest-environment jsdom
 *
 * Characterization contract for SellerProfileScreen — Wave 3 split.
 *
 * Pins the DOM-level wiring per state (which step renders, which actions are
 * visible) so a mechanical file split cannot silently break the render
 * plumbing. Behavior (save/submit/race flows) is covered by
 * seller-profile-submit.spec.ts — do not duplicate it here; keep this file
 * lean and extend it only when the render contract itself changes.
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import '../../testing/author-application-mocks';

import { flush } from '../../testing/dom';
import { authKeys } from '../../lib/query-cache';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  params: {} as { intro?: string; step?: string },
  focused: true,
  authSlug: null as string | null,
  logout: vi.fn<() => Promise<void>>(),
  replace: vi.fn(),
  push: vi.fn(),
  setParams: vi.fn(),
  getMyProfile: vi.fn(),
  updateProfile: vi.fn(),
  createProfile: vi.fn(),
  claimSlug: vi.fn(),
  getAuthorApplicationPhoto: vi.fn(),
  advanceAuthorApplication: vi.fn(),
  submitAuthorApplication: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  Image: () => null,
  Pressable: ({
    children,
    onPress,
    disabled,
  }: {
    children?: ReactNode;
    onPress?: () => void;
    disabled?: boolean;
  }) =>
    createElement(
      'div',
      {
        onClick: () => {
          if (!disabled) onPress?.();
        },
      },
      children,
    ),
}));

vi.mock('expo-router', () => ({
  useIsFocused: () => harness.focused,
  useRouter: () => ({
    replace: harness.replace,
    push: harness.push,
    setParams: harness.setParams,
  }),
  usePathname: () => '/cabinet',
  useLocalSearchParams: () => harness.params,
  Link: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
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
      slug: harness.authSlug,
    },
  }),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    auth: {
      claimSlug: harness.claimSlug,
    },
    sellers: {
      getMyProfile: harness.getMyProfile,
      updateProfile: harness.updateProfile,
      createProfile: harness.createProfile,
    },
    portfolio: {
      getAuthorApplicationPhoto: harness.getAuthorApplicationPhoto,
      advanceAuthorApplication: harness.advanceAuthorApplication,
      submitAuthorApplication: harness.submitAuthorApplication,
    },
    categories: {
      list: vi.fn().mockResolvedValue({
        categories: [
          {
            id: '33333333-3333-4333-8333-333333333333',
            name: 'Керамика',
            slug: 'ceramics',
            description: null,
            active: true,
          },
        ],
      }),
    },
    countries: {
      list: vi.fn().mockResolvedValue({
        countries: [{ code: 'BY', name: 'Беларусь' }],
      }),
    },
  }),
}));

vi.mock('../../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  FormPageShell: ({
    children,
    bottomAction,
  }: {
    children?: ReactNode;
    bottomAction?: ReactNode;
  }) => createElement('div', null, children, bottomAction),
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

vi.mock('./author-application-basics-step', () => ({
  AuthorApplicationBasicsStep: ({
    closeDisabled,
    onClose,
    photo,
    fields,
    formAlert,
    action,
    footer,
  }: {
    closeDisabled: boolean;
    onClose: () => void;
    photo: {
      uri: string | null;
      failed: boolean;
      disabled: boolean;
      onChoose: () => void;
    };
    fields: ReactNode;
    formAlert: ReactNode;
    action: ReactNode;
    footer: ReactNode;
  }) =>
    createElement(
      'div',
      null,
      createElement('button', {
        type: 'button',
        'aria-label': 'Закрыть',
        disabled: closeDisabled,
        onClick: () => {
          if (!closeDisabled) onClose();
        },
      }),
      createElement(
        'button',
        {
          type: 'button',
          disabled: photo.disabled,
          onClick: () => {
            if (!photo.disabled) photo.onChoose();
          },
        },
        photo.uri && !photo.failed ? 'Изменить фото' : 'Загрузить фото',
      ),
      fields,
      formAlert,
      action,
      footer,
    ),
}));

vi.mock('./country-picker-sheet', () => ({
  CountryPickerSheet: () => null,
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
    }) =>
      open
        ? createElement(
            'div',
            { role: 'dialog', 'aria-label': title },
            children,
          )
        : null,
    AppText: ({ children }: { children?: ReactNode }) =>
      createElement('span', null, children),
    FormSection: ({
      children,
      title,
    }: {
      children?: ReactNode;
      title?: string;
    }) => createElement('section', null, title, children),
    ImagePlaceholder: () => null,
    PageHeader: ({ title }: { title: string }) =>
      createElement('h1', null, title),
    PrimaryButton: PressButton,
    SecondaryButton: PressButton,
    TextButton: PressButton,
    ResilientRemoteImage: () => null,
    TextField: ({
      label,
      value,
      editable = true,
      onChangeText,
    }: {
      label: string;
      value?: string;
      editable?: boolean;
      onChangeText?: (value: string) => void;
    }) =>
      createElement('input', {
        'aria-label': label,
        value: value ?? '',
        disabled: editable === false,
        onChange: (event: { target: { value: string } }) =>
          onChangeText?.(event.target.value),
      }),
  };
});

import { SellerProfileScreen } from './seller-profile-screen';

type Stage = 'CONTACTS' | 'ABOUT' | 'ACHIEVEMENTS' | null;

function profile(status: string, applicationStage: Stage = 'ACHIEVEMENTS') {
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
    directionCategoryIds: ['33333333-3333-4333-8333-333333333333'],
    directions: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Керамика',
        slug: 'ceramics',
        description: null,
        active: true,
      },
    ],
    status,
    profilePhotoUrl: '/photo.png',
    updatedAt: '2026-09-27T00:00:00.000Z',
    applicationStage,
  };
}

function revision(status: string) {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    version: 1,
    status,
    updatedAt: '2026-09-27T00:00:00.000Z',
  };
}

function response(parentStatus: string, revisionStatus: string, stage: Stage) {
  return {
    sellerProfile: profile(parentStatus, stage),
    editingRevision: revision(revisionStatus),
  };
}

function mount() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, {
    id: 'user-a',
    slug: null,
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  const render = () =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(SellerProfileScreen),
    );
  act(() => {
    root.render(render());
  });
  return {
    container,
    queryClient,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

async function until(
  container: HTMLElement,
  predicate: () => boolean,
  label: string,
) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (predicate()) return;
    await flush();
  }
  throw new Error(
    `Timed out waiting for ${label}. Body: ${container.textContent}`,
  );
}

function hasButton(container: ParentNode, label: string) {
  return [...container.querySelectorAll('button')].some(
    (button) =>
      button.textContent === label ||
      button.getAttribute('aria-label') === label,
  );
}

beforeEach(() => {
  harness.params = {};
  harness.focused = true;
  harness.authSlug = null;
  for (const mock of [
    harness.logout,
    harness.replace,
    harness.push,
    harness.setParams,
    harness.getMyProfile,
    harness.updateProfile,
    harness.createProfile,
    harness.claimSlug,
    harness.getAuthorApplicationPhoto,
    harness.advanceAuthorApplication,
    harness.submitAuthorApplication,
    harness.launchImageLibraryAsync,
  ]) {
    mock.mockReset();
  }
  harness.logout.mockResolvedValue(undefined);
  harness.getAuthorApplicationPhoto.mockResolvedValue(
    new Blob(['png'], { type: 'image/png' }),
  );
  harness.launchImageLibraryAsync.mockResolvedValue({
    canceled: true,
    assets: [],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('SellerProfileScreen render contract', () => {
  it('renders the infrastructure loading status while the profile is pending', async () => {
    harness.getMyProfile.mockReturnValue(new Promise(() => undefined));
    const { container } = mount();
    await until(
      container,
      () => container.textContent?.includes('loading') ?? false,
      'loading status',
    );
  });

  it('waits for a cold existing profile before choosing the initial UI step', async () => {
    let finish: (value: ReturnType<typeof response>) => void = () => undefined;
    harness.getMyProfile.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const view = mount();
    await flush();
    expect(harness.setParams).not.toHaveBeenCalledWith({ step: 'photo' });
    const saved = response('DRAFT', 'DRAFT', 'ABOUT');
    await act(async () => {
      finish(saved);
      await Promise.resolve();
    });
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Раскройте себя как автора') ===
        true,
      'server resume',
    );
    expect(harness.setParams).not.toHaveBeenCalledWith({ step: 'photo' });
    view.unmount();
  });

  it('starts the application wizard at step 1 when the profile is missing', async () => {
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    const { container } = mount();
    await until(
      container,
      () => hasButton(container, 'Загрузить фото'),
      'wizard step 1',
    );
    expect(hasButton(container, 'Продолжить')).toBe(true);
    expect(hasButton(container, 'Назад')).toBe(false);
    expect(hasButton(container, 'Сохранить и завершить')).toBe(false);
  });

  it('shows the infrastructure error state when a refetch fails over the cached absence', async () => {
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    const { container, queryClient } = mount();
    await until(
      container,
      () => hasButton(container, 'Загрузить фото'),
      'wizard step 1 after absence',
    );

    // The cached null stays in the cache while the refetch errors out; the
    // current error must outrank the stale absence.
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('network down', { kind: 'network', status: 0 }),
    );
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
    });

    await until(
      container,
      () => container.textContent?.includes('error') ?? false,
      'infrastructure error state',
    );
    expect(hasButton(container, 'Загрузить фото')).toBe(false);
  });

  it.each([
    ['CONTACTS', 'Контакты'],
    ['ABOUT', 'Раскройте себя как автора'],
  ] as const)(
    'resumes the DRAFT wizard at the %s stage',
    async (stage, title) => {
      harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT', stage));
      const { container } = mount();
      await until(
        container,
        () => container.textContent?.includes(title) ?? false,
        `wizard stage ${stage}`,
      );
      expect(hasButton(container, 'Назад')).toBe(true);
      expect(hasButton(container, 'Загрузить фото')).toBe(false);
      expect(hasButton(container, 'Сохранить и завершить')).toBe(false);
    },
  );

  it('shows the achievements finish action at the ACHIEVEMENTS stage', async () => {
    harness.getMyProfile.mockResolvedValue(
      response('DRAFT', 'DRAFT', 'ACHIEVEMENTS'),
    );
    const { container } = mount();
    await until(
      container,
      () => container.textContent?.includes('Биография и достижения') ?? false,
      'wizard achievements step',
    );
    expect(hasButton(container, 'Сохранить и завершить')).toBe(true);
    expect(hasButton(container, 'Назад')).toBe(true);
  });

  it('clamps an out-of-reach ?step param to the resumable step', async () => {
    harness.params = { step: '4' };
    harness.getMyProfile.mockResolvedValue(
      response('DRAFT', 'DRAFT', 'CONTACTS'),
    );
    const { container } = mount();
    await until(
      container,
      () => container.textContent?.includes('Контакты') ?? false,
      'clamped wizard step',
    );
    expect(harness.setParams).toHaveBeenCalledWith({ step: '2' });
    expect(hasButton(container, 'Сохранить и завершить')).toBe(false);
  });

  it('renders the editable cabinet with save, submit and create actions for APPROVED', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT', null));
    const { container } = mount();
    await until(
      container,
      () => hasButton(container, 'Создать предмет'),
      'approved cabinet',
    );
    expect(hasButton(container, 'Сохранить')).toBe(true);
    expect(hasButton(container, 'Отправить на проверку')).toBe(true);
    expect(hasButton(container, 'Назад')).toBe(false);
    expect(hasButton(container, 'Сохранить и завершить')).toBe(false);
  });

  it('locks the cabinet while the revision is pending review', async () => {
    harness.getMyProfile.mockResolvedValue(
      response('APPROVED', 'PENDING_REVIEW', null),
    );
    const { container } = mount();
    await until(
      container,
      () => container.textContent?.includes('Заявка на проверке') ?? false,
      'pending revision lock',
    );
    expect(hasButton(container, 'Отправить на проверку')).toBe(false);
    expect(hasButton(container, 'Сохранить')).toBe(false);
    expect(hasButton(container, 'Создать предмет')).toBe(true);
    expect(container.textContent).toContain(
      'Редактирование откроется, если модератор запросит правки.',
    );
  });
});

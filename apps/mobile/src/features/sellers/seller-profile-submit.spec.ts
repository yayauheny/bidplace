/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import '../../testing/author-application-mocks';

import { flush, inputValue, setInput } from '../../testing/dom';

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
  CountryPickerSheet: ({
    open,
    onSelect,
  }: {
    open: boolean;
    onSelect: (code: string) => void;
  }) =>
    open
      ? createElement(
          'button',
          { type: 'button', onClick: () => onSelect('BY') },
          'Беларусь',
        )
      : null,
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
      onBlur,
      error,
    }: {
      label: string;
      value?: string;
      editable?: boolean;
      onChangeText?: (value: string) => void;
      onBlur?: () => void;
      error?: string;
    }) =>
      createElement(
        'span',
        null,
        createElement('input', {
          'aria-label': label,
          value: value ?? '',
          disabled: editable === false,
          onChange: (event: { target: { value: string } }) =>
            onChangeText?.(event.target.value),
          onBlur: () => onBlur?.(),
        }),
        error
          ? createElement('span', { 'data-error-for': label }, error)
          : null,
      ),
  };
});

import {
  advanceAuthEpoch,
  authKeys,
  clearAuthenticatedSession,
} from '../../lib/query-cache';
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
    applicationStage: 'ACHIEVEMENTS',
  };
}

function revision(status: string, updatedAt = '2026-09-27T00:00:00.000Z') {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    version: 1,
    status,
    updatedAt,
  };
}

function response(
  parentStatus: string,
  revisionStatus: string,
  updatedAt?: string,
) {
  return {
    sellerProfile: profile(parentStatus),
    editingRevision: revision(revisionStatus, updatedAt),
  };
}

function submitResponse(
  parentStatus: string,
  revisionStatus: string,
  updatedAt = '2026-09-28T00:00:00.000Z',
) {
  return {
    application: {
      slug: 'author',
      fullName: 'Author Name',
      country: 'BY',
      city: 'Minsk',
      discipline: 'Painting',
      practice: null,
      shortDescription: 'Short description',
      status: parentStatus,
      applicationStage:
        parentStatus === 'PENDING_REVIEW' ? null : 'ACHIEVEMENTS',
    },
    editingRevision: revision(revisionStatus, updatedAt),
    achievements: [],
  };
}

function mount(sessionId = 'user-a', sessionSlug: string | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, {
    id: sessionId,
    slug: sessionSlug,
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
    rerender() {
      act(() => root.render(render()));
    },
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

function findButton(container: ParentNode, label: string) {
  // Matches the accessible name: visible text, or aria-label for icon-only controls.
  return [...container.querySelectorAll('button')].find(
    (button) =>
      button.textContent === label ||
      button.getAttribute('aria-label') === label,
  );
}

function click(container: ParentNode, label: string) {
  const target = findButton(container, label);
  if (!target) throw new Error(`Missing button ${label}`);
  act(() => {
    target.click();
  });
}

function selectCountry(container: ParentNode, countryName: string) {
  const field = container.querySelector('[aria-label="Страна"]');
  if (!(field instanceof HTMLElement)) throw new Error('Missing country field');
  act(() => {
    field.click();
  });
  click(container, countryName);
}

function clickInOneTurn(container: ParentNode, labels: string[]) {
  const targets = labels.map((label) => {
    const target = findButton(container, label);
    if (!target) throw new Error(`Missing button ${label}`);
    return target;
  });
  act(() => {
    for (const target of targets) target.click();
  });
}

function savedProfile(
  overrides: {
    city?: string;
    fullName?: string;
    discipline?: string;
    practice?: string;
  } = {},
) {
  return {
    sellerProfile: {
      ...profile('APPROVED'),
      city: overrides.city ?? 'Minsk',
      fullName: overrides.fullName ?? 'Author Name',
      discipline: overrides.discipline ?? 'Painting',
      practice: overrides.practice ?? null,
    },
    editingRevision: revision('DRAFT'),
  };
}

function blurField(container: ParentNode, label: string) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  if (!(input instanceof HTMLInputElement))
    throw new Error(`Missing field ${label}`);
  act(() => {
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
}

function fieldError(container: ParentNode, label: string) {
  return (
    [...container.querySelectorAll('[data-error-for]')].find(
      (node) => node.getAttribute('data-error-for') === label,
    )?.textContent ?? null
  );
}

function buttonDisabled(container: ParentNode, label: string) {
  const target = findButton(container, label);
  if (!(target instanceof HTMLButtonElement))
    throw new Error(`Missing button ${label}`);
  return target.disabled;
}

beforeEach(() => {
  harness.params = {};
  harness.focused = true;
  harness.authSlug = null;
  harness.logout.mockReset();
  harness.replace.mockReset();
  harness.push.mockReset();
  harness.setParams.mockReset();
  harness.getMyProfile.mockReset();
  harness.updateProfile.mockReset();
  harness.createProfile.mockReset();
  harness.claimSlug.mockReset();
  harness.getAuthorApplicationPhoto.mockReset();
  harness.advanceAuthorApplication.mockReset();
  harness.submitAuthorApplication.mockReset();
  harness.launchImageLibraryAsync.mockReset();
  harness.logout.mockResolvedValue(undefined);
  harness.getAuthorApplicationPhoto.mockResolvedValue(
    new Blob(['png'], { type: 'image/png' }),
  );
  harness.launchImageLibraryAsync.mockResolvedValue({
    canceled: true,
    assets: [],
  });
  harness.updateProfile.mockImplementation(async () =>
    response('APPROVED', 'DRAFT'),
  );
  harness.advanceAuthorApplication.mockResolvedValue({
    application: { applicationStage: 'ABOUT' },
  });
  harness.submitAuthorApplication.mockImplementation(async () =>
    submitResponse('APPROVED', 'PENDING_REVIEW'),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('seller profile revision submit', () => {
  it('shows an enabled submit action for an approved author with an editable revision', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit action',
    );
    expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(false);
    expect(findButton(view.container, 'Сохранить')).toBeTruthy();
    expect(findButton(view.container, 'Закрыть')).toBeUndefined();
    view.unmount();
  });

  it('hides submit and disables editing while the revision is pending', async () => {
    harness.getMyProfile.mockResolvedValue(
      response('APPROVED', 'PENDING_REVIEW'),
    );
    const view = mount();
    await until(
      view.container,
      () => view.container.textContent?.includes('Заявка на проверке') === true,
      'pending copy',
    );
    expect(findButton(view.container, 'Отправить на проверку')).toBeUndefined();
    expect(findButton(view.container, 'Сохранить')).toBeUndefined();
    const city = view.container.querySelector('[aria-label="Город"]');
    expect(city).toBeInstanceOf(HTMLInputElement);
    expect((city as HTMLInputElement).disabled).toBe(true);
    view.unmount();
  });

  it('keeps the pending lock copy visible in the wizard for a draft with a pending revision', async () => {
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'PENDING_REVIEW'));
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.textContent?.includes(
          'Заявка на проверке. Редактирование откроется',
        ) === true,
      'wizard pending lock copy',
    );
    expect(findButton(view.container, 'Сохранить и завершить')).toBeUndefined();
    view.unmount();
  });

  it.each(['CHANGES_REQUESTED', 'REJECTED'] as const)(
    'keeps submit available after %s',
    async (status) => {
      harness.getMyProfile.mockResolvedValue(response('APPROVED', status));
      harness.updateProfile.mockImplementation(async () =>
        response('APPROVED', status),
      );
      const view = mount();
      await until(
        view.container,
        () =>
          findButton(view.container, 'Отправить на проверку') instanceof
          HTMLButtonElement,
        'recovery submit',
      );
      expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(
        false,
      );
      click(view.container, 'Отправить на проверку');
      await until(
        view.container,
        () => harness.submitAuthorApplication.mock.calls.length === 1,
        'submit call',
      );
      expect(harness.updateProfile).toHaveBeenCalledTimes(1);
      view.unmount();
    },
  );

  it('submits the initial wizard only after save succeeds', async () => {
    harness.params = { step: '4' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    let resolveSave: (value: ReturnType<typeof response>) => void = () =>
      undefined;
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить и завершить') instanceof
        HTMLButtonElement,
      'wizard submit',
    );
    click(view.container, 'Сохранить и завершить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave(response('DRAFT', 'DRAFT'));
      await Promise.resolve();
    });
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 1,
      'wizard submit call',
    );
    view.unmount();
  });

  it('does not submit when save fails and allows another attempt', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    const rejections: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    harness.updateProfile.mockRejectedValueOnce(new Error('upload failed'));
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Не удалось сохранить профиль') ===
        true,
      'save error',
    );
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(false);
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 1,
      'retry submit',
    );
    expect(harness.updateProfile).toHaveBeenCalledTimes(2);
    await flush();
    expect(view.container.textContent).not.toContain(
      'Не удалось сохранить профиль',
    );
    process.off('unhandledRejection', onUnhandled);
    expect(rejections).toEqual([]);
    view.unmount();
  });

  it('does not submit or navigate when a save or logout is already in flight', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    let resolveSave: (value: ReturnType<typeof response>) => void = () =>
      undefined;
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const saving = mount();
    await until(
      saving.container,
      () =>
        findButton(saving.container, 'Сохранить') instanceof HTMLButtonElement,
      'save action',
    );
    clickInOneTurn(saving.container, ['Сохранить', 'Отправить на проверку']);
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave(response('APPROVED', 'DRAFT'));
      await Promise.resolve();
    });
    saving.unmount();

    harness.updateProfile.mockClear();
    harness.submitAuthorApplication.mockClear();
    harness.logout.mockImplementation(() => new Promise(() => undefined));
    const leaving = mount();
    await until(
      leaving.container,
      () =>
        findButton(leaving.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit after logout setup',
    );
    clickInOneTurn(leaving.container, ['Выйти', 'Отправить на проверку']);
    await flush();
    expect(harness.logout).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    leaving.unmount();
  });

  it('runs one save-then-submit operation for two presses in the same turn', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    let resolveSave: (value: ReturnType<typeof response>) => void = () =>
      undefined;
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit action',
    );
    clickInOneTurn(view.container, [
      'Отправить на проверку',
      'Отправить на проверку',
    ]);
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave(response('APPROVED', 'DRAFT'));
      await Promise.resolve();
    });
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 1,
      'single submit',
    );
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('blocks save, logout, close, and another submit while submit is still pending', async () => {
    harness.params = { step: '4' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    let resolveSave: (value: ReturnType<typeof response>) => void = () =>
      undefined;
    let resolveSubmit: (
      value: ReturnType<typeof submitResponse>,
    ) => void = () => undefined;
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    harness.submitAuthorApplication.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => {
        const submit = findButton(view.container, 'Сохранить и завершить');
        return submit instanceof HTMLButtonElement && !submit.disabled;
      },
      'enabled wizard submit',
    );
    click(view.container, 'Сохранить и завершить');
    await flush();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave(response('DRAFT', 'DRAFT', '2026-09-27T01:00:00.000Z'));
      await Promise.resolve();
    });
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 1,
      'pending submit',
    );
    expect(findButton(view.container, 'Сохранить черновик')).toBeUndefined();
    expect(buttonDisabled(view.container, 'Выйти')).toBe(true);
    expect(buttonDisabled(view.container, 'Закрыть')).toBe(true);
    expect(buttonDisabled(view.container, 'Сохранить и завершить')).toBe(true);
    click(view.container, 'Выйти');
    click(view.container, 'Закрыть');
    click(view.container, 'Сохранить и завершить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
    expect(harness.logout).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();

    harness.getMyProfile.mockResolvedValue(
      response('DRAFT', 'PENDING_REVIEW', '2026-09-28T00:00:00.000Z'),
    );
    await act(async () => {
      resolveSubmit(submitResponse('DRAFT', 'PENDING_REVIEW'));
      await Promise.resolve();
    });
    await until(
      view.container,
      () => view.container.textContent?.includes('Заявка на проверке') === true,
      'pending profile',
    );
    expect(findButton(view.container, 'Сохранить и завершить')).toBeUndefined();
    expect(buttonDisabled(view.container, 'Закрыть')).toBe(false);
    click(view.container, 'Закрыть');
    expect(harness.replace).toHaveBeenCalledWith('/');
    expect(harness.logout).not.toHaveBeenCalled();
    view.unmount();
  });

  it('shows the submit error and allows a retry after a rejected submit', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    const rejections: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    harness.submitAuthorApplication.mockRejectedValueOnce(
      new Error('submit failed'),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Не удалось отправить заявку') ===
        true,
      'submit error',
    );
    expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(false);
    expect(buttonDisabled(view.container, 'Сохранить')).toBe(false);
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 2,
      'submit retry',
    );
    expect(harness.updateProfile).toHaveBeenCalledTimes(2);
    await flush();
    expect(view.container.textContent).not.toContain(
      'Не удалось отправить заявку',
    );
    process.off('unhandledRejection', onUnhandled);
    expect(rejections).toEqual([]);
    view.unmount();
  });

  it('shows the pending profile after a successful submit without leaving the screen', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit action',
    );
    harness.getMyProfile.mockResolvedValue(
      response('APPROVED', 'PENDING_REVIEW', '2026-09-28T00:00:00.000Z'),
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => view.container.textContent?.includes('Заявка на проверке') === true,
      'pending copy',
    );
    expect(view.container.textContent).toContain('Одобрен');
    expect(findButton(view.container, 'Отправить на проверку')).toBeUndefined();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('does not reopen submit while the profile refetch is delayed after a successful submit', async () => {
    const pendingProfile = response(
      'APPROVED',
      'PENDING_REVIEW',
      '2026-09-28T00:00:00.000Z',
    );
    const delayed: Array<(value: ReturnType<typeof response>) => void> = [];
    let profileCalls = 0;
    harness.getMyProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          profileCalls += 1;
          if (profileCalls === 1) {
            resolve(response('APPROVED', 'DRAFT'));
            return;
          }
          delayed.push(resolve);
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 1,
      'first submit',
    );
    await until(
      view.container,
      () => delayed.length > 0,
      'delayed profile refetch',
    );
    const submitAgain = findButton(view.container, 'Отправить на проверку');
    const saveAgain = findButton(view.container, 'Сохранить');
    if (submitAgain instanceof HTMLButtonElement && !submitAgain.disabled) {
      act(() => {
        submitAgain.click();
      });
    }
    if (saveAgain instanceof HTMLButtonElement && !saveAgain.disabled) {
      act(() => {
        saveAgain.click();
      });
    }
    await flush();
    expect(
      submitAgain === undefined ||
        (submitAgain instanceof HTMLButtonElement && submitAgain.disabled),
    ).toBe(true);
    expect(
      saveAgain === undefined ||
        (saveAgain instanceof HTMLButtonElement && saveAgain.disabled),
    ).toBe(true);
    expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(view.container.textContent).toContain('Заявка на проверке');

    await act(async () => {
      for (const resolve of delayed.splice(0)) resolve(pendingProfile);
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).toContain('Заявка на проверке');
    expect(view.container.textContent).toContain('Одобрен');
    expect(findButton(view.container, 'Отправить на проверку')).toBeUndefined();
    expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('keeps the submitted revision pending when a later profile snapshot is stale', async () => {
    const delayed: Array<(value: ReturnType<typeof response>) => void> = [];
    let profileCalls = 0;
    harness.getMyProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          profileCalls += 1;
          if (profileCalls === 1) {
            resolve(response('APPROVED', 'DRAFT'));
            return;
          }
          delayed.push(resolve);
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 1,
      'first submit',
    );
    await until(
      view.container,
      () => delayed.length > 0,
      'stale profile refetch',
    );
    await act(async () => {
      for (const resolve of delayed.splice(0))
        resolve(response('APPROVED', 'DRAFT'));
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).toContain('Заявка на проверке');
    expect(findButton(view.container, 'Отправить на проверку')).toBeUndefined();
    expect(findButton(view.container, 'Сохранить')).toBeUndefined();
    const city = view.container.querySelector('[aria-label="Город"]');
    expect(city).toBeInstanceOf(HTMLInputElement);
    expect((city as HTMLInputElement).disabled).toBe(true);
    expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it.each(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'] as const)(
    'accepts a newer %s profile snapshot after the confirmed pending submit',
    async (revisionStatus) => {
      const delayed: Array<(value: ReturnType<typeof response>) => void> = [];
      let profileCalls = 0;
      harness.getMyProfile.mockImplementation(
        () =>
          new Promise((resolve) => {
            profileCalls += 1;
            if (profileCalls === 1) {
              resolve(response('APPROVED', 'DRAFT'));
              return;
            }
            delayed.push(resolve);
          }),
      );
      const view = mount();
      await until(
        view.container,
        () =>
          findButton(view.container, 'Отправить на проверку') instanceof
          HTMLButtonElement,
        'submit action',
      );
      click(view.container, 'Отправить на проверку');
      await until(
        view.container,
        () =>
          view.container.textContent?.includes('Заявка на проверке') === true,
        'confirmed pending',
      );
      await act(async () => {
        for (let pass = 0; pass < 4 && delayed.length > 0; pass += 1) {
          for (const resolve of delayed.splice(0)) {
            resolve(
              response('APPROVED', revisionStatus, '2026-09-29T00:00:00.000Z'),
            );
          }
          await Promise.resolve();
        }
      });
      await flush();
      expect(view.container.textContent).not.toContain('Заявка на проверке');
      expect(view.container.textContent).toContain('Одобрен');
      expect(buttonDisabled(view.container, 'Сохранить')).toBe(false);
      const city = view.container.querySelector('[aria-label="Город"]');
      expect(city).toBeInstanceOf(HTMLInputElement);
      expect((city as HTMLInputElement).disabled).toBe(false);
      if (revisionStatus === 'APPROVED') {
        expect(
          findButton(view.container, 'Отправить на проверку'),
        ).toBeUndefined();
      } else {
        expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(
          false,
        );
      }
      expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
      expect(harness.updateProfile).toHaveBeenCalledTimes(1);
      view.unmount();
    },
  );

  it('does not offer another submit when the profile refetch fails, and logout stays available', async () => {
    let profileCalls = 0;
    harness.getMyProfile.mockImplementation(() => {
      profileCalls += 1;
      if (profileCalls === 1)
        return Promise.resolve(response('APPROVED', 'DRAFT'));
      return Promise.reject(new Error('profile refetch failed'));
    });
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => view.container.textContent?.includes('Заявка на проверке') === true,
      'pending after failed refetch',
    );
    expect(findButton(view.container, 'Отправить на проверку')).toBeUndefined();
    expect(buttonDisabled(view.container, 'Выйти')).toBe(false);
    click(view.container, 'Выйти');
    await flush();
    expect(harness.logout).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});

describe('seller profile save reconciliation', () => {
  it('keeps text entered after the snapshot and normalizes an untouched field', async () => {
    let resolveSave: (value: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить') instanceof HTMLButtonElement,
      'save',
    );
    click(view.container, 'Сохранить');
    await flush();
    setInput(view.container, 'Город', 'Hrodna');
    await act(async () => {
      resolveSave(savedProfile({ city: 'Minsk', practice: 'Oil painting' }));
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    expect(inputValue(view.container, 'Практика')).toBe('Oil painting');
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ city: 'Minsk', discipline: 'Painting' }),
    );
    click(view.container, 'Выйти');
    expect(harness.logout).not.toHaveBeenCalled();
    expect(view.container.querySelector('[role="dialog"]')).not.toBeNull();
    setInput(view.container, 'Город', 'Minsk');
    click(view.container, 'Продолжить заполнение');
    click(view.container, 'Выйти');
    expect(harness.logout).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('clears a field that was dirty before the profile snapshot was saved', async () => {
    let resolveSave: (value: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить') instanceof HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Город', 'Hrodna');
    click(view.container, 'Сохранить');
    await flush();
    await act(async () => {
      resolveSave(savedProfile({ city: 'Hrodna', practice: 'Oil painting' }));
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    expect(inputValue(view.container, 'Практика')).toBe('Oil painting');
    click(view.container, 'Выйти');
    expect(harness.logout).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('keeps a photo chosen during an in-flight profile save', async () => {
    let resolveSave: (value: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    const nextPhoto = new Blob(['next'], { type: 'image/png' });
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:next-photo', width: 500, height: 500 }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => nextPhoto })),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить') instanceof HTMLButtonElement,
      'save',
    );
    click(view.container, 'Сохранить');
    await flush();
    click(view.container, 'Изменить фото');
    await flush();
    if (findButton(view.container, 'Установить фото')) {
      click(view.container, 'Установить фото');
      await flush();
    }
    await act(async () => {
      resolveSave(savedProfile());
      await Promise.resolve();
    });
    await flush();
    harness.updateProfile.mockResolvedValue(savedProfile());
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile.mock.calls[0]?.[1]).toBeUndefined();
    expect(harness.updateProfile.mock.calls[1]?.[1]).toBe(nextPhoto);
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('does not submit or leave the profile when the save before submit fails', async () => {
    let rejectSave: (error: Error) => void = () => undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectSave = reject;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
        HTMLButtonElement,
      'submit',
    );
    click(view.container, 'Отправить на проверку');
    click(view.container, 'Отправить на проверку');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(
      (view.container.querySelector('[aria-label="Город"]') as HTMLInputElement)
        .disabled,
    ).toBe(true);
    setInput(view.container, 'Город', 'During submit');
    expect(inputValue(view.container, 'Город')).toBe('Minsk');
    await act(async () => {
      rejectSave(new Error('save failed'));
      await Promise.resolve();
    });
    await flush();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(
      (view.container.querySelector('[aria-label="Город"]') as HTMLInputElement)
        .disabled,
    ).toBe(false);
    view.unmount();
  });

  it('keeps a local profile edit when the profile query refetches', async () => {
    harness.getMyProfile.mockResolvedValueOnce(response('APPROVED', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.querySelector('[aria-label="Город"]') instanceof
        HTMLInputElement,
      'city',
    );
    harness.getMyProfile.mockResolvedValueOnce(
      response('APPROVED', 'DRAFT', '2026-09-29T00:00:00.000Z'),
    );
    setInput(view.container, 'Город', 'Hrodna');
    await act(async () => {
      await view.queryClient.invalidateQueries({
        queryKey: ['seller', 'profile'],
      });
    });
    await flush();
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    view.unmount();
  });

  it('does not restore the private profile cache after the session is cleared', async () => {
    let resolveSave: (value: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить') instanceof HTMLButtonElement,
      'save',
    );
    view.queryClient.setQueryData(['user', 'me'], null);
    view.queryClient.setQueryData(['portfolio-works'], { marker: true });
    const reads = harness.getMyProfile.mock.calls.length;
    click(view.container, 'Сохранить');
    await flush();
    await act(async () => {
      resolveSave(savedProfile({ practice: 'Oil painting' }));
      await Promise.resolve();
    });
    await flush();
    expect(harness.getMyProfile.mock.calls.length).toBe(reads);
    expect(view.queryClient.getQueryData(['portfolio-works'])).toEqual({
      marker: true,
    });
    view.unmount();
  });

  it('keeps typed profile text when save fails and retries that text', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(savedProfile({ city: 'Hrodna' }));
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить') instanceof HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Город', 'Hrodna');
    click(view.container, 'Сохранить');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Не удалось сохранить профиль') ===
        true,
      'save error',
    );
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(2);
    expect(harness.updateProfile.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ city: 'Hrodna' }),
    );
    view.unmount();
  });

  it('reports a photo picker failure and accepts a later selection', async () => {
    const replacementPhoto = new Blob(['replacement'], { type: 'image/png' });
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(savedProfile());
    harness.launchImageLibraryAsync
      .mockRejectedValueOnce(new Error('picker unavailable'))
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'blob:replacement', width: 500, height: 500 }],
      });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => replacementPhoto })),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Изменить фото') instanceof
        HTMLButtonElement,
      'photo',
    );

    click(view.container, 'Изменить фото');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Не удалось выбрать фото') ===
        true,
      'photo picker error',
    );
    expect(harness.updateProfile).not.toHaveBeenCalled();

    click(view.container, 'Изменить фото');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Не удалось выбрать фото') !==
        true,
      'photo picker retry',
    );
    click(view.container, 'Установить фото');
    await flush();
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile.mock.calls[0]?.[1]).toBe(replacementPhoto);
    view.unmount();
  });

  it('ignores a photo picker response after the screen unmounts', async () => {
    let finishPicker: (result: {
      canceled: boolean;
      assets: Array<{ uri: string; width: number; height: number }>;
    }) => void = () => undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishPicker = resolve;
        }),
    );
    const readBlob = vi.fn();
    vi.stubGlobal('fetch', readBlob);
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Изменить фото') instanceof
        HTMLButtonElement,
      'photo',
    );
    click(view.container, 'Изменить фото');
    view.unmount();

    await act(async () => {
      finishPicker({
        canceled: false,
        assets: [{ uri: 'blob:late', width: 500, height: 500 }],
      });
      await Promise.resolve();
    });
    expect(readBlob).not.toHaveBeenCalled();
  });

  it('ignores an older photo read after a newer selection', async () => {
    const firstPhoto = new Blob(['first'], { type: 'image/png' });
    const secondPhoto = new Blob(['second'], { type: 'image/png' });
    let resolveFirst: (value: {
      canceled: boolean;
      assets: Array<{ uri: string; width: number; height: number }>;
    }) => void = () => undefined;
    let resolveSecond: (value: {
      canceled: boolean;
      assets: Array<{ uri: string; width: number; height: number }>;
    }) => void = () => undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(savedProfile());
    harness.launchImageLibraryAsync
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (uri: string) => ({
        blob: async () => (uri === 'blob:second' ? secondPhoto : firstPhoto),
      })),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Изменить фото') instanceof
        HTMLButtonElement,
      'photo',
    );
    click(view.container, 'Изменить фото');
    click(view.container, 'Изменить фото');
    await act(async () => {
      resolveSecond({
        canceled: false,
        assets: [{ uri: 'blob:second', width: 500, height: 500 }],
      });
      await Promise.resolve();
    });
    await flush();
    await act(async () => {
      resolveFirst({
        canceled: false,
        assets: [{ uri: 'blob:first', width: 500, height: 500 }],
      });
      await Promise.resolve();
    });
    await flush();
    click(view.container, 'Установить фото');
    await flush();
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile.mock.calls[0]?.[1]).toBe(secondPhoto);
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('preserves the claimed slug when the auth epoch resets the draft', async () => {
    harness.params = { step: '1' };
    harness.authSlug = 'claimed-author';
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    const view = mount('user-a', 'claimed-author');
    await until(
      view.container,
      () => {
        const input = view.container.querySelector<HTMLInputElement>(
          '[aria-label="Никнейм"]',
        );
        return (
          input instanceof HTMLInputElement && input.value === 'claimed-author'
        );
      },
      'claimed slug',
    );
    await act(async () => {
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    expect(inputValue(view.container, 'Никнейм')).toBe('claimed-author');
    view.unmount();
  });

  it('hydrates only the new session slug even if the auth context is stale', async () => {
    harness.params = { step: '1' };
    harness.authSlug = 'previous-author';
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    const view = mount('user-a', 'previous-author');
    await until(
      view.container,
      () => {
        const input = view.container.querySelector<HTMLInputElement>(
          '[aria-label="Никнейм"]',
        );
        return (
          input instanceof HTMLInputElement && input.value === 'previous-author'
        );
      },
      'previous slug',
    );
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, {
        id: 'user-b',
        slug: 'next-author',
      });
      advanceAuthEpoch(view.queryClient);
    });
    await until(
      view.container,
      () =>
        view.container.querySelector<HTMLInputElement>('[aria-label="Никнейм"]')
          ?.value === 'next-author',
      'new session slug',
    );
    view.unmount();
  });

  it('does not restore the old slug and keeps the new account nickname editable', async () => {
    harness.params = { step: '1' };
    harness.authSlug = 'previous-author';
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    const view = mount('user-a', 'previous-author');
    await until(
      view.container,
      () =>
        view.container.querySelector<HTMLInputElement>('[aria-label="Никнейм"]')
          ?.value === 'previous-author',
      'previous slug',
    );
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, {
        id: 'user-b',
        slug: null,
      });
      advanceAuthEpoch(view.queryClient);
    });
    await until(
      view.container,
      () => {
        const field = view.container.querySelector<HTMLInputElement>(
          '[aria-label="Никнейм"]',
        );
        return (
          field instanceof HTMLInputElement &&
          field.value === '' &&
          !field.disabled
        );
      },
      'new account editable nickname',
    );
    view.unmount();
  });

  it('closes the old account exit dialog when the session changes', async () => {
    harness.params = { step: '2' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Закрыть') instanceof HTMLButtonElement,
      'close',
    );
    setInput(view.container, 'Telegram', '@maker_art');
    click(view.container, 'Закрыть');
    expect(findButton(view.container, 'Прервать')).toBeTruthy();

    const nextProfile = response('DRAFT', 'DRAFT');
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-b' });
      view.queryClient.setQueryData(['seller', 'profile'], nextProfile);
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    expect(findButton(view.container, 'Прервать')).toBeUndefined();
    view.unmount();
  });

  it('does not rewind an advanced wizard stage when a previous profile refetch resolves late', async () => {
    const draft = response('DRAFT', 'DRAFT');
    draft.sellerProfile.applicationStage = 'CONTACTS';
    const advanced = response('DRAFT', 'DRAFT');
    advanced.sellerProfile.applicationStage = 'ABOUT';
    let finishOldRead: (value: typeof draft) => void = () => undefined;
    harness.params = { step: '2' };
    harness.getMyProfile
      .mockResolvedValueOnce(draft)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishOldRead = resolve;
          }),
      )
      .mockResolvedValue(advanced);
    harness.updateProfile.mockResolvedValue(draft);
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement &&
        !buttonDisabled(view.container, 'Продолжить'),
      'continue',
    );
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () => harness.getMyProfile.mock.calls.length >= 2,
      'in-flight stale profile refetch',
    );
    await until(
      view.container,
      () => harness.advanceAuthorApplication.mock.calls.length === 1,
      'stage advance',
    );
    await until(
      view.container,
      () => harness.push.mock.calls.length === 1,
      'next step',
    );
    expect(harness.push).toHaveBeenCalledWith({
      pathname: '/profile',
      params: { step: '3' },
    });
    await act(async () => {
      finishOldRead(draft);
      await Promise.resolve();
    });
    await flush();
    const current = view.queryClient.getQueryData<ReturnType<typeof response>>([
      'seller',
      'profile',
    ]);
    expect(current?.sellerProfile.applicationStage).toBe('ABOUT');
    view.unmount();
  });

  it('does not navigate after focus leaves and returns during a step save', async () => {
    let finishSave: (saved: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    const original = response('DRAFT', 'DRAFT');
    const savedDraft = {
      ...original,
      sellerProfile: { ...original.sellerProfile, city: 'Late city' },
    };
    harness.params = { step: '1' };
    harness.getMyProfile
      .mockResolvedValueOnce(original)
      .mockResolvedValue(savedDraft);
    harness.updateProfile.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement &&
        !buttonDisabled(view.container, 'Продолжить'),
      'continue',
    );
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () => harness.updateProfile.mock.calls.length === 1,
      'pending save',
    );

    harness.focused = false;
    view.rerender();
    harness.focused = true;
    view.rerender();
    await act(async () => {
      finishSave(savedDraft);
      await Promise.resolve();
    });
    await flush();
    expect(harness.push).not.toHaveBeenCalled();
    expect(view.queryClient.getQueryData(['seller', 'profile'])).toEqual(
      savedDraft,
    );

    harness.updateProfile.mockResolvedValueOnce(response('DRAFT', 'DRAFT'));
    click(view.container, 'Продолжить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(2);
    expect(harness.push).toHaveBeenCalledWith({
      pathname: '/profile',
      params: { step: '2' },
    });
    view.unmount();
  });

  it('does not navigate or restore a profile after the screen unmounts during a step save', async () => {
    let finishSave: (saved: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    const original = response('DRAFT', 'DRAFT');
    harness.params = { step: '1' };
    harness.getMyProfile.mockResolvedValue(original);
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement &&
        !buttonDisabled(view.container, 'Продолжить'),
      'continue',
    );
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () => harness.updateProfile.mock.calls.length === 1,
      'pending save',
    );

    view.unmount();
    await act(async () => {
      finishSave(savedProfile({ city: 'Late city' }));
      await Promise.resolve();
    });
    await flush();
    expect(harness.push).not.toHaveBeenCalled();
    expect(view.queryClient.getQueryData(['seller', 'profile'])).toEqual(
      original,
    );
  });

  it('keeps a confirmed pending revision when submission completes off-screen', async () => {
    let finishSubmit: (
      result: ReturnType<typeof submitResponse>,
    ) => void = () => undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(savedProfile());
    harness.submitAuthorApplication.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSubmit = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
          HTMLButtonElement &&
        !buttonDisabled(view.container, 'Отправить на проверку'),
      'submit',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 1,
      'pending submission',
    );

    harness.focused = false;
    view.rerender();
    await act(async () => {
      finishSubmit(submitResponse('APPROVED', 'PENDING_REVIEW'));
      await Promise.resolve();
    });
    await until(
      view.container,
      () =>
        view.queryClient.getQueryData<ReturnType<typeof response>>([
          'seller',
          'profile',
        ])?.editingRevision?.status === 'PENDING_REVIEW',
      'confirmed revision',
    );
    harness.focused = true;
    view.rerender();
    expect(findButton(view.container, 'Отправить на проверку')).toBeUndefined();
    view.unmount();
  });

  it('does not apply a pending submission after the screen unmounts', async () => {
    let finishSubmit: (
      result: ReturnType<typeof submitResponse>,
    ) => void = () => undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(savedProfile());
    harness.submitAuthorApplication.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSubmit = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на проверку') instanceof
          HTMLButtonElement &&
        !buttonDisabled(view.container, 'Отправить на проверку'),
      'submit',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => harness.submitAuthorApplication.mock.calls.length === 1,
      'pending submit',
    );
    const savedAtUnmount = view.queryClient.getQueryData(['seller', 'profile']);
    view.unmount();
    await act(async () => {
      finishSubmit(submitResponse('APPROVED', 'PENDING_REVIEW'));
      await Promise.resolve();
    });
    await flush();
    expect(view.queryClient.getQueryData(['seller', 'profile'])).toEqual(
      savedAtUnmount,
    );
    expect(harness.push).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
  });

  it('drops a save from the previous session after logout and login', async () => {
    let resolveSave: (value: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount('user-a');
    await until(
      view.container,
      () =>
        view.container.querySelector<HTMLInputElement>('[aria-label="Город"]')
          ?.value === 'Minsk',
      'profile A',
    );
    click(view.container, 'Сохранить');
    await flush();
    const profileB = response('APPROVED', 'DRAFT', '2026-09-30T00:00:00.000Z');
    profileB.sellerProfile = { ...profileB.sellerProfile, city: 'Hrodna' };
    harness.getMyProfile.mockResolvedValue(profileB);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-b' });
      view.queryClient.setQueryData(['seller', 'profile'], profileB);
    });
    await flush();
    harness.getMyProfile.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      resolveSave(savedProfile({ city: 'Normalized' }));
      await Promise.resolve();
    });
    await flush();
    expect(view.queryClient.getQueryData(['seller', 'profile'])).toEqual(
      profileB,
    );
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    expect(harness.push).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('drops a save after the same account logs out and back in', async () => {
    let resolveSave: (value: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount('user-a');
    await until(
      view.container,
      () =>
        view.container.querySelector<HTMLInputElement>('[aria-label="Город"]')
          ?.value === 'Minsk',
      'profile',
    );
    click(view.container, 'Сохранить');
    await flush();
    const restored = response('APPROVED', 'DRAFT', '2026-09-30T00:00:00.000Z');
    restored.sellerProfile = { ...restored.sellerProfile, city: 'Restored' };
    harness.getMyProfile.mockResolvedValue(restored);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-a' });
      view.queryClient.setQueryData(['seller', 'profile'], restored);
    });
    await flush();
    harness.getMyProfile.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      resolveSave(savedProfile({ city: 'Normalized' }));
      await Promise.resolve();
    });
    await flush();
    expect(view.queryClient.getQueryData(['seller', 'profile'])).toEqual(
      restored,
    );
    expect(inputValue(view.container, 'Город')).toBe('Restored');
    view.unmount();
  });

  it('does not continue a profile step after the session changes', async () => {
    let resolveSave: (value: ReturnType<typeof savedProfile>) => void = () =>
      undefined;
    harness.params = { step: '1' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount('user-a');
    await until(
      view.container,
      () =>
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement,
      'continue',
    );
    click(view.container, 'Продолжить');
    await flush();
    const profileB = response('APPROVED', 'DRAFT', '2026-09-30T00:00:00.000Z');
    profileB.sellerProfile = { ...profileB.sellerProfile, city: 'Hrodna' };
    harness.getMyProfile.mockResolvedValue(profileB);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-b' });
      view.queryClient.setQueryData(['seller', 'profile'], profileB);
    });
    await flush();
    harness.getMyProfile.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      resolveSave(savedProfile({ city: 'Normalized' }));
      await Promise.resolve();
    });
    await flush();
    expect(harness.push).not.toHaveBeenCalled();
    expect(view.queryClient.getQueryData(['seller', 'profile'])).toEqual(
      profileB,
    );
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    view.unmount();
  });

  it.each([
    ['another account', 'user-b'],
    ['the same account', 'user-a'],
  ] as const)(
    'does not save a photo chosen by the previous session after login of %s',
    async (_label, nextUserId) => {
      const photoA = new Blob(['photo-a'], { type: 'image/png' });
      let resolvePicker: (value: {
        canceled: boolean;
        assets: Array<{ uri: string; width: number; height: number }>;
      }) => void = () => undefined;
      harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
      harness.updateProfile.mockResolvedValue(savedProfile({ city: 'Hrodna' }));
      harness.launchImageLibraryAsync.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePicker = resolve;
          }),
      );
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ blob: async () => photoA })),
      );
      const view = mount('user-a');
      await until(
        view.container,
        () =>
          findButton(view.container, 'Изменить фото') instanceof
          HTMLButtonElement,
        'photo',
      );
      click(view.container, 'Изменить фото');
      await flush();
      const profileB = response(
        'APPROVED',
        'DRAFT',
        '2026-09-30T00:00:00.000Z',
      );
      profileB.sellerProfile = { ...profileB.sellerProfile, city: 'Hrodna' };
      harness.getMyProfile.mockResolvedValue(profileB);
      await act(async () => {
        await clearAuthenticatedSession(view.queryClient);
        view.queryClient.setQueryData(authKeys.session, { id: nextUserId });
        view.queryClient.setQueryData(['seller', 'profile'], profileB);
        advanceAuthEpoch(view.queryClient);
      });
      await flush();
      harness.getMyProfile.mockImplementation(
        () => new Promise(() => undefined),
      );
      await act(async () => {
        resolvePicker({
          canceled: false,
          assets: [{ uri: 'blob:photo-a', width: 500, height: 500 }],
        });
        await Promise.resolve();
      });
      await flush();
      click(view.container, 'Сохранить');
      await flush();
      expect(harness.updateProfile).toHaveBeenCalledTimes(1);
      expect(harness.updateProfile.mock.calls[0]?.[1]).toBeUndefined();
      expect(inputValue(view.container, 'Город')).toBe('Hrodna');
      vi.unstubAllGlobals();
      view.unmount();
    },
  );

  it('does not apply a photo blob read that finishes after the session changes', async () => {
    const photoA = new Blob(['photo-a'], { type: 'image/png' });
    let resolveBlob: (value: Blob) => void = () => undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(savedProfile({ city: 'Hrodna' }));
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:photo-a', width: 500, height: 500 }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveBlob = () => resolve({ blob: async () => photoA });
          }),
      ),
    );
    const view = mount('user-a');
    await until(
      view.container,
      () =>
        findButton(view.container, 'Изменить фото') instanceof
        HTMLButtonElement,
      'photo',
    );
    click(view.container, 'Изменить фото');
    await flush();
    if (findButton(view.container, 'Установить фото')) {
      click(view.container, 'Установить фото');
      await flush();
    }
    const profileB = response('APPROVED', 'DRAFT', '2026-09-30T00:00:00.000Z');
    profileB.sellerProfile = { ...profileB.sellerProfile, city: 'Hrodna' };
    harness.getMyProfile.mockResolvedValue(profileB);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-a' });
      view.queryClient.setQueryData(['seller', 'profile'], profileB);
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    harness.getMyProfile.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      resolveBlob(photoA);
      await Promise.resolve();
    });
    await flush();
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile.mock.calls[0]?.[1]).toBeUndefined();
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('keeps raw contact text in the field and normalizes it only in the save payload', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(savedProfile());
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.querySelector<HTMLInputElement>('[aria-label="Город"]')
          ?.value === 'Minsk',
      'profile',
    );
    setInput(view.container, 'Telegram', '@maker_art');
    setInput(view.container, 'Instagram', '@maker.art');
    setInput(view.container, 'Сайт', 'https://example.com/studio');
    expect(inputValue(view.container, 'Telegram')).toBe('@maker_art');
    expect(inputValue(view.container, 'Instagram')).toBe('@maker.art');
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        telegramUrl: 'https://t.me/maker_art',
        instagramUrl: 'https://instagram.com/maker.art',
        websiteUrl: 'https://example.com/studio',
      }),
    );
    view.unmount();
  });
});

describe('seller profile validation freshness', () => {
  function profileWithTelegram(status = 'APPROVED') {
    const initial = response(status, 'DRAFT');
    return {
      ...initial,
      sellerProfile: {
        ...initial.sellerProfile,
        telegramUrl: 'https://t.me/original_author',
      },
    };
  }

  function changeAndClick(
    container: HTMLElement,
    label: string,
    value: string,
    button: string,
  ) {
    const input = container.querySelector(`[aria-label="${label}"]`);
    const target = findButton(container, button);
    if (!(input instanceof HTMLInputElement) || !target) {
      throw new Error(`Missing ${label} or ${button}`);
    }
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    act(() => {
      setter?.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      target.click();
    });
  }

  it('does not send an invalid Telegram typed over a saved contact', async () => {
    harness.getMyProfile.mockResolvedValue(profileWithTelegram());
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.querySelector('[aria-label="Telegram"]') instanceof
          HTMLInputElement &&
        inputValue(view.container, 'Telegram') ===
          'https://t.me/original_author',
      'saved telegram',
    );
    expect(buttonDisabled(view.container, 'Сохранить')).toBe(false);
    changeAndClick(view.container, 'Telegram', 'bad handle', 'Сохранить');
    await flush();
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(inputValue(view.container, 'Telegram')).toBe('bad handle');
    setInput(view.container, 'Telegram', 'bad handle');
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).not.toHaveBeenCalled();
    view.unmount();
  });

  it('saves a corrected Telegram when the application closes before the resolver settles', async () => {
    harness.params = { step: '2' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement,
      'continue',
    );
    setInput(view.container, 'Telegram', 'bad handle');
    await flush();
    expect(buttonDisabled(view.container, 'Продолжить')).toBe(true);
    setInput(view.container, 'Telegram', '@maker_art');
    expect(buttonDisabled(view.container, 'Продолжить')).toBe(false);
    click(view.container, 'Закрыть');
    expect(findButton(view.container, 'Прервать')).toBeTruthy();

    click(view.container, 'Прервать');
    await flush();
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ telegramUrl: 'https://t.me/maker_art' }),
    );
    expect(harness.replace).toHaveBeenCalledWith('/');
    view.unmount();
  });

  it('leaves an invalid draft without saving', async () => {
    harness.params = { step: '2' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Закрыть') instanceof HTMLButtonElement,
      'close',
    );
    setInput(view.container, 'Telegram', 'bad handle');
    click(view.container, 'Закрыть');
    expect(findButton(view.container, 'Прервать')).toBeTruthy();

    click(view.container, 'Прервать');
    await flush();
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.replace).toHaveBeenCalledWith('/');
    view.unmount();
  });

  it('keeps the author and the corrected contact when the exit save fails', async () => {
    harness.params = { step: '2' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    harness.updateProfile.mockRejectedValue(new Error('save failed'));
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Закрыть') instanceof HTMLButtonElement,
      'close',
    );
    setInput(view.container, 'Telegram', 'bad handle');
    await flush();
    setInput(view.container, 'Telegram', '@maker_art');
    click(view.container, 'Закрыть');
    click(view.container, 'Прервать');
    await flush();
    await flush();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(inputValue(view.container, 'Telegram')).toBe('@maker_art');
    expect(view.container.textContent).toContain(
      'Не удалось сохранить профиль',
    );
    expect(view.container.querySelector('[role="dialog"]')).not.toBeNull();
    view.unmount();
  });

  it('records one profile write when save or exit is repeated', async () => {
    harness.getMyProfile.mockResolvedValue(profileWithTelegram());
    let resolveSave: (value: ReturnType<typeof response>) => void = () =>
      undefined;
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const saving = mount();
    await until(
      saving.container,
      () =>
        saving.container.querySelector('[aria-label="Telegram"]') instanceof
          HTMLInputElement &&
        inputValue(saving.container, 'Telegram') ===
          'https://t.me/original_author',
      'saved telegram',
    );
    setInput(saving.container, 'Telegram', '@maker_art');
    clickInOneTurn(saving.container, ['Сохранить', 'Сохранить']);
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ telegramUrl: 'https://t.me/maker_art' }),
    );
    await act(async () => {
      resolveSave(response('APPROVED', 'DRAFT'));
      await Promise.resolve();
    });
    saving.unmount();

    harness.params = { step: '2' };
    harness.updateProfile.mockReset();
    harness.replace.mockReset();
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const leaving = mount();
    await until(
      leaving.container,
      () =>
        findButton(leaving.container, 'Закрыть') instanceof HTMLButtonElement,
      'close',
    );
    setInput(leaving.container, 'Telegram', '@maker_art');
    click(leaving.container, 'Закрыть');
    clickInOneTurn(leaving.container, ['Прервать', 'Прервать']);
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveSave(response('DRAFT', 'DRAFT'));
      await Promise.resolve();
    });
    await flush();
    expect(harness.replace).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith('/');
    leaving.unmount();
  });

  it('does not publish a freshness save after the session changes', async () => {
    let resolveSave: (value: ReturnType<typeof response>) => void = () =>
      undefined;
    harness.getMyProfile.mockResolvedValue(profileWithTelegram());
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount('user-a');
    await until(
      view.container,
      () =>
        view.container.querySelector('[aria-label="Telegram"]') instanceof
          HTMLInputElement &&
        inputValue(view.container, 'Telegram') ===
          'https://t.me/original_author',
      'saved telegram',
    );
    setInput(view.container, 'Telegram', '@maker_art');
    click(view.container, 'Сохранить');
    await until(
      view.container,
      () => harness.updateProfile.mock.calls.length === 1,
      'fresh save',
    );
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ telegramUrl: 'https://t.me/maker_art' }),
    );
    const profileB = response('APPROVED', 'DRAFT', '2026-09-30T00:00:00.000Z');
    profileB.sellerProfile = {
      ...profileB.sellerProfile,
      city: 'Hrodna',
      telegramUrl: null,
    };
    harness.getMyProfile.mockResolvedValue(profileB);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-b' });
      view.queryClient.setQueryData(['seller', 'profile'], profileB);
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    harness.getMyProfile.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      resolveSave(response('APPROVED', 'DRAFT'));
      await Promise.resolve();
    });
    await flush();
    expect(view.queryClient.getQueryData(['seller', 'profile'])).toEqual(
      profileB,
    );
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    view.unmount();
  });

  it('saves empty optional contacts and stores a blank city as null', async () => {
    harness.getMyProfile.mockResolvedValue(profileWithTelegram());
    harness.updateProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.querySelector('[aria-label="Telegram"]') instanceof
          HTMLInputElement &&
        inputValue(view.container, 'Telegram') ===
          'https://t.me/original_author',
      'saved telegram',
    );
    setInput(view.container, 'Telegram', '');
    setInput(view.container, 'Instagram', '');
    setInput(view.container, 'Сайт', '');
    setInput(view.container, 'Почта', '');
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        publicEmail: null,
      }),
    );
    harness.updateProfile.mockClear();
    setInput(view.container, 'Город', '   ');
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ city: null }),
    );
    view.unmount();
  });

  it('saves a corrected contact when leaving the contacts step', async () => {
    harness.params = { step: '2' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Назад') instanceof HTMLButtonElement,
      'back',
    );
    setInput(view.container, 'Telegram', 'bad handle');
    await flush();
    click(view.container, 'Назад');
    await flush();
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    setInput(view.container, 'Telegram', '@maker_art');
    click(view.container, 'Назад');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ telegramUrl: 'https://t.me/maker_art' }),
    );
    expect(harness.push).toHaveBeenCalledWith({
      pathname: '/profile',
      params: { step: '1' },
    });
    view.unmount();
  });

  it('continues a contacts step that still has empty optional contacts', async () => {
    harness.params = { step: '2' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    harness.updateProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement &&
        !buttonDisabled(view.container, 'Продолжить'),
      'enabled continue',
    );
    click(view.container, 'Продолжить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        publicEmail: null,
      }),
    );
    expect(harness.push).toHaveBeenCalledWith({
      pathname: '/profile',
      params: { step: '3' },
    });
    view.unmount();
  });

  it('keeps the photo and values across UI steps and a failed create, then reconciles a lost response before retry', async () => {
    const photo = new Blob(['portrait'], { type: 'image/png' });
    harness.params = { step: 'photo' };
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:portrait', width: 500, height: 500 }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => photo })),
    );
    const view = mount();
    await until(
      view.container,
      () => Boolean(findButton(view.container, 'Загрузить фото')),
      'photo step',
    );
    click(view.container, 'Загрузить фото');
    await until(
      view.container,
      () => Boolean(findButton(view.container, 'Установить фото')),
      'editor',
    );
    click(view.container, 'Установить фото');
    await until(
      view.container,
      () => Boolean(findButton(view.container, 'Изменить фото')),
      'selected photo',
    );
    expect(harness.createProfile).not.toHaveBeenCalled();
    click(view.container, 'Продолжить');
    expect(harness.setParams).toHaveBeenLastCalledWith({ step: '1' });
    harness.params = { step: '1' };
    view.rerender();
    setInput(view.container, 'Никнейм', 'synthetic-author');
    setInput(view.container, 'Имя или название', 'Synthetic Author');
    selectCountry(view.container, 'Беларусь');
    harness.params = { step: 'photo' };
    view.rerender();
    expect(findButton(view.container, 'Изменить фото')).toBeInstanceOf(
      HTMLButtonElement,
    );
    harness.params = { step: '1' };
    view.rerender();
    expect(inputValue(view.container, 'Имя или название')).toBe(
      'Synthetic Author',
    );
    harness.claimSlug.mockResolvedValue({ slug: 'synthetic-author' });
    harness.createProfile.mockRejectedValueOnce(new Error('response lost'));
    await until(
      view.container,
      () => !buttonDisabled(view.container, 'Продолжить'),
      'ready',
    );
    click(view.container, 'Продолжить');
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('response lost') === true ||
        harness.createProfile.mock.calls.length === 1,
      'create error',
    );
    await flush();
    expect(harness.createProfile).toHaveBeenCalledTimes(1);
    expect(harness.createProfile.mock.calls[0]?.[1]).toBe(photo);
    expect(inputValue(view.container, 'Имя или название')).toBe(
      'Synthetic Author',
    );
    expect(findButton(view.container, 'Изменить фото')).toBeInstanceOf(
      HTMLButtonElement,
    );
    const recovered = response('DRAFT', 'DRAFT');
    harness.getMyProfile.mockResolvedValue(recovered);
    harness.updateProfile
      .mockRejectedValueOnce(new Error('update response lost'))
      .mockResolvedValue(recovered);
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () => harness.updateProfile.mock.calls.length === 1,
      'reconciled retry',
    );
    await flush();
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () => harness.updateProfile.mock.calls.length === 2,
      'second reconciled retry',
    );
    expect(harness.createProfile).toHaveBeenCalledTimes(1);
    expect(harness.updateProfile.mock.calls[0]?.[1]).toBe(photo);
    expect(harness.updateProfile.mock.calls[1]?.[1]).toBe(photo);
    view.unmount();
  });

  it('keeps the first-step photo and fields when the nickname is outside the slug contract', async () => {
    const photo = new Blob(['portrait'], { type: 'image/png' });
    harness.params = { step: '1' };
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    harness.claimSlug.mockResolvedValue({ slug: 'synthetic-author' });
    harness.createProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:portrait', width: 500, height: 500 }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => photo })),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.querySelector('[aria-label="Никнейм"]') instanceof
        HTMLInputElement,
      'nickname',
    );
    setInput(view.container, 'Никнейм', 'БЕ');
    setInput(view.container, 'Имя или название', 'Synthetic Author');
    selectCountry(view.container, 'Беларусь');
    setInput(view.container, 'Город', 'Minsk');
    click(view.container, 'Загрузить фото');
    await until(
      view.container,
      () => Boolean(findButton(view.container, 'Установить фото')),
      'editor',
    );
    click(view.container, 'Установить фото');
    await until(
      view.container,
      () =>
        findButton(view.container, 'Изменить фото') instanceof
        HTMLButtonElement,
      'photo kept',
    );
    await until(
      view.container,
      () =>
        view.container.textContent?.includes(
          'Используйте маленькие латинские буквы и цифры. Между ними можно поставить дефис или подчёркивание.',
        ) === true,
      'nickname error',
    );
    expect(buttonDisabled(view.container, 'Продолжить')).toBe(true);
    click(view.container, 'Продолжить');
    await flush();
    expect(harness.createProfile).not.toHaveBeenCalled();
    expect(view.container.textContent).not.toContain(
      'Не удалось сохранить профиль',
    );
    expect(inputValue(view.container, 'Никнейм')).toBe('БЕ');
    expect(inputValue(view.container, 'Имя или название')).toBe(
      'Synthetic Author',
    );
    expect(
      view.container.querySelector('[aria-label="Страна"]')?.textContent,
    ).toBe('Беларусь');
    expect(inputValue(view.container, 'Город')).toBe('Minsk');
    setInput(view.container, 'Никнейм', 'synthetic-author');
    await until(
      view.container,
      () =>
        !buttonDisabled(view.container, 'Продолжить') &&
        view.container.textContent?.includes(
          'Используйте маленькие латинские буквы и цифры. Между ними можно поставить дефис или подчёркивание.',
        ) !== true,
      'continue after correction',
    );
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () => harness.createProfile.mock.calls.length === 1,
      'create',
    );
    expect(harness.claimSlug).toHaveBeenCalledWith({
      slug: 'synthetic-author',
    });
    expect(harness.createProfile.mock.calls[0]?.[0]).toEqual({
      fullName: 'Synthetic Author',
      country: 'BY',
      city: 'Minsk',
    });
    expect(harness.createProfile.mock.calls[0]?.[1]).toBe(photo);
    expect(harness.push).toHaveBeenCalledWith({
      pathname: '/profile',
      params: { step: '2' },
    });
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('ignores a late nickname claim after the session changes', async () => {
    let resolveClaim: (value: { slug: string }) => void = () => undefined;
    const photo = new Blob(['portrait'], { type: 'image/png' });
    harness.params = { step: '1' };
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    harness.claimSlug.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveClaim = resolve;
        }),
    );
    harness.createProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:portrait', width: 500, height: 500 }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => photo })),
    );
    const view = mount('user-a');
    await until(
      view.container,
      () =>
        view.container.querySelector('[aria-label="Никнейм"]') instanceof
        HTMLInputElement,
      'nickname',
    );
    setInput(view.container, 'Никнейм', 'synthetic-author');
    setInput(view.container, 'Имя или название', 'Synthetic Author');
    selectCountry(view.container, 'Беларусь');
    setInput(view.container, 'Город', 'Minsk');
    click(view.container, 'Загрузить фото');
    await until(
      view.container,
      () => Boolean(findButton(view.container, 'Установить фото')),
      'editor',
    );
    click(view.container, 'Установить фото');
    await until(
      view.container,
      () =>
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement &&
        !buttonDisabled(view.container, 'Продолжить'),
      'continue',
    );
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () => harness.claimSlug.mock.calls.length === 1,
      'claim',
    );
    const profileB = response('APPROVED', 'DRAFT', '2026-09-30T00:00:00.000Z');
    profileB.sellerProfile = {
      ...profileB.sellerProfile,
      slug: 'other-author',
      city: 'Hrodna',
    };
    harness.getMyProfile.mockResolvedValue(profileB);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-b' });
      view.queryClient.setQueryData(['seller', 'profile'], profileB);
    });
    await flush();
    await act(async () => {
      resolveClaim({ slug: 'kept-name' });
      await Promise.resolve();
    });
    await flush();
    expect(harness.createProfile).not.toHaveBeenCalled();
    expect(view.queryClient.getQueryData(['seller', 'profile'])).toEqual(
      profileB,
    );
    expect(view.container.textContent).not.toContain('kept-name');
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('clears a profile save error after the next accepted attempt and ignores a late response', async () => {
    let rejectSave: (error: unknown) => void = () => undefined;
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    harness.updateProfile
      .mockRejectedValueOnce(
        new ApiClientError('Профиль не найден.', {
          kind: 'not_found',
          status: 404,
        }),
      )
      .mockRejectedValueOnce(
        new ApiClientError('Недостаточно прав для сохранения профиля.', {
          kind: 'forbidden',
          status: 403,
        }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectSave = reject;
          }),
      );
    const view = mount();
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить') instanceof HTMLButtonElement,
      'save',
    );
    expect(findButton(view.container, 'Изменить фото')).toBeInstanceOf(
      HTMLButtonElement,
    );
    click(view.container, 'Сохранить');
    await until(
      view.container,
      () => view.container.textContent?.includes('Профиль не найден.') === true,
      'first error',
    );
    expect(inputValue(view.container, 'Город')).toBe('Minsk');
    expect(findButton(view.container, 'Изменить фото')).toBeInstanceOf(
      HTMLButtonElement,
    );
    click(view.container, 'Сохранить');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes(
          'Недостаточно прав для сохранения профиля.',
        ) === true,
      'second error',
    );
    expect(view.container.textContent).not.toContain('Профиль не найден.');
    click(view.container, 'Сохранить');
    await flush();
    expect(view.container.textContent).not.toContain(
      'Недостаточно прав для сохранения профиля.',
    );
    await act(async () => {
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    await act(async () => {
      rejectSave(
        new ApiClientError('Старая ошибка профиля.', {
          kind: 'not_found',
          status: 404,
        }),
      );
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).not.toContain('Старая ошибка профиля.');
    view.unmount();
  });

  it('shows about-step requirements only after blur or continue, without blocking an incomplete draft save', async () => {
    const draft = response('DRAFT', 'DRAFT');
    draft.sellerProfile.shortDescription = '';
    draft.sellerProfile.directionCategoryIds = [];
    draft.sellerProfile.directions = [];
    draft.sellerProfile.applicationStage = 'ABOUT';
    harness.params = { step: '3' };
    harness.getMyProfile.mockResolvedValue(draft);
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.querySelector('[aria-label="Коротко о себе"]') instanceof
          HTMLInputElement &&
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement,
      'about step',
    );
    click(view.container, 'Продолжить');
    expect(view.container.textContent).toContain(
      'Выберите хотя бы одно направление',
    );
    blurField(view.container, 'Коротко о себе');
    expect(fieldError(view.container, 'Коротко о себе')).toBe(
      'Добавьте короткое описание о себе',
    );
    setInput(view.container, 'Коротко о себе', 'Авторская практика.');
    click(view.container, 'Выберите основные направления');
    await flush();
    await flush();
    const ceramic = [
      ...view.container.querySelectorAll<HTMLButtonElement>(
        'button[role="checkbox"]',
      ),
    ].find((button) => button.textContent === 'Керамика');
    expect(ceramic).toBeInstanceOf(HTMLButtonElement);
    act(() => {
      ceramic?.click();
    });
    click(view.container, 'Применить');
    await flush();
    harness.updateProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    click(view.container, 'Продолжить');
    await until(
      view.container,
      () => harness.updateProfile.mock.calls.length === 1,
      'about save',
    );
    expect(harness.push).toHaveBeenCalledWith({
      pathname: '/profile',
      params: { step: '4' },
    });
    view.unmount();
  });

  async function settleValidation() {
    await flush();
    await flush();
  }

  async function mountAboutStep() {
    const draft = response('DRAFT', 'DRAFT');
    draft.sellerProfile.shortDescription = '';
    draft.sellerProfile.directionCategoryIds = [];
    draft.sellerProfile.directions = [];
    draft.sellerProfile.applicationStage = 'ABOUT';
    harness.params = { step: '3' };
    harness.getMyProfile.mockResolvedValue(draft);
    const view = mount();
    await until(
      view.container,
      () =>
        view.container.querySelector('[aria-label="Коротко о себе"]') instanceof
          HTMLInputElement &&
        findButton(view.container, 'Продолжить') instanceof HTMLButtonElement,
      'about step',
    );
    return view;
  }

  it.each([
    [
      'Коротко о себе',
      'Добавьте короткое описание о себе',
      'Авторская практика.',
    ],
  ] as const)(
    'keeps the %s requirement after whitespace once validation settles',
    async (label, message, validValue) => {
      const view = await mountAboutStep();
      expect(fieldError(view.container, label)).toBeNull();
      blurField(view.container, label);
      expect(fieldError(view.container, label)).toBe(message);
      setInput(view.container, label, ' ');
      await settleValidation();
      expect(inputValue(view.container, label)).toBe(' ');
      expect(fieldError(view.container, label)).toBe(message);
      expect(harness.updateProfile).not.toHaveBeenCalled();

      click(view.container, 'Продолжить');
      await settleValidation();
      expect(fieldError(view.container, label)).toBe(message);
      expect(view.container.textContent).toContain(
        'Выберите хотя бы одно направление',
      );
      setInput(view.container, label, validValue);
      await settleValidation();
      expect(fieldError(view.container, label)).toBeNull();
      setInput(view.container, label, '');
      await settleValidation();
      expect(fieldError(view.container, label)).toBe(message);
      expect(harness.updateProfile).not.toHaveBeenCalled();
      view.unmount();
    },
  );

  it('drops step requirements after a session change and still saves an incomplete draft', async () => {
    const view = await mountAboutStep();
    blurField(view.container, 'Коротко о себе');
    click(view.container, 'Продолжить');
    await settleValidation();
    expect(fieldError(view.container, 'Коротко о себе')).toBe(
      'Добавьте короткое описание о себе',
    );
    const next = response('DRAFT', 'DRAFT', '2026-09-30T00:00:00.000Z');
    next.sellerProfile.shortDescription = '';
    next.sellerProfile.directionCategoryIds = [];
    next.sellerProfile.directions = [];
    next.sellerProfile.applicationStage = 'ABOUT';
    harness.getMyProfile.mockResolvedValue(next);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-b' });
      view.queryClient.setQueryData(['seller', 'profile'], next);
      advanceAuthEpoch(view.queryClient);
    });
    await settleValidation();
    expect(inputValue(view.container, 'Коротко о себе')).toBe('');
    expect(fieldError(view.container, 'Коротко о себе')).toBeNull();

    harness.params = {};
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    const editor = mount();
    await until(
      editor.container,
      () =>
        findButton(editor.container, 'Сохранить') instanceof HTMLButtonElement,
      'profile save',
    );
    setInput(editor.container, 'Коротко о себе', ' ');
    await settleValidation();
    click(editor.container, 'Сохранить');
    await until(
      editor.container,
      () => harness.updateProfile.mock.calls.length === 1,
      'whitespace draft',
    );
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ shortDescription: null }),
    );
    view.unmount();
    editor.unmount();
  });
});

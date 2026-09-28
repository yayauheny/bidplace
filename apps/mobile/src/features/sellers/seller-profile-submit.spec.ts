/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
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
  submitAuthorApplication: vi.fn(),
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
      submitAuthorApplication: harness.submitAuthorApplication,
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
    FormSection: ({
      children,
      title,
    }: {
      children?: ReactNode;
      title?: string;
    }) => createElement('section', null, title, children),
    ImagePlaceholder: () => null,
    PageHeader: ({ title }: { title: string }) => createElement('h1', null, title),
    PrimaryButton: PressButton,
    SecondaryButton: PressButton,
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

function revision(status: string, updatedAt = '2026-09-27T00:00:00.000Z') {
  return { id: '22222222-2222-4222-8222-222222222222', version: 1, status, updatedAt };
}

function response(parentStatus: string, revisionStatus: string, updatedAt?: string) {
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
      applicationStage: parentStatus === 'PENDING_REVIEW' ? null : 'ACHIEVEMENTS',
    },
    editingRevision: revision(revisionStatus, updatedAt),
    achievements: [],
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

function findButton(container: ParentNode, label: string) {
  return [...container.querySelectorAll('button')].find((button) => button.textContent === label);
}

function click(container: ParentNode, label: string) {
  const target = findButton(container, label);
  if (!target) throw new Error(`Missing button ${label}`);
  act(() => {
    target.click();
  });
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

function buttonDisabled(container: ParentNode, label: string) {
  const target = findButton(container, label);
  if (!(target instanceof HTMLButtonElement)) throw new Error(`Missing button ${label}`);
  return target.disabled;
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
  harness.submitAuthorApplication.mockReset();
  harness.launchImageLibraryAsync.mockReset();
  harness.logout.mockResolvedValue(undefined);
  harness.getAuthorApplicationPhoto.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  harness.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
  harness.updateProfile.mockImplementation(async () => response('APPROVED', 'DRAFT'));
  harness.submitAuthorApplication.mockImplementation(async () =>
    submitResponse('APPROVED', 'PENDING_REVIEW'),
  );
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('seller profile revision submit', () => {
  it('shows an enabled submit action for an approved author with an editable revision', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
      'submit action',
    );
    expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(false);
    expect(findButton(view.container, 'Сохранить')).toBeTruthy();
    expect(findButton(view.container, 'Закрыть')).toBeUndefined();
    view.unmount();
  });

  it('hides submit and disables editing while the revision is pending', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'PENDING_REVIEW'));
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

  it.each(['CHANGES_REQUESTED', 'REJECTED'] as const)(
    'keeps submit available after %s',
    async (status) => {
      harness.getMyProfile.mockResolvedValue(response('APPROVED', status));
      harness.updateProfile.mockImplementation(async () => response('APPROVED', status));
      const view = mount();
      await until(
        view.container,
        () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
        'recovery submit',
      );
      expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(false);
      click(view.container, 'Отправить на проверку');
      await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 1, 'submit call');
      expect(harness.updateProfile).toHaveBeenCalledTimes(1);
      view.unmount();
    },
  );

  it('submits the initial wizard only after save succeeds', async () => {
    harness.params = { step: '4' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    let resolveSave: (value: ReturnType<typeof response>) => void = () => undefined;
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
      'wizard submit',
    );
    click(view.container, 'Отправить на проверку');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave(response('DRAFT', 'DRAFT'));
      await Promise.resolve();
    });
    await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 1, 'wizard submit call');
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
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => view.container.textContent?.includes('Не удалось сохранить профиль') === true,
      'save error',
    );
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(false);
    click(view.container, 'Отправить на проверку');
    await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 1, 'retry submit');
    expect(harness.updateProfile).toHaveBeenCalledTimes(2);
    await flush();
    process.off('unhandledRejection', onUnhandled);
    expect(rejections).toEqual([]);
    view.unmount();
  });

  it('does not submit or navigate when a save or logout is already in flight', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    let resolveSave: (value: ReturnType<typeof response>) => void = () => undefined;
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const saving = mount();
    await until(
      saving.container,
      () => findButton(saving.container, 'Сохранить') instanceof HTMLButtonElement,
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
      () => findButton(leaving.container, 'Отправить на проверку') instanceof HTMLButtonElement,
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
    let resolveSave: (value: ReturnType<typeof response>) => void = () => undefined;
    harness.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
      'submit action',
    );
    clickInOneTurn(view.container, ['Отправить на проверку', 'Отправить на проверку']);
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave(response('APPROVED', 'DRAFT'));
      await Promise.resolve();
    });
    await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 1, 'single submit');
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('blocks save, logout, close, and another submit while submit is still pending', async () => {
    harness.params = { step: '4' };
    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'DRAFT'));
    let resolveSave: (value: ReturnType<typeof response>) => void = () => undefined;
    let resolveSubmit: (value: ReturnType<typeof submitResponse>) => void = () => undefined;
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
        const submit = findButton(view.container, 'Отправить на проверку');
        return submit instanceof HTMLButtonElement && !submit.disabled;
      },
      'enabled wizard submit',
    );
    click(view.container, 'Отправить на проверку');
    await flush();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave(response('DRAFT', 'DRAFT', '2026-09-27T01:00:00.000Z'));
      await Promise.resolve();
    });
    await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 1, 'pending submit');
    expect(buttonDisabled(view.container, 'Сохранить черновик')).toBe(true);
    expect(buttonDisabled(view.container, 'Выйти')).toBe(true);
    expect(buttonDisabled(view.container, 'Закрыть')).toBe(true);
    expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(true);
    click(view.container, 'Сохранить черновик');
    click(view.container, 'Выйти');
    click(view.container, 'Закрыть');
    click(view.container, 'Отправить на проверку');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
    expect(harness.logout).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();

    harness.getMyProfile.mockResolvedValue(response('DRAFT', 'PENDING_REVIEW', '2026-09-28T00:00:00.000Z'));
    await act(async () => {
      resolveSubmit(submitResponse('DRAFT', 'PENDING_REVIEW'));
      await Promise.resolve();
    });
    await until(
      view.container,
      () => view.container.textContent?.includes('Заявка на проверке') === true,
      'pending profile',
    );
    expect(findButton(view.container, 'Отправить на проверку')).toBeUndefined();
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
    harness.submitAuthorApplication.mockRejectedValueOnce(new Error('submit failed'));
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(
      view.container,
      () => view.container.textContent?.includes('Не удалось отправить заявку') === true,
      'submit error',
    );
    expect(buttonDisabled(view.container, 'Отправить на проверку')).toBe(false);
    expect(buttonDisabled(view.container, 'Сохранить')).toBe(false);
    click(view.container, 'Отправить на проверку');
    await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 2, 'submit retry');
    expect(harness.updateProfile).toHaveBeenCalledTimes(2);
    await flush();
    process.off('unhandledRejection', onUnhandled);
    expect(rejections).toEqual([]);
    view.unmount();
  });

  it('shows the pending profile after a successful submit without leaving the screen', async () => {
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'DRAFT'));
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
      'submit action',
    );
    harness.getMyProfile.mockResolvedValue(response('APPROVED', 'PENDING_REVIEW', '2026-09-28T00:00:00.000Z'));
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
    const pendingProfile = response('APPROVED', 'PENDING_REVIEW', '2026-09-28T00:00:00.000Z');
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
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 1, 'first submit');
    await until(view.container, () => delayed.length > 0, 'delayed profile refetch');
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
    expect(submitAgain === undefined || (submitAgain instanceof HTMLButtonElement && submitAgain.disabled)).toBe(true);
    expect(saveAgain === undefined || (saveAgain instanceof HTMLButtonElement && saveAgain.disabled)).toBe(true);
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
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
      'submit action',
    );
    click(view.container, 'Отправить на проверку');
    await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 1, 'first submit');
    await until(view.container, () => delayed.length > 0, 'stale profile refetch');
    await act(async () => {
      for (const resolve of delayed.splice(0)) resolve(response('APPROVED', 'DRAFT'));
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

  it('does not offer another submit when the profile refetch fails, and logout stays available', async () => {
    let profileCalls = 0;
    harness.getMyProfile.mockImplementation(() => {
      profileCalls += 1;
      if (profileCalls === 1) return Promise.resolve(response('APPROVED', 'DRAFT'));
      return Promise.reject(new Error('profile refetch failed'));
    });
    const view = mount();
    await until(
      view.container,
      () => findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement,
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

/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const userA = { id: 'user-a' };
const userB = { id: 'user-b' };

const harness = vi.hoisted(() => ({
  params: {} as { intro?: string; step?: string },
  logout: vi.fn<() => Promise<void>>(),
  replace: vi.fn(),
  push: vi.fn(),
  setParams: vi.fn(),
  getMyProfile: vi.fn(),
  updateProfile: vi.fn(),
  createProfile: vi.fn(),
  getAuthorApplication: vi.fn(),
  getAuthorApplicationPhoto: vi.fn(),
  addAuthorAchievement: vi.fn(),
  deleteAuthorAchievement: vi.fn(),
  submitAuthorApplication: vi.fn(),
  advanceAuthorApplication: vi.fn(),
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
      getAuthorApplication: harness.getAuthorApplication,
      getAuthorApplicationPhoto: harness.getAuthorApplicationPhoto,
      addAuthorAchievement: harness.addAuthorAchievement,
      deleteAuthorAchievement: harness.deleteAuthorAchievement,
      submitAuthorApplication: harness.submitAuthorApplication,
      advanceAuthorApplication: harness.advanceAuthorApplication,
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

vi.mock('../../components/shared/InfrastructureErrorState', () => ({
  InfrastructureErrorState: () => createElement('div', null, 'application-error'),
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
        onChange: (event: { target: { value: string } }) => {
          if (editable === false) return;
          onChangeText?.(event.target.value);
        },
      }),
  };
});

import { clearAuthenticatedSession, replaceAuthenticatedSession, authKeys } from '../../lib/query-cache';
import { SellerProfileScreen } from './seller-profile-screen';

function profileResponse(city = 'Minsk') {
  return {
    sellerProfile: {
      id: '11111111-1111-4111-8111-111111111111',
      slug: 'author',
      fullName: 'Author Name',
      discipline: 'Painting',
      country: 'BY',
      city,
      practice: null,
      socialLink: null,
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      publicEmail: null,
      shortDescription: 'Short description',
      status: 'APPROVED',
      profilePhotoUrl: '/photo.png',
      updatedAt: '2026-09-27T00:00:00.000Z',
      applicationStage: 'ACHIEVEMENTS',
    },
    editingRevision: {
      id: '22222222-2222-4222-8222-222222222222',
      version: 1,
      status: 'DRAFT',
      updatedAt: '2026-09-27T00:00:00.000Z',
    },
  };
}

function revisionSnapshot(status: string, updatedAt: string) {
  const current = profileResponse();
  return {
    ...current,
    editingRevision: {
      ...current.editingRevision,
      status,
      updatedAt,
    },
  };
}

function publishProfile(view: ReturnType<typeof mount>, snapshot: ReturnType<typeof revisionSnapshot>) {
  act(() => {
    view.queryClient.setQueryData(['seller', 'profile'], snapshot);
  });
}

function applicationResponse(bodies: string[]) {
  return {
    application: { status: 'APPROVED', applicationStage: 'ACHIEVEMENTS' },
    editingRevision: { id: '22222222-2222-4222-8222-222222222222', version: 1, status: 'DRAFT', updatedAt: '2026-09-27T00:00:00.000Z' },
    achievements: bodies.map((body, index) => ({
      id: `achievement-${index + 1}`,
      body,
      occurredDate: { year: 2025, month: 3, day: null },
      image: null,
    })),
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mount(session: { id: string } = userA) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, session);
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  const render = () => {
    act(() => {
      root.render(
        createElement(QueryClientProvider, { client: queryClient }, createElement(SellerProfileScreen)),
      );
    });
  };
  render();
  return {
    container,
    queryClient,
    rerender: render,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
      queryClient.clear();
    },
  };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function until(container: HTMLElement, predicate: () => boolean, label: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
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
  if (!(target instanceof HTMLButtonElement)) throw new Error(`Missing button ${label}`);
  act(() => {
    target.click();
  });
}

function clickInOneTurn(container: ParentNode, labels: string[]) {
  const targets = labels.map((label) => {
    const target = findButton(container, label);
    if (!(target instanceof HTMLButtonElement)) throw new Error(`Missing button ${label}`);
    return target;
  });
  act(() => {
    for (const target of targets) target.click();
  });
}

function inputValue(container: ParentNode, label: string) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing field ${label}`);
  return input.value;
}

function setInput(container: ParentNode, label: string, value: string) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing field ${label}`);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function openEditor(view: ReturnType<typeof mount>) {
  await until(
    view.container,
    () => findButton(view.container, 'Сохранить достижение') instanceof HTMLButtonElement,
    'achievement editor',
  );
}

function fillAchievement(container: ParentNode, body: string) {
  setInput(container, 'Описание достижения', body);
  setInput(container, 'Год', '2025');
  setInput(container, 'Месяц', '3');
}

function wizardProfile() {
  const current = profileResponse();
  return {
    ...current,
    sellerProfile: {
      ...current.sellerProfile,
      status: 'DRAFT',
      applicationStage: 'ACHIEVEMENTS' as const,
    },
  };
}

function savedProfile(city: string, discipline: string) {
  const saved = profileResponse(city);
  return {
    ...saved,
    sellerProfile: {
      ...saved.sellerProfile,
      discipline,
      updatedAt: '2026-09-28T00:00:00.000Z',
    },
    editingRevision: {
      ...saved.editingRevision,
      updatedAt: '2026-09-28T00:00:00.000Z',
    },
  };
}

async function switchAccount(view: ReturnType<typeof mount>, user: { id: string }) {
  await act(async () => {
    await replaceAuthenticatedSession(view.queryClient, user);
  });
  await flush();
}

describe('Author application achievement lifecycle', () => {
  beforeEach(() => {
    harness.params = {};
    harness.logout.mockReset();
    harness.replace.mockReset();
    harness.push.mockReset();
    harness.setParams.mockReset();
    harness.getMyProfile.mockReset();
    harness.updateProfile.mockReset();
    harness.createProfile.mockReset();
    harness.getAuthorApplication.mockReset();
    harness.getAuthorApplicationPhoto.mockReset();
    harness.addAuthorAchievement.mockReset();
    harness.deleteAuthorAchievement.mockReset();
    harness.submitAuthorApplication.mockReset();
    harness.advanceAuthorApplication.mockReset();
    harness.launchImageLibraryAsync.mockReset();
    harness.logout.mockResolvedValue(undefined);
    harness.getMyProfile.mockResolvedValue(profileResponse());
    harness.getAuthorApplication.mockResolvedValue(applicationResponse([]));
    harness.getAuthorApplicationPhoto.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    harness.updateProfile.mockResolvedValue(profileResponse());
    harness.submitAuthorApplication.mockResolvedValue({
      application: {
        slug: 'author',
        fullName: 'Author Name',
        country: 'BY',
        city: 'Minsk',
        discipline: 'Painting',
        practice: null,
        shortDescription: 'Short description',
        status: 'APPROVED',
        applicationStage: 'ACHIEVEMENTS',
      },
      editingRevision: {
        id: '22222222-2222-4222-8222-222222222222',
        version: 1,
        status: 'PENDING_REVIEW',
        updatedAt: '2026-09-28T00:00:00.000Z',
      },
      achievements: [],
    });
    harness.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    harness.addAuthorAchievement.mockResolvedValue({ achievement: { id: 'new', body: 'A' } });
    harness.deleteAuthorAchievement.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('keeps the description unchanged while an achievement add is pending', async () => {
    const pending = deferred<unknown>();
    harness.addAuthorAchievement.mockReturnValue(pending.promise);
    const view = mount();
    await openEditor(view);
    fillAchievement(view.container, 'Alpha');
    click(view.container, 'Сохранить достижение');
    await flush();
    setInput(view.container, 'Описание достижения', 'Beta');
    expect(inputValue(view.container, 'Описание достижения')).toBe('Alpha');
    expect(harness.addAuthorAchievement.mock.calls[0]?.[0]).toMatchObject({ body: 'Alpha' });
    await act(async () => {
      pending.resolve({ achievement: { id: 'new', body: 'Alpha' } });
      await pending.promise;
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('');
    view.unmount();
  });

  it('keeps the entered achievement and photo after a failed add, then retries that draft', async () => {
    const photo = new Blob(['photo'], { type: 'image/png' });
    const failed = deferred<never>();
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:show', fileName: 'show.png' }],
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => photo })));
    harness.addAuthorAchievement.mockReturnValue(failed.promise);
    const view = mount();
    await openEditor(view);
    fillAchievement(view.container, 'Alpha');
    click(view.container, 'Добавить фото (необязательно)');
    await until(view.container, () => view.container.textContent?.includes('Фото: show.png') === true, 'photo label');
    click(view.container, 'Сохранить достижение');
    await act(async () => {
      failed.reject(new Error('offline'));
      await failed.promise.catch(() => undefined);
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('Alpha');
    expect(view.container.textContent).toContain('Фото: show.png');
    expect(view.container.textContent).toContain('Не удалось обновить достижение');
    const retryButton = findButton(view.container, 'Сохранить достижение');
    expect(retryButton instanceof HTMLButtonElement && retryButton.disabled).toBe(false);
    const retried = deferred<{ achievement: { id: string; body: string } }>();
    harness.addAuthorAchievement.mockReturnValue(retried.promise);
    click(view.container, 'Сохранить достижение');
    await flush();
    expect(harness.addAuthorAchievement).toHaveBeenCalledTimes(2);
    expect(harness.addAuthorAchievement.mock.calls[1]?.[0]).toMatchObject({ body: 'Alpha' });
    expect(harness.addAuthorAchievement.mock.calls[1]?.[1]).toBe(photo);
    await act(async () => {
      retried.resolve({ achievement: { id: 'new', body: 'Alpha' } });
      await retried.promise;
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('');
    expect(view.container.textContent).toContain('Добавить фото (необязательно)');
    view.unmount();
  });

  it('ignores a second add or delete click in the same turn', async () => {
    const pendingAdd = deferred<unknown>();
    harness.addAuthorAchievement.mockReturnValue(pendingAdd.promise);
    const view = mount();
    await openEditor(view);
    fillAchievement(view.container, 'Alpha');
    clickInOneTurn(view.container, ['Сохранить достижение', 'Сохранить достижение']);
    await flush();
    expect(harness.addAuthorAchievement).toHaveBeenCalledTimes(1);
    view.unmount();

    harness.getAuthorApplication.mockResolvedValue(applicationResponse(['Listed']));
    const pendingDelete = deferred<unknown>();
    harness.deleteAuthorAchievement.mockReturnValue(pendingDelete.promise);
    const listed = mount();
    await until(listed.container, () => findButton(listed.container, 'Удалить') instanceof HTMLButtonElement, 'delete');
    clickInOneTurn(listed.container, ['Удалить', 'Удалить']);
    await flush();
    expect(harness.deleteAuthorAchievement).toHaveBeenCalledTimes(1);
    listed.unmount();
  });

  it('keeps the newer achievement photo when an older picker resolves later', async () => {
    const pickers: Array<(value: { canceled: boolean; assets: Array<{ uri: string; fileName: string }> }) => void> = [];
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          pickers.push(resolve);
        }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (uri: string) => ({ blob: async () => new Blob([uri], { type: 'image/png' }) })),
    );
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await flush();
    click(view.container, 'Добавить фото (необязательно)');
    await flush();
    await act(async () => {
      pickers[1]?.({ canceled: false, assets: [{ uri: 'blob:second', fileName: 'second.png' }] });
      await Promise.resolve();
    });
    await until(view.container, () => view.container.textContent?.includes('Фото: second.png') === true, 'second photo');
    await act(async () => {
      pickers[0]?.({ canceled: false, assets: [{ uri: 'blob:first', fileName: 'first.png' }] });
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).toContain('Фото: second.png');
    expect(view.container.textContent).not.toContain('Фото: first.png');
    view.unmount();
  });

  it('drops a blob that resolves after the parent save has finished', async () => {
    let resolvePicker: (value: { canceled: boolean; assets: Array<{ uri: string; fileName: string }> }) => void =
      () => undefined;
    let resolveBlob: (value: { blob: () => Promise<Blob> }) => void = () => undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveBlob = resolve;
        }),
    );
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await flush();
    await act(async () => {
      resolvePicker({ canceled: false, assets: [{ uri: 'blob:late', fileName: 'late.png' }] });
      await Promise.resolve();
    });
    await until(view.container, () => fetchMock.mock.calls.length === 1, 'achievement blob read');
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveBlob({ blob: async () => new Blob(['late'], { type: 'image/png' }) });
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).not.toContain('Фото: late.png');
    view.unmount();
  });

  it('does not attach an earlier photo to the draft created after an achievement add', async () => {
    let resolvePicker: (value: { canceled: boolean; assets: Array<{ uri: string; fileName: string }> }) => void =
      () => undefined;
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );
    vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['old'], { type: 'image/png' }) })));
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await flush();
    fillAchievement(view.container, 'Alpha');
    click(view.container, 'Сохранить достижение');
    await flush();
    fillAchievement(view.container, 'Beta');
    await act(async () => {
      resolvePicker({ canceled: false, assets: [{ uri: 'blob:old', fileName: 'old.png' }] });
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('Beta');
    expect(view.container.textContent).not.toContain('Фото: old.png');
    view.unmount();
  });

  it('drops a blob that finishes after the achievement add that interrupted it', async () => {
    let resolvePicker: (value: { canceled: boolean; assets: Array<{ uri: string; fileName: string }> }) => void =
      () => undefined;
    let resolveBlob: (value: { blob: () => Promise<Blob> }) => void = () => undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveBlob = resolve;
        }),
    );
    const pendingAdd = deferred<{ achievement: { id: string; body: string } }>();
    harness.addAuthorAchievement.mockReturnValue(pendingAdd.promise);
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await flush();
    await act(async () => {
      resolvePicker({ canceled: false, assets: [{ uri: 'blob:old', fileName: 'old.png' }] });
      await Promise.resolve();
    });
    await until(view.container, () => fetchMock.mock.calls.length === 1, 'blob read before add');
    fillAchievement(view.container, 'Alpha');
    click(view.container, 'Сохранить достижение');
    await act(async () => {
      pendingAdd.resolve({ achievement: { id: 'new', body: 'Alpha' } });
      await pendingAdd.promise;
    });
    await flush();
    fillAchievement(view.container, 'Beta');
    await act(async () => {
      resolveBlob({ blob: async () => new Blob(['old'], { type: 'image/png' }) });
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('Beta');
    expect(view.container.textContent).not.toContain('Фото: old.png');
    view.unmount();
  });

  it('does not revive an old photo after the form locks and unlocks', async () => {
    let resolvePicker: (value: { canceled: boolean; assets: Array<{ uri: string; fileName: string }> }) => void =
      () => undefined;
    let resolveBlob: (value: { blob: () => Promise<Blob> }) => void = () => undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveBlob = resolve;
        }),
    );
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    harness.params = { step: '4' };
    harness.getMyProfile.mockResolvedValue(wizardProfile());
    harness.updateProfile.mockRejectedValueOnce(new Error('save failed'));
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await flush();
    await act(async () => {
      resolvePicker({ canceled: false, assets: [{ uri: 'blob:old', fileName: 'old.png' }] });
      await Promise.resolve();
    });
    await until(view.container, () => fetchMock.mock.calls.length === 1, 'blob read before submit');
    click(view.container, 'Отправить на проверку');
    await flush();
    expect(findButton(view.container, 'Отправить на проверку') instanceof HTMLButtonElement).toBe(true);
    await act(async () => {
      resolveBlob({ blob: async () => new Blob(['old'], { type: 'image/png' }) });
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).not.toContain('Фото: old.png');
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:new', fileName: 'new.png' }],
    });
    fetchMock.mockResolvedValue({ blob: async () => new Blob(['new'], { type: 'image/png' }) });
    click(view.container, 'Добавить фото (необязательно)');
    await until(view.container, () => view.container.textContent?.includes('Фото: new.png') === true, 'new photo');
    view.unmount();
    harness.params = {};
  });

  it('reports a failed photo read and ignores a cancelled picker', async () => {
    harness.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: [] });
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await flush();
    expect(view.container.textContent).not.toContain('Не удалось выбрать фото');
    harness.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'blob:broken', fileName: 'broken.png' }],
    });
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('read failed'))));
    click(view.container, 'Добавить фото (необязательно)');
    await until(
      view.container,
      () => view.container.textContent?.includes('Не удалось выбрать фото') === true,
      'picker failure',
    );
    expect(findButton(view.container, 'Добавить фото (необязательно)')).toBeTruthy();
    view.unmount();
  });

  it('blocks parent submit, logout, and exit while an achievement write is pending', async () => {
    const pendingAdd = deferred<unknown>();
    harness.addAuthorAchievement.mockReturnValue(pendingAdd.promise);
    const view = mount();
    await openEditor(view);
    fillAchievement(view.container, 'Alpha');
    clickInOneTurn(view.container, ['Сохранить достижение', 'Отправить на проверку', 'Выйти']);
    await flush();
    expect(harness.addAuthorAchievement).toHaveBeenCalledTimes(1);
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.logout).not.toHaveBeenCalled();
    click(view.container, 'Отправить на проверку');
    click(view.container, 'Выйти');
    await flush();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    expect(harness.logout).not.toHaveBeenCalled();
    await act(async () => {
      pendingAdd.resolve({ achievement: { id: 'new', body: 'Alpha' } });
      await pendingAdd.promise;
    });
    await flush();
    click(view.container, 'Выйти');
    await flush();
    expect(harness.logout).toHaveBeenCalledTimes(1);
    view.unmount();

    harness.replace.mockClear();
    harness.push.mockClear();
    harness.updateProfile.mockClear();
    harness.params = { step: '4' };
    harness.getMyProfile.mockResolvedValue(wizardProfile());
    const pendingDelete = deferred<unknown>();
    harness.deleteAuthorAchievement.mockReturnValue(pendingDelete.promise);
    harness.getAuthorApplication.mockResolvedValue(applicationResponse(['Listed']));
    const wizard = mount();
    await until(wizard.container, () => findButton(wizard.container, 'Удалить') instanceof HTMLButtonElement, 'wizard delete');
    clickInOneTurn(wizard.container, ['Удалить', 'Закрыть', 'Назад']);
    await flush();
    expect(harness.deleteAuthorAchievement).toHaveBeenCalledTimes(1);
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.push).not.toHaveBeenCalled();
    click(wizard.container, 'Сохранить черновик');
    await flush();
    expect(harness.updateProfile).not.toHaveBeenCalled();
    await act(async () => {
      pendingDelete.resolve({ ok: true });
      await pendingDelete.promise;
    });
    await flush();
    click(wizard.container, 'Закрыть');
    expect(harness.replace).toHaveBeenCalledWith('/');
    wizard.unmount();
  });

  it('does not start an achievement write after a parent transition has begun', async () => {
    const pendingSave = deferred<ReturnType<typeof profileResponse>>();
    harness.updateProfile.mockReturnValue(pendingSave.promise);
    harness.getAuthorApplication.mockResolvedValue(applicationResponse(['Listed']));
    const view = mount();
    await until(view.container, () => findButton(view.container, 'Удалить') instanceof HTMLButtonElement, 'delete');
    fillAchievement(view.container, 'Alpha');
    clickInOneTurn(view.container, ['Сохранить', 'Сохранить достижение', 'Удалить']);
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.addAuthorAchievement).not.toHaveBeenCalled();
    expect(harness.deleteAuthorAchievement).not.toHaveBeenCalled();
    click(view.container, 'Сохранить достижение');
    click(view.container, 'Удалить');
    await flush();
    expect(harness.addAuthorAchievement).not.toHaveBeenCalled();
    expect(harness.deleteAuthorAchievement).not.toHaveBeenCalled();
    await act(async () => {
      pendingSave.resolve(profileResponse());
      await pendingSave.promise;
    });
    await flush();
    click(view.container, 'Сохранить достижение');
    await flush();
    expect(harness.addAuthorAchievement).toHaveBeenCalledTimes(1);
    view.unmount();

    const pendingSubmit = deferred<ReturnType<typeof profileResponse>>();
    harness.updateProfile.mockReturnValue(pendingSubmit.promise);
    const submitting = mount();
    await openEditor(submitting);
    fillAchievement(submitting.container, 'Alpha');
    clickInOneTurn(submitting.container, ['Отправить на проверку', 'Сохранить достижение']);
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(2);
    expect(harness.addAuthorAchievement).toHaveBeenCalledTimes(1);
    submitting.unmount();

    harness.push.mockClear();
    harness.params = { step: '4' };
    harness.getMyProfile.mockResolvedValue(wizardProfile());
    const wizard = mount();
    await openEditor(wizard);
    fillAchievement(wizard.container, 'Beta');
    clickInOneTurn(wizard.container, ['Назад', 'Сохранить достижение']);
    await flush();
    expect(harness.push).toHaveBeenCalledWith('/profile?step=3');
    expect(harness.addAuthorAchievement).toHaveBeenCalledTimes(1);
    wizard.unmount();
    harness.params = {};
  });

  it('releases parent coordination after achievement success, failure, and unmount', async () => {
    const pending = deferred<unknown>();
    harness.addAuthorAchievement.mockReturnValue(pending.promise);
    const view = mount();
    await openEditor(view);
    fillAchievement(view.container, 'Alpha');
    click(view.container, 'Сохранить достижение');
    await flush();
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).not.toHaveBeenCalled();
    await act(async () => {
      pending.resolve({ achievement: { id: 'new', body: 'Alpha' } });
      await pending.promise;
    });
    await flush();
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    view.unmount();

    const failed = deferred<never>();
    harness.addAuthorAchievement.mockReturnValue(failed.promise);
    harness.updateProfile.mockClear();
    const failedView = mount();
    await openEditor(failedView);
    fillAchievement(failedView.container, 'Alpha');
    click(failedView.container, 'Сохранить достижение');
    await act(async () => {
      failed.reject(new Error('offline'));
      await failed.promise.catch(() => undefined);
    });
    await flush();
    click(failedView.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    failedView.unmount();

    const abandoned = deferred<unknown>();
    harness.addAuthorAchievement.mockReturnValue(abandoned.promise);
    harness.updateProfile.mockClear();
    const abandonedView = mount();
    await openEditor(abandonedView);
    fillAchievement(abandonedView.container, 'Alpha');
    click(abandonedView.container, 'Сохранить достижение');
    await flush();
    abandonedView.unmount();
    await act(async () => {
      abandoned.resolve({ achievement: { id: 'old', body: 'Alpha' } });
      await abandoned.promise;
    });
    await flush();
    const next = mount();
    await openEditor(next);
    click(next.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(inputValue(next.container, 'Описание достижения')).toBe('');
    next.unmount();
  });

  it('keeps a profile field typed after the save snapshot while achievements are mounted', async () => {
    const pendingSave = deferred<ReturnType<typeof savedProfile>>();
    harness.updateProfile.mockReturnValue(pendingSave.promise);
    const view = mount();
    await openEditor(view);
    click(view.container, 'Сохранить');
    await flush();
    setInput(view.container, 'Город', 'Hrodna');
    await act(async () => {
      pendingSave.resolve(savedProfile('Minsk', 'Oil painting'));
      await pendingSave.promise;
    });
    await flush();
    expect(inputValue(view.container, 'Город')).toBe('Hrodna');
    expect(inputValue(view.container, 'Дисциплина')).toBe('Oil painting');
    expect(harness.updateProfile.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ city: 'Minsk', discipline: 'Painting' }),
    );
    view.unmount();
  });

  it('does not reopen moderation or the achievement editor from a stale profile response', async () => {
    const delayed: Array<(value: ReturnType<typeof profileResponse>) => void> = [];
    let profileCalls = 0;
    harness.getMyProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          profileCalls += 1;
          if (profileCalls === 1) {
            resolve(profileResponse());
            return;
          }
          delayed.push(resolve);
        }),
    );
    const view = mount();
    await openEditor(view);
    click(view.container, 'Отправить на проверку');
    await until(view.container, () => harness.submitAuthorApplication.mock.calls.length === 1, 'submit');
    await until(view.container, () => delayed.length > 0, 'stale profile');
    await act(async () => {
      for (const resolve of delayed.splice(0)) resolve(profileResponse());
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).toContain('Заявка на проверке');
    expect(findButton(view.container, 'Отправить на проверку')).toBeUndefined();
    expect(findButton(view.container, 'Сохранить достижение')).toBeUndefined();
    expect(harness.submitAuthorApplication).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('drops a retired session achievement read, write, and photo on the next account', async () => {
    const reads: Array<(value: ReturnType<typeof applicationResponse>) => void> = [];
    harness.getAuthorApplication.mockImplementation(
      () =>
        new Promise((resolve) => {
          reads.push(resolve);
        }),
    );
    const view = mount();
    await until(view.container, () => reads.length === 1, 'first application read');
    await switchAccount(view, userB);
    await until(view.container, () => reads.length >= 2, 'next application read');
    await act(async () => {
      reads[0]?.(applicationResponse(['Secret A']));
      reads[1]?.(applicationResponse(['Visible B']));
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).toContain('Visible B');
    expect(view.container.textContent).not.toContain('Secret A');
    view.unmount();

    const pendingAdd = deferred<{ achievement: { id: string; body: string } }>();
    harness.getAuthorApplication.mockResolvedValue(applicationResponse([]));
    harness.addAuthorAchievement.mockReturnValue(pendingAdd.promise);
    const writing = mount();
    await openEditor(writing);
    fillAchievement(writing.container, 'Alpha');
    click(writing.container, 'Сохранить достижение');
    await flush();
    const readsBeforeSwitch = harness.getAuthorApplication.mock.calls.length;
    await switchAccount(writing, userB);
    await openEditor(writing);
    const readsAfterSwitch = harness.getAuthorApplication.mock.calls.length;
    fillAchievement(writing.container, 'Beta');
    await act(async () => {
      pendingAdd.resolve({ achievement: { id: 'old', body: 'Alpha' } });
      await pendingAdd.promise;
    });
    await flush();
    expect(inputValue(writing.container, 'Описание достижения')).toBe('Beta');
    expect(harness.getAuthorApplication.mock.calls.length).toBe(readsAfterSwitch);
    expect(readsAfterSwitch).toBeGreaterThan(readsBeforeSwitch);
    writing.unmount();

    const pendingDelete = deferred<unknown>();
    harness.getAuthorApplication.mockResolvedValue(applicationResponse(['Listed']));
    harness.deleteAuthorAchievement.mockReturnValue(pendingDelete.promise);
    const deleting = mount();
    await until(deleting.container, () => findButton(deleting.container, 'Удалить') instanceof HTMLButtonElement, 'delete');
    click(deleting.container, 'Удалить');
    await flush();
    await switchAccount(deleting, userB);
    await until(deleting.container, () => deleting.container.textContent?.includes('Listed') === true, 'next list');
    await act(async () => {
      pendingDelete.resolve({ ok: true });
      await pendingDelete.promise;
    });
    await flush();
    expect(deleting.container.textContent).toContain('Listed');
    expect(harness.deleteAuthorAchievement).toHaveBeenCalledTimes(1);
    deleting.unmount();

    let resolvePicker: (value: { canceled: boolean; assets: Array<{ uri: string; fileName: string }> }) => void =
      () => undefined;
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => new Blob(['late'], { type: 'image/png' }) })),
    );
    const picking = mount();
    await openEditor(picking);
    click(picking.container, 'Добавить фото (необязательно)');
    await flush();
    await switchAccount(picking, userB);
    await openEditor(picking);
    await act(async () => {
      resolvePicker({ canceled: false, assets: [{ uri: 'blob:retired', fileName: 'retired.png' }] });
      await Promise.resolve();
    });
    await flush();
    expect(picking.container.textContent).not.toContain('Фото: retired.png');
    expect(findButton(picking.container, 'Добавить фото (необязательно)')).toBeTruthy();
    picking.unmount();
  });

  it('drops the previous session after logout and login of the same account', async () => {
    const pendingAdd = deferred<{ achievement: { id: string; body: string } }>();
    harness.addAuthorAchievement.mockReturnValue(pendingAdd.promise);
    const view = mount();
    await openEditor(view);
    fillAchievement(view.container, 'Alpha');
    setInput(view.container, 'Город', 'Hrodna');
    click(view.container, 'Сохранить достижение');
    await flush();
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      await replaceAuthenticatedSession(view.queryClient, userA);
    });
    await flush();
    await openEditor(view);
    const readsAfterLogin = harness.getAuthorApplication.mock.calls.length;
    fillAchievement(view.container, 'Beta');
    await act(async () => {
      pendingAdd.resolve({ achievement: { id: 'old', body: 'Alpha' } });
      await pendingAdd.promise;
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('Beta');
    expect(inputValue(view.container, 'Город')).toBe('Minsk');
    expect(view.container.textContent).not.toContain('Не удалось обновить достижение');
    expect(harness.getAuthorApplication.mock.calls.length).toBe(readsAfterLogin);
    view.unmount();
  });

  it('shows Alpha after the initial empty application read finishes late', async () => {
    const reads: Array<(value: ReturnType<typeof applicationResponse>) => void> = [];
    harness.getAuthorApplication.mockImplementation(
      () =>
        new Promise((resolve) => {
          reads.push(resolve);
        }),
    );
    const view = mount();
    await openEditor(view);
    expect(reads).toHaveLength(1);
    fillAchievement(view.container, 'Alpha');
    click(view.container, 'Сохранить достижение');
    await flush();
    await flush();
    expect(reads.length).toBeGreaterThan(1);
    await act(async () => {
      reads[0]?.(applicationResponse([]));
      reads[1]?.(applicationResponse(['Alpha']));
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).toContain('Alpha');
    expect(inputValue(view.container, 'Описание достижения')).toBe('');
    view.unmount();
  });

  it('does not restore a deleted achievement from a read started before the delete', async () => {
    const reads: Array<ReturnType<typeof deferred<ReturnType<typeof applicationResponse>>>> = [];
    harness.getAuthorApplication.mockImplementation(() => {
      const next = deferred<ReturnType<typeof applicationResponse>>();
      reads.push(next);
      return next.promise;
    });
    const view = mount();
    await until(view.container, () => reads.length === 1, 'initial application read');
    await act(async () => {
      reads[0]?.resolve(applicationResponse(['Listed']));
      await reads[0]?.promise;
    });
    await until(view.container, () => findButton(view.container, 'Удалить') instanceof HTMLButtonElement, 'delete');
    void view.queryClient.refetchQueries({ queryKey: ['seller', 'application'] });
    await until(view.container, () => reads.length === 2, 'application refetch');
    click(view.container, 'Удалить');
    await flush();
    await until(view.container, () => reads.length > 2, 'read after delete');
    await act(async () => {
      reads[1]?.resolve(applicationResponse(['Listed']));
      await reads[1]?.promise.catch(() => undefined);
      reads[reads.length - 1]?.resolve(applicationResponse([]));
      await reads[reads.length - 1]?.promise;
    });
    await flush();
    expect(view.container.textContent).not.toContain('Listed');
    expect(harness.deleteAuthorAchievement).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('shows a retry and releases the profile when the read after add fails', async () => {
    const reads: Array<ReturnType<typeof deferred<ReturnType<typeof applicationResponse>>>> = [];
    harness.getAuthorApplication.mockImplementation(() => {
      const next = deferred<ReturnType<typeof applicationResponse>>();
      reads.push(next);
      return next.promise;
    });
    const view = mount();
    await openEditor(view);
    fillAchievement(view.container, 'Alpha');
    click(view.container, 'Сохранить достижение');
    await until(view.container, () => reads.length > 1, 'read after add');
    await act(async () => {
      reads[1]?.reject(new Error('refresh failed'));
      await reads[1]?.promise.catch(() => undefined);
    });
    await flush();
    expect(view.container.textContent).toContain('application-error');
    expect(inputValue(view.container, 'Описание достижения')).toBe('');
    click(view.container, 'Сохранить');
    await flush();
    expect(harness.updateProfile).toHaveBeenCalledTimes(1);
    expect(harness.addAuthorAchievement).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('does not publish an achievement refresh into the next session', async () => {
    const reads: Array<ReturnType<typeof deferred<ReturnType<typeof applicationResponse>>>> = [];
    harness.getAuthorApplication.mockImplementation(() => {
      const next = deferred<ReturnType<typeof applicationResponse>>();
      reads.push(next);
      return next.promise;
    });
    const view = mount();
    await openEditor(view);
    fillAchievement(view.container, 'Alpha');
    click(view.container, 'Сохранить достижение');
    await until(view.container, () => reads.length > 1, 'read after add');
    const refresh = reads.length - 1;
    await switchAccount(view, userB);
    await until(view.container, () => reads.length > refresh + 1, 'next session read');
    await act(async () => {
      reads[0]?.resolve(applicationResponse([]));
      await reads[0]?.promise.catch(() => undefined);
      reads[refresh]?.resolve(applicationResponse(['Alpha']));
      await reads[refresh]?.promise.catch(() => undefined);
      reads[reads.length - 1]?.resolve(applicationResponse(['Visible B']));
      await reads[reads.length - 1]?.promise;
    });
    await flush();
    expect(view.container.textContent).toContain('Visible B');
    expect(view.container.textContent).not.toContain('Alpha');
    view.unmount();
  });

  it('does not apply a photo chosen before a server lock after the form opens again', async () => {
    const picker = deferred<{ canceled: boolean; assets: Array<{ uri: string; fileName: string }> }>();
    harness.launchImageLibraryAsync.mockReturnValueOnce(picker.promise);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => new Blob(['old'], { type: 'image/png' }) })),
    );
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await until(view.container, () => harness.launchImageLibraryAsync.mock.calls.length === 1, 'picker opened');
    publishProfile(view, revisionSnapshot('PENDING_REVIEW', '2026-09-28T00:00:00.000Z'));
    await until(view.container, () => view.container.textContent?.includes('Заявка на проверке') === true, 'server lock');
    publishProfile(view, revisionSnapshot('CHANGES_REQUESTED', '2026-09-29T00:00:00.000Z'));
    await until(view.container, () => findButton(view.container, 'Сохранить достижение') !== undefined, 'server unlock');
    fillAchievement(view.container, 'Beta');
    await act(async () => {
      picker.resolve({ canceled: false, assets: [{ uri: 'file:///old.png', fileName: 'old.png' }] });
      await picker.promise;
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('Beta');
    expect(view.container.textContent).not.toContain('Фото: old.png');
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    view.unmount();
  });

  it('does not apply a blob that finishes after a server lock and unlock', async () => {
    const picker = deferred<{ canceled: boolean; assets: Array<{ uri: string; fileName: string }> }>();
    const blob = deferred<Blob>();
    harness.launchImageLibraryAsync.mockReturnValueOnce(picker.promise);
    const fetchMock = vi.fn(() => Promise.resolve({ blob: () => blob.promise }));
    vi.stubGlobal('fetch', fetchMock);
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await act(async () => {
      picker.resolve({ canceled: false, assets: [{ uri: 'file:///old.png', fileName: 'old.png' }] });
      await picker.promise;
    });
    await until(view.container, () => fetchMock.mock.calls.length === 1, 'blob requested');
    publishProfile(view, revisionSnapshot('PENDING_REVIEW', '2026-09-28T00:00:00.000Z'));
    await until(view.container, () => view.container.textContent?.includes('Заявка на проверке') === true, 'server lock');
    publishProfile(view, revisionSnapshot('CHANGES_REQUESTED', '2026-09-29T00:00:00.000Z'));
    await until(view.container, () => findButton(view.container, 'Сохранить достижение') !== undefined, 'server unlock');
    fillAchievement(view.container, 'Beta');
    await act(async () => {
      blob.resolve(new Blob(['old']));
      await blob.promise;
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('Beta');
    expect(view.container.textContent).not.toContain('Фото: old.png');
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    view.unmount();
  });

  it('does not publish a picker or blob error that arrives after a server lock and unlock', async () => {
    const picker = deferred<{ canceled: boolean; assets: Array<{ uri: string; fileName: string }> }>();
    harness.launchImageLibraryAsync.mockReturnValueOnce(picker.promise);
    const view = mount();
    await openEditor(view);
    click(view.container, 'Добавить фото (необязательно)');
    await until(view.container, () => harness.launchImageLibraryAsync.mock.calls.length === 1, 'picker opened');
    publishProfile(view, revisionSnapshot('PENDING_REVIEW', '2026-09-28T00:00:00.000Z'));
    await until(view.container, () => view.container.textContent?.includes('Заявка на проверке') === true, 'server lock');
    publishProfile(view, revisionSnapshot('CHANGES_REQUESTED', '2026-09-29T00:00:00.000Z'));
    await until(view.container, () => findButton(view.container, 'Сохранить достижение') !== undefined, 'server unlock');
    fillAchievement(view.container, 'Beta');
    await act(async () => {
      picker.reject(new Error('picker failed'));
      await picker.promise.catch(() => undefined);
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('Beta');
    expect(view.container.textContent).not.toContain('Не удалось выбрать фото');

    const latePicker = deferred<{ canceled: boolean; assets: Array<{ uri: string; fileName: string }> }>();
    const blob = deferred<Blob>();
    harness.launchImageLibraryAsync.mockReturnValueOnce(latePicker.promise);
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => blob.promise })));
    click(view.container, 'Добавить фото (необязательно)');
    await act(async () => {
      latePicker.resolve({ canceled: false, assets: [{ uri: 'file:///old.png', fileName: 'old.png' }] });
      await latePicker.promise;
    });
    await until(view.container, () => vi.mocked(fetch).mock.calls.length === 1, 'blob requested');
    publishProfile(view, revisionSnapshot('PENDING_REVIEW', '2026-09-30T00:00:00.000Z'));
    await until(view.container, () => view.container.textContent?.includes('Заявка на проверке') === true, 'second server lock');
    publishProfile(view, revisionSnapshot('CHANGES_REQUESTED', '2026-10-01T00:00:00.000Z'));
    await until(view.container, () => findButton(view.container, 'Сохранить достижение') !== undefined, 'second server unlock');
    setInput(view.container, 'Описание достижения', 'Beta');
    await act(async () => {
      blob.reject(new Error('blob failed'));
      await blob.promise.catch(() => undefined);
    });
    await flush();
    expect(inputValue(view.container, 'Описание достижения')).toBe('Beta');
    expect(view.container.textContent).not.toContain('Не удалось выбрать фото');
    expect(view.container.textContent).not.toContain('Фото: old.png');
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    view.unmount();
  });

  it('applies a new photo chosen after a server lock and unlock', async () => {
    const view = mount();
    await openEditor(view);
    publishProfile(view, revisionSnapshot('PENDING_REVIEW', '2026-09-28T00:00:00.000Z'));
    await until(view.container, () => view.container.textContent?.includes('Заявка на проверке') === true, 'server lock');
    publishProfile(view, revisionSnapshot('CHANGES_REQUESTED', '2026-09-29T00:00:00.000Z'));
    await until(view.container, () => findButton(view.container, 'Сохранить достижение') !== undefined, 'server unlock');
    const picker = deferred<{ canceled: boolean; assets: Array<{ uri: string; fileName: string }> }>();
    harness.launchImageLibraryAsync.mockReturnValueOnce(picker.promise);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => new Blob(['new'], { type: 'image/png' }) })),
    );
    click(view.container, 'Добавить фото (необязательно)');
    await act(async () => {
      picker.resolve({ canceled: false, assets: [{ uri: 'file:///new.png', fileName: 'new.png' }] });
      await picker.promise;
    });
    await flush();
    expect(view.container.textContent).toContain('Фото: new.png');
    expect(harness.updateProfile).not.toHaveBeenCalled();
    expect(harness.submitAuthorApplication).not.toHaveBeenCalled();
    view.unmount();
  });
});

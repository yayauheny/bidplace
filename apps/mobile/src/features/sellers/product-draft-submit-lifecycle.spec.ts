/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { workImageMaxInputBytes } from '@bidplace/contracts';
import type { ApiClient } from '@bidplace/api-client';
import { useProductDraftImageActions } from './product-draft-image-actions';
import type { ProductDraftSaveSession } from './product-draft-save';
import type { ProductStoryEditor } from './use-product-story-editor';

import { flush, setInput } from '../../testing/dom';

import { advanceAuthEpoch, authKeys, clearAuthenticatedSession } from '../../lib/query-cache';
import { ownerWorkQueryKeys } from './owner-work-query';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.mock('../../components/shared/PrivateStoryImage', () => ({ PrivateStoryImage: () => null }));
vi.mock('../../components/figma/FigmaIcon', () => ({ FigmaIcon: () => null }));
vi.mock('../../components/ui/MotionPressable', () => ({
  MotionPressable: ({ children, accessibilityLabel, disabled, onPress }: {
    children?: ReactNode; accessibilityLabel?: string; disabled?: boolean; onPress?: () => void;
  }) => createElement('button', { 'aria-label': accessibilityLabel, disabled, onClick: onPress }, children),
}));


const productId = '11111111-1111-4111-8111-111111111111';
const categoryId = '33333333-3333-4333-8333-333333333333';

const harness = vi.hoisted(() => ({
  replace: vi.fn(),
  setParams: vi.fn(),
  dispatch: vi.fn(),
  listCategories: vi.fn(),
  getProduct: vi.fn(),
  updateProduct: vi.fn(),
  submitProduct: vi.fn(),
  addImages: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('../../components/figma/FigmaIconButton', () => ({
  FigmaIconButton: ({ label, onPress, disabled }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => createElement('button', {
    type: 'button',
    'aria-label': label,
    disabled,
    onClick: onPress,
  }, label),
}));

vi.mock('./product-draft-story', () => ({
  ProductDraftStoryStep: () => null,
}));

vi.mock('../../components/figma/FigmaChoiceChip', () => ({
  FigmaChoiceChip: ({
    label,
    selected,
    onPress,
    disabled,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    disabled?: boolean;
  }) => createElement('button', {
    type: 'button',
    disabled,
    'aria-pressed': selected,
    onClick: onPress,
  }, label),
}));

vi.mock('../../components/figma/FigmaSelectField', () => ({
  FigmaSelectField: ({
    label,
    value,
    disabled,
    onPress,
  }: {
    label: string;
    value: string;
    disabled?: boolean;
    onPress: () => void;
  }) => createElement('button', {
    type: 'button',
    'aria-label': label,
    disabled,
    onClick: () => onPress(),
  }, value || label),
}));

vi.mock('./product-catalog-term-sheet', () => ({
  ProductCatalogTermSheet: () => null,
}));

vi.mock('react-native', () => ({
  ActivityIndicator: () => createElement('span', { role: 'progressbar' }),
  Image: ({ source, accessibilityLabel }: { source: { uri: string }; accessibilityLabel: string }) => createElement('img', { src: source.uri, alt: accessibilityLabel }),
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: harness.replace, setParams: harness.setParams }),
  useNavigation: () => ({ dispatch: harness.dispatch }),
}));

vi.mock('expo-router/build/react-navigation/core', () => ({
  usePreventRemove: () => undefined,
}));

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: harness.launchImageLibraryAsync,
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    categories: { list: harness.listCategories },
    catalog: { listTerms: async () => ({ terms: [] }) },
    sellers: { getProduct: harness.getProduct },
    products: {
      create: vi.fn(),
      update: harness.updateProduct,
      submit: harness.submitProduct,
    },
    images: { add: harness.addImages, remove: vi.fn(), reorder: vi.fn() },
  }),
}));

vi.mock('../../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  FormPageShell: ({ children, bottomAction }: { children?: ReactNode; bottomAction?: ReactNode }) => createElement('div', null, children, bottomAction),
  FormPageColumns: ({ children, sidebar }: { children?: ReactNode; sidebar?: ReactNode }) =>
    createElement('div', null, sidebar, children),
}));

vi.mock('../../components/shared/InfrastructurePageStatus', () => ({
  InfrastructurePageStatus: ({ onRetry }: { onRetry?: () => void }) =>
    createElement('button', { type: 'button', onClick: () => onRetry?.() }, 'Повторить'),
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
    AppDialog: () => null,
    AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
    PrimaryButton: PressButton,
    FormSection: ({ children }: { children?: ReactNode }) => createElement('section', null, children),
    PageState: () => null,
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
        onChange: (event: { target: { value: string } }) => onChangeText?.(event.target.value),
      }),
  };
});

import { ProductDraftScreen } from './product-draft-screen';

function product(status = 'DRAFT', title = 'Saved title') {
  return {
    id: productId,
    publicId: 'draftwork01',
    sellerProfileId: '44444444-4444-4444-8444-444444444444',
    categoryId,
    title,
    story: '',
    technique: 'Oil',
    materials: '',
    dimensions: '',
    weight: null,
    year: null,
    condition: null,
    uniqueness: '',
    provenance: null,
    city: null,
    packaging: null,
    deliveryInfo: null,
    publishedAt: null,
    status,
    images: [
      {
        id: '55555555-5555-4555-8555-555555555555',
        position: 0,
        url: '/api/images/55555555-5555-4555-8555-555555555555',
        mimeType: 'image/png',
        byteLength: 4,
        checksum: 'a'.repeat(64),
        width: null,
        height: null,
      },
    ],
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
  };
}

function detail(status = 'DRAFT', title = 'Saved title', updatedAt = '2026-09-27T00:00:00.000Z') {
  const next = product(status, title);
  next.updatedAt = updatedAt;
  return {
    product: next,
    editingRevision: {
      id: '22222222-2222-4222-8222-222222222222',
      version: 1,
      status,
      updatedAt,
    },
    creationIntro: null,
    creationSteps: [],
    lastModerationReason: status === 'CHANGES_REQUESTED' ? 'Уточните название' : null,
  };
}

function mount(props: { flow?: string; stepParam?: '4' | '2' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, { id: 'user-a' });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ProductDraftScreen, { productId, flow: props.flow, stepParam: props.stepParam }),
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

async function until(container: HTMLElement, predicate: () => boolean, label: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await flush();
  }
  throw new Error(`Timed out waiting for ${label}. Body: ${container.textContent}`);
}

function button(container: ParentNode, label: string) {
  return [...container.querySelectorAll('button')].find((node) => node.textContent === label || node.getAttribute('aria-label') === label) ?? null;
}

beforeEach(() => {
  harness.replace.mockReset();
  harness.setParams.mockReset();
  harness.dispatch.mockReset();
  harness.listCategories.mockReset();
  harness.getProduct.mockReset();
  harness.updateProduct.mockReset();
  harness.submitProduct.mockReset();
  harness.addImages.mockReset();
  harness.launchImageLibraryAsync.mockReset();
  harness.addImages.mockResolvedValue({ ok: true });
  harness.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
  harness.listCategories.mockResolvedValue({
    categories: [{ id: categoryId, slug: 'painting', name: 'Painting' }],
  });
  harness.getProduct.mockResolvedValue(detail());
  harness.updateProduct.mockResolvedValue({ product: product() });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function mountImageActions(editorStatus: 'DRAFT' | 'APPROVED' = 'DRAFT') {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.session, { id: 'user-a' });
  const session = {
    transitionLock: { current: false },
    snapshotOperation: () => 0,
    isCurrentOperation: vi.fn(() => true),
    persistedProductId: vi.fn(() => productId),
    inFlightSave: vi.fn(() => null),
    persistCurrentForm: vi.fn(async () => true),
  };
  let actions!: ReturnType<typeof useProductDraftImageActions>;
  const root = createRoot(document.createElement('div'));
  function Probe() {
    actions = useProductDraftImageActions({
      api: { images: { add: harness.addImages } } as unknown as ApiClient,
      queryClient,
      authEpoch: 0,
      existingProduct: { id: productId, images: [] },
      editorStatus,
      session: session as unknown as ProductDraftSaveSession,
      storyEditor: {} as ProductStoryEditor,
    });
    return null;
  }
  act(() => root.render(createElement(QueryClientProvider, { client: queryClient }, createElement(Probe))));
  return { get actions() { return actions; }, queryClient, session, unmount: () => act(() => root.unmount()) };
}

describe('product draft submit lifecycle', () => {
  it('allows a slow large upload and retries a timed-out request with the same identity', async () => {
    const image = new Blob([new Uint8Array(25 * 1024 * 1024)], { type: 'image/png' });
    harness.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:large', file: image }] });
    harness.addImages.mockImplementationOnce((_id, _images, _key, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })).mockResolvedValue({ ok: true });
    const timer = vi.spyOn(globalThis, 'setTimeout');
    const view = mount();
    try {
      await until(view.container, () => Boolean(button(view.container, 'Добавить изображения')), 'images');
      act(() => button(view.container, 'Добавить изображения')?.click());
      await until(view.container, () => harness.addImages.mock.calls.length === 1, 'upload');
      const deadline = timer.mock.calls.find((call) => call[1] === 460_000);
      expect(deadline).toBeDefined();
      await act(async () => {
        const expire = deadline![0];
        if (typeof expire !== 'function') throw new Error('Expected a timeout callback');
        expire();
        await Promise.resolve();
      });
      await until(view.container, () => Boolean(button(view.container, 'Повторить загрузку')), 'retry');
      await until(view.container, () => Boolean(view.container.textContent?.includes('Загрузка заняла слишком много времени')), 'timeout feedback');
      expect(view.container.textContent).toContain('Загрузка заняла слишком много времени');
      act(() => button(view.container, 'Повторить загрузку')?.click());
      await until(view.container, () => harness.addImages.mock.calls.length === 2, 'second upload');
      expect(harness.addImages.mock.calls[1]?.slice(0, 3)).toEqual(harness.addImages.mock.calls[0]?.slice(0, 3));
    } finally { view.unmount(); timer.mockRestore(); }
  });

  it('blocks backward navigation while an image is being sent', async () => {
    harness.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:image', file: new Blob(['image'], { type: 'image/png' }) }] });
    let finish: () => void = () => undefined;
    harness.addImages.mockImplementation(() => new Promise((resolve) => { finish = () => resolve({ ok: true }); }));
    const view = mount({ flow: 'creation', stepParam: '2' });
    try {
      await until(view.container, () => Boolean(button(view.container, 'Добавить изображения')), 'images');
      act(() => button(view.container, 'Добавить изображения')?.click());
      await until(view.container, () => harness.addImages.mock.calls.length === 1, 'upload');
      expect(button(view.container, 'Назад')?.disabled).toBe(true);
      harness.setParams.mockClear();
      act(() => button(view.container, 'Назад')?.click());
      expect(harness.setParams).not.toHaveBeenCalled();
      await act(async () => { finish(); await Promise.resolve(); });
      await until(view.container, () => !button(view.container, 'Назад')?.disabled, 'unlock');
    } finally { view.unmount(); }
  });

  it('keeps a submitted draft closed until a newer moderation decision arrives', async () => {
    let resolveSubmit: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount();
    await until(view.container, () => button(view.container, 'Отправить на модерацию') instanceof HTMLButtonElement, 'submit');
    act(() => {
      button(view.container, 'Отправить на модерацию')?.click();
    });
    await flush();
    await act(async () => {
      resolveSubmit({ product: product('PENDING_REVIEW') });
      await Promise.resolve();
    });
    await flush();
    await flush();
    const cached = view.queryClient.getQueryData<{ editingRevision?: { status: string } }>(
      ownerWorkQueryKeys.detail(productId),
    );
    expect(cached?.editingRevision?.status).toBe('DRAFT');
    expect(button(view.container, 'Отправить на модерацию')?.hasAttribute('disabled')).not.toBe(false);
    expect(button(view.container, 'Сохранить изменения')).toBeNull();
    const title = view.container.querySelector<HTMLInputElement>('[aria-label="Название"]');
    expect(title?.disabled).toBe(true);
    act(() => {
      view.queryClient.setQueryData(
        ownerWorkQueryKeys.detail(productId),
        detail('CHANGES_REQUESTED', 'Saved title', '2026-09-30T00:00:00.000Z'),
      );
    });
    await flush();
    setInput(view.container, 'Название', 'Revised title');
    await flush();
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value).toBe(
      'Revised title',
    );
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.disabled).toBe(false);
    view.unmount();
  });

  it('enables Close after a creation submit and still accepts a later rejection', async () => {
    let resolveSubmit: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount({ flow: 'creation', stepParam: '4' });
    await until(view.container, () => button(view.container, 'Отправить на модерацию') instanceof HTMLButtonElement, 'submit');
    act(() => {
      button(view.container, 'Отправить на модерацию')?.click();
    });
    await flush();
    await act(async () => {
      resolveSubmit({ product: product('PENDING_REVIEW') });
      await Promise.resolve();
    });
    await flush();
    await flush();
    const close = button(view.container, 'Закрыть');
    expect(close).toBeInstanceOf(HTMLButtonElement);
    expect(close?.hasAttribute('disabled')).toBe(false);
    expect(button(view.container, 'Отправить на модерацию')).toBeNull();
    act(() => {
      view.queryClient.setQueryData(
        ownerWorkQueryKeys.detail(productId),
        detail('REJECTED', 'Saved title', '2026-09-30T00:00:00.000Z'),
      );
    });
    await flush();
    expect(button(view.container, 'Повторно отправить на модерацию')).toBeInstanceOf(HTMLButtonElement);
    view.unmount();
  });

  it('releases the transition lock when the post-submit refetch fails', async () => {
    let resolveSubmit: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount({ flow: 'creation', stepParam: '4' });
    await until(view.container, () => button(view.container, 'Отправить на модерацию') instanceof HTMLButtonElement, 'submit');
    act(() => {
      button(view.container, 'Отправить на модерацию')?.click();
    });
    await flush();
    harness.getProduct.mockRejectedValue(new Error('refetch failed'));
    await act(async () => {
      resolveSubmit({ product: product('PENDING_REVIEW') });
      await Promise.resolve();
    });
    await until(view.container, () => button(view.container, 'Повторить') instanceof HTMLButtonElement, 'retry');
    harness.getProduct.mockResolvedValue(detail('CHANGES_REQUESTED', 'Saved title', '2026-09-30T00:00:00.000Z'));
    act(() => {
      button(view.container, 'Повторить')?.click();
    });
    await until(
      view.container,
      () => button(view.container, 'Повторно отправить на модерацию') instanceof HTMLButtonElement,
      'recovered submit',
    );
    expect(button(view.container, 'Повторно отправить на модерацию')?.hasAttribute('disabled')).toBe(false);
    expect(button(view.container, 'Закрыть')?.hasAttribute('disabled')).toBe(false);
    view.unmount();
  });

  it.each([
    ['another account', 'user-b'],
    ['the same account', 'user-a'],
  ] as const)('does not submit a work update that finishes after login of %s', async (_label, nextUserId) => {
    let resolveUpdate: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    const view = mount();
    await until(view.container, () => button(view.container, 'Отправить на модерацию') instanceof HTMLButtonElement, 'submit');
    act(() => {
      button(view.container, 'Отправить на модерацию')?.click();
    });
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    const workB = detail('DRAFT', 'User B title', '2026-09-30T00:00:00.000Z');
    harness.getProduct.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: nextUserId });
      view.queryClient.setQueryData(ownerWorkQueryKeys.detail(productId), workB);
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    await act(async () => {
      resolveUpdate({ product: product('DRAFT', 'From user A') });
      await Promise.resolve();
    });
    await flush();
    expect(harness.submitProduct).not.toHaveBeenCalled();
    expect(view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId))).toEqual(workB);
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value).toBe('User B title');
    view.unmount();
  });

  it.each(['CHANGES_REQUESTED', 'REJECTED'] as const)(
    'keeps a resubmitted %s work locked when the refetch is the previous snapshot',
    async (status) => {
      const initial = detail(status, 'Needs changes', '2026-09-27T00:00:00.000Z');
      harness.getProduct.mockResolvedValue(initial);
      let resolveSubmit: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
      harness.submitProduct.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          }),
      );
      const view = mount();
      await until(
        view.container,
        () => button(view.container, 'Повторно отправить на модерацию') instanceof HTMLButtonElement,
        'resubmit',
      );
      act(() => {
        button(view.container, 'Повторно отправить на модерацию')?.click();
      });
      await flush();
      await act(async () => {
        resolveSubmit({ product: product('PENDING_REVIEW', 'Needs changes') });
        await Promise.resolve();
      });
      await flush();
      await flush();
      expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.disabled).toBe(true);
      expect(button(view.container, 'Сохранить изменения')).toBeNull();
      expect(button(view.container, 'Повторно отправить на модерацию')?.hasAttribute('disabled')).not.toBe(false);
      view.unmount();
    },
  );

  it('opens editing after a newer approval even when the parent clock did not move', async () => {
    const initial = detail('CHANGES_REQUESTED', 'Needs changes', '2026-09-27T00:00:00.000Z');
    harness.getProduct.mockResolvedValue(initial);
    let resolveSubmit: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => button(view.container, 'Повторно отправить на модерацию') instanceof HTMLButtonElement,
      'resubmit',
    );
    act(() => {
      button(view.container, 'Повторно отправить на модерацию')?.click();
    });
    await flush();
    const approved = detail('APPROVED', 'Approved title', '2026-09-27T00:00:00.000Z');
    approved.editingRevision.updatedAt = '2026-09-30T00:00:00.000Z';
    approved.editingRevision.status = 'APPROVED';
    harness.getProduct.mockResolvedValue(approved);
    await act(async () => {
      resolveSubmit({ product: product('PENDING_REVIEW', 'Needs changes') });
      await Promise.resolve();
    });
    await flush();
    await flush();
    setInput(view.container, 'Название', 'Edited after approval');
    await flush();
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.disabled).toBe(false);
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value).toBe(
      'Edited after approval',
    );
    view.unmount();
  });

  it('does not let a stale moderation snapshot replace a newer decision', async () => {
    const initial = detail('CHANGES_REQUESTED', 'Needs changes', '2026-09-27T00:00:00.000Z');
    harness.getProduct.mockResolvedValue(initial);
    let resolveSubmit: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    let resolveRefetch: (value: ReturnType<typeof detail>) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => button(view.container, 'Повторно отправить на модерацию') instanceof HTMLButtonElement,
      'resubmit',
    );
    harness.getProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefetch = resolve;
        }),
    );
    act(() => {
      button(view.container, 'Повторно отправить на модерацию')?.click();
    });
    await flush();
    await act(async () => {
      resolveSubmit({ product: product('PENDING_REVIEW', 'Needs changes') });
      await Promise.resolve();
    });
    await flush();
    const approved = detail('APPROVED', 'Approved title', '2026-09-27T00:00:00.000Z');
    approved.editingRevision.updatedAt = '2026-09-30T00:00:00.000Z';
    approved.editingRevision.status = 'APPROVED';
    act(() => {
      view.queryClient.setQueryData(ownerWorkQueryKeys.detail(productId), approved);
    });
    await flush();
    await act(async () => {
      resolveRefetch(initial);
      await Promise.resolve();
    });
    await flush();
    expect(view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId))).toEqual(approved);
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value).toBe('Approved title');
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.disabled).toBe(false);
    view.unmount();
  });

  it('selects without reading or uploading and freezes the inputs when upload starts', async () => {
    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.png', { type: 'image/png' });
    const assets = [{ uri: 'blob:first', file: first }, { uri: 'blob:second', file: second }];
    harness.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets });
    const read = vi.fn();
    vi.stubGlobal('fetch', read);
    const view = mountImageActions();
    try {
      const selected = await act(() => view.actions.selectImages());
      expect(selected).toBeDefined();
      expect(harness.addImages).not.toHaveBeenCalled();
      expect(read).not.toHaveBeenCalled();
      expect(view.actions.uploadFiles).toEqual([]);
      const selection = selected!;
      await act(async () => {
        const start = view.actions.startUpload(selection);
        // A future editor may retain its input; started batches own a snapshot.
        selection.images[1]!.file = first;
        await Promise.all([start, view.actions.startUpload(selection)]);
      });
      await flush();
      expect(harness.addImages.mock.calls.map((call) => call[1])).toEqual([[first], [second]]);
      expect(read).not.toHaveBeenCalled();
      await act(() => view.actions.startUpload(selection));
      await flush();
      expect(harness.addImages).toHaveBeenCalledTimes(2);
    } finally { view.unmount(); }
  });

  it.each(['unmount', 'session-change', 'operation-change', 'product-change', 'new-selection'] as const)(
    'rejects a deferred selection after %s',
    async (reason) => {
      harness.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:photo' }] });
      const read = vi.fn();
      vi.stubGlobal('fetch', read);
      const view = mountImageActions();
      const selected = (await act(() => view.actions.selectImages()))!;
      try {
        if (reason === 'unmount') view.unmount();
        else if (reason === 'session-change') await act(() => clearAuthenticatedSession(view.queryClient));
        else if (reason === 'operation-change') view.session.isCurrentOperation.mockReturnValue(false);
        else if (reason === 'product-change') view.session.persistedProductId.mockReturnValue('other-work');
        else await act(() => view.actions.selectImages());
        await act(() => view.actions.startUpload(selected));
        await flush();
        expect(read).not.toHaveBeenCalled();
        expect(harness.addImages).not.toHaveBeenCalled();
      } finally { if (reason !== 'unmount') view.unmount(); }
    },
  );

  it('waits for the current approved form save before starting a deferred upload', async () => {
    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    harness.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:photo', file }] });
    const view = mountImageActions('APPROVED');
    try {
      const selected = (await act(() => view.actions.selectImages()))!;
      let finishSave!: (saved: boolean) => void;
      view.session.persistCurrentForm.mockImplementation(() => new Promise((resolve) => { finishSave = resolve; }));
      let start!: Promise<void>;
      act(() => { start = view.actions.startUpload(selected); });
      await act(() => view.actions.startUpload(selected));
      expect(harness.addImages).not.toHaveBeenCalled();
      await act(async () => { finishSave(true); await start; });
      await flush();
      expect(harness.addImages).toHaveBeenCalledTimes(1);
      expect(harness.addImages.mock.calls[0]?.[1]).toEqual([file]);
    } finally { view.unmount(); }
  });

  it.each(['failed-save', 'session-change', 'unmount'] as const)(
    'does not start a deferred upload when the approved save ends after %s',
    async (reason) => {
      harness.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:photo' }] });
      const view = mountImageActions('APPROVED');
      const selected = (await act(() => view.actions.selectImages()))!;
      let finishSave!: (saved: boolean) => void;
      view.session.persistCurrentForm.mockImplementation(() => new Promise((resolve) => { finishSave = resolve; }));
      let start!: Promise<void>;
      act(() => { start = view.actions.startUpload(selected); });
      try {
        if (reason === 'unmount') view.unmount();
        else if (reason === 'session-change') await act(() => clearAuthenticatedSession(view.queryClient));
        await act(async () => { finishSave(reason !== 'failed-save'); await start; });
        await flush();
        expect(harness.addImages).not.toHaveBeenCalled();
      } finally { if (reason !== 'unmount') view.unmount(); }
    },
  );

  it.each([
    { fileSize: 0, message: 'Выбранный файл пустой.' },
    { fileSize: workImageMaxInputBytes + 1, message: 'Исходный файл слишком большой.' },
  ])('reports an invalid $fileSize-byte Work file without uploading', async ({ fileSize, message }) => {
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:invalid', fileSize, file: new Blob([]) }],
    });
    const view = mount();
    try {
      await until(view.container, () => Boolean(button(view.container, 'Добавить изображения')), 'images');
      act(() => button(view.container, 'Добавить изображения')?.click());
      await until(view.container, () => Boolean(view.container.textContent?.includes(message)), 'file error');
      expect(harness.addImages).not.toHaveBeenCalled();
    } finally { view.unmount(); }
  });

  it.each(['picker', 'read'] as const)('ignores a late %s result after unmount', async (phase) => {
    const file = new Blob(['photo'], { type: 'image/png' });
    let finish!: () => void;
    if (phase === 'picker') {
      harness.launchImageLibraryAsync.mockImplementation(() => new Promise((resolve) => {
        finish = () => resolve({ canceled: false, assets: [{ uri: 'blob:photo' }] });
      }));
    } else {
      harness.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:photo' }] });
      vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => {
        finish = () => resolve({ ok: true, blob: async () => file });
      })));
    }
    const view = mountImageActions();
    let choosing!: Promise<void>;
    act(() => { choosing = view.actions.chooseImages(); });
    await flush();
    view.unmount();
    await act(async () => { finish(); await choosing; });
    await flush();
    expect(harness.addImages).not.toHaveBeenCalled();
  });

  it('retries an unknown upload response with the same blobs and identity without reopening the picker', async () => {
    const image = new Blob(['image'], { type: 'image/png' });
    harness.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:image' }] });
    harness.addImages.mockRejectedValueOnce(new Error('response lost')).mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => image })));
    const view = mount();
    await until(view.container, () => Boolean(button(view.container, 'Добавить изображения')), 'images');
    act(() => button(view.container, 'Добавить изображения')?.click());
    await until(view.container, () => Boolean(button(view.container, 'Повторить загрузку')), 'retry');
    act(() => button(view.container, 'Повторить загрузку')?.click());
    await flush();
    expect(harness.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
    expect(harness.addImages).toHaveBeenCalledTimes(2);
    expect(harness.addImages.mock.calls[1]?.slice(0, 3)).toEqual(harness.addImages.mock.calls[0]?.slice(0, 3));
    expect(harness.addImages.mock.calls[0]?.[2]).toEqual(expect.any(String));
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('preserves an unfinished batch until retry completes before allowing another selection', async () => {
    const images = [
      new Blob(['first'], { type: 'image/png' }),
      new Blob(['second'], { type: 'image/png' }),
    ];
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:first' }, { uri: 'blob:second' }],
    });
    let finishFirst: () => void = () => undefined;
    harness.addImages
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = () => resolve({ ok: true });
          }),
      )
      .mockRejectedValueOnce(new Error('response lost'))
      .mockResolvedValue({ ok: true });
    const read = vi.fn(async (uri: string) => ({
      ok: true,
      blob: async () => images[uri === 'blob:first' ? 0 : 1],
    }));
    vi.stubGlobal('fetch', read);
    const view = mount({ flow: 'creation', stepParam: '2' });
    await until(
      view.container,
      () => Boolean(button(view.container, 'Добавить изображения')),
      'images',
    );
    act(() => button(view.container, 'Добавить изображения')?.click());
    await until(
      view.container,
      () => harness.addImages.mock.calls.length === 1,
      'first upload',
    );
    expect(read).toHaveBeenCalledTimes(1);
    expect(view.container.textContent).toContain('Загрузка фото…');
    await act(async () => {
      finishFirst();
      await Promise.resolve();
    });
    await until(
      view.container,
      () => Boolean(button(view.container, 'Повторить загрузку')),
      'second failed',
    );
    expect(view.container.textContent).not.toContain('Изображение 1: загружено');
    expect(harness.getProduct.mock.calls.length).toBeGreaterThan(1);
    const secondKey = harness.addImages.mock.calls[1]?.[2];
    const add = button(view.container, 'Добавить изображения') as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    act(() => add.click());
    expect(harness.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
    expect(harness.addImages).toHaveBeenCalledTimes(2);
    expect(button(view.container, 'Продолжить')?.disabled).toBe(true);
    expect(button(view.container, '3. История создания')?.disabled).toBe(true);
    expect(button(view.container, '4. Проверка')?.disabled).toBe(true);
    expect(button(view.container, 'Назад')?.disabled).toBe(false);
    harness.setParams.mockClear();
    act(() => button(view.container, 'Продолжить')?.click());
    expect(harness.setParams).not.toHaveBeenCalled();
    act(() => button(view.container, 'Повторить загрузку')?.click());
    await until(
      view.container,
      () => harness.addImages.mock.calls.length === 3,
      'retry second',
    );
    await flush();
    expect(harness.addImages.mock.calls.map((call) => call[1])).toEqual([
      [images[0]],
      [images[1]],
      [images[1]],
    ]);
    expect(harness.addImages.mock.calls[2]?.[2]).toBe(secondKey);
    expect(read).toHaveBeenCalledTimes(2);
    await until(view.container, () => !add.disabled, 'another selection enabled');
    harness.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    act(() => add.click());
    await until(view.container, () => harness.launchImageLibraryAsync.mock.calls.length === 2, 'another selection');
    expect(harness.addImages).toHaveBeenCalledTimes(3);
    await until(view.container, () => button(view.container, 'Продолжить')?.disabled === false, 'continue after retry');
    act(() => button(view.container, 'Продолжить')?.click());
    await until(view.container, () => harness.setParams.mock.calls.some(([params]) => params.step === '3'), 'story navigation');
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('discards a terminal failed queue without removing already saved photos', async () => {
    const image = new Blob(['first'], { type: 'image/png' });
    const initial = detail();
    const saved = detail();
    saved.product.images.push({
      ...saved.product.images[0]!,
      id: '66666666-6666-4666-8666-666666666666',
      position: 1,
      url: '/api/images/66666666-6666-4666-8666-666666666666',
    });
    harness.getProduct.mockResolvedValue(initial);
    harness.addImages.mockImplementationOnce(async () => {
      harness.getProduct.mockResolvedValue(saved);
      return { ok: true };
    });
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'blob:first', file: image },
        { uri: 'blob:too-large', fileSize: workImageMaxInputBytes + 1 },
        { uri: 'blob:queued', file: image },
      ],
    });
    const view = mount({ flow: 'creation', stepParam: '2' });
    try {
      await until(view.container, () => Boolean(button(view.container, 'Добавить изображения')), 'images');
      act(() => button(view.container, 'Добавить изображения')?.click());
      await until(view.container, () => Boolean(button(view.container, 'Отменить загрузку')) &&
        !(button(view.container, 'Отменить загрузку') as HTMLButtonElement).disabled, 'terminal failure');
      expect(harness.addImages).toHaveBeenCalledTimes(1);
      expect(button(view.container, 'Продолжить')?.disabled).toBe(true);
      expect((button(view.container, 'Добавить изображения') as HTMLButtonElement).disabled).toBe(true);
      act(() => button(view.container, 'Отменить загрузку')?.click());
      await until(view.container, () => !(button(view.container, 'Добавить изображения') as HTMLButtonElement).disabled, 'another selection enabled');
      expect(button(view.container, 'Повторить загрузку')).toBeNull();
      expect(button(view.container, 'Продолжить')?.disabled).toBe(false);
      expect(view.container.querySelectorAll('img[alt^="Выбранное изображение"]')).toHaveLength(0);
      expect(view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId))).toEqual(saved);
      harness.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
      act(() => button(view.container, 'Добавить изображения')?.click());
      await until(view.container, () => harness.launchImageLibraryAsync.mock.calls.length === 2, 'another selection');
      expect(harness.addImages).toHaveBeenCalledTimes(1);
      expect(view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId))).toEqual(saved);
    } finally { view.unmount(); }
  });

  it.each(['unmount', 'session-change'] as const)(
    'aborts the active upload and drops queued files after %s',
    async (reason) => {
      const image = new Blob(['photo'], { type: 'image/png' });
      harness.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [
          { uri: 'blob:first', file: image },
          { uri: 'blob:second', file: image },
        ],
      });
      harness.addImages.mockImplementation(
        (_id, _images, _key, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      );
      const view = mount();
      let mounted = true;
      try {
        await until(
          view.container,
          () => Boolean(button(view.container, 'Добавить изображения')),
          'images',
        );
        act(() => button(view.container, 'Добавить изображения')?.click());
        await until(
          view.container,
          () => harness.addImages.mock.calls.length === 1,
          'first request',
        );
        const signal = harness.addImages.mock.calls[0]![3].signal as AbortSignal;
        expect(signal.aborted).toBe(false);
        if (reason === 'unmount') {
          view.unmount();
          mounted = false;
        } else
          await act(async () => {
            await clearAuthenticatedSession(view.queryClient);
          });
        await flush();
        expect(signal.aborted).toBe(true);
        expect(harness.addImages).toHaveBeenCalledTimes(1);
      } finally {
        if (mounted) view.unmount();
      }
    },
  );

  it('does not send a request when the file chooser is cancelled', async () => {
    const view = mount();
    try {
      await until(
        view.container,
        () => Boolean(button(view.container, 'Добавить изображения')),
        'images',
      );
      act(() => button(view.container, 'Добавить изображения')?.click());
      await flush();
      expect(harness.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
      expect(harness.addImages).not.toHaveBeenCalled();
      expect(button(view.container, 'Повторить загрузку')).toBeNull();
      expect(button(view.container, 'Добавить изображения')?.disabled).toBe(
        false,
      );
    } finally {
      view.unmount();
    }
  });

  it('does not upload a work image chosen by the previous session', async () => {
    const imageA = new Blob(['image-a'], { type: 'image/png' });
    let resolvePicker: (value: { canceled: boolean; assets: Array<{ uri: string }> }) => void = () => undefined;
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => imageA })));
    const view = mount();
    await until(
      view.container,
      () => button(view.container, 'Добавить изображения') instanceof HTMLButtonElement,
      'images',
    );
    act(() => {
      button(view.container, 'Добавить изображения')?.click();
    });
    await flush();
    const workB = detail('DRAFT', 'User B title', '2026-09-30T00:00:00.000Z');
    harness.getProduct.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-b' });
      view.queryClient.setQueryData(ownerWorkQueryKeys.detail(productId), workB);
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    await act(async () => {
      resolvePicker({ canceled: false, assets: [{ uri: 'blob:image-a' }] });
      await Promise.resolve();
    });
    await flush();
    expect(harness.addImages).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('does not upload a work image blob that finishes after the session changes', async () => {
    const imageA = new Blob(['image-a'], { type: 'image/png' });
    let resolveBlob: (value: Blob) => void = () => undefined;
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:image-a' }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveBlob = () => resolve({ ok: true, blob: async () => imageA });
          }),
      ),
    );
    const view = mount();
    await until(
      view.container,
      () => button(view.container, 'Добавить изображения') instanceof HTMLButtonElement,
      'images',
    );
    act(() => {
      button(view.container, 'Добавить изображения')?.click();
    });
    await flush();
    const workB = detail('DRAFT', 'User B title', '2026-09-30T00:00:00.000Z');
    harness.getProduct.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-a' });
      view.queryClient.setQueryData(ownerWorkQueryKeys.detail(productId), workB);
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    await act(async () => {
      resolveBlob(imageA);
      await Promise.resolve();
    });
    await flush();
    expect(harness.addImages).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    view.unmount();
  });

  it.each(['CHANGES_REQUESTED', 'REJECTED'] as const)(
    'stays locked when a %s snapshot saved before submit arrives after submit',
    async (status) => {
      const initial = detail(status, 'Needs changes', '2026-09-27T00:00:00.000Z');
      harness.getProduct.mockResolvedValue(initial);
      let resolveSubmit: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
      const reads: Array<(value: ReturnType<typeof detail>) => void> = [];
      harness.submitProduct.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          }),
      );
      const view = mount();
      await until(
        view.container,
        () => button(view.container, 'Повторно отправить на модерацию') instanceof HTMLButtonElement,
        'resubmit',
      );
      harness.getProduct.mockImplementation(
        () =>
          new Promise((resolve) => {
            reads.push(resolve);
          }),
      );
      act(() => {
        button(view.container, 'Обновить')?.click();
      });
      await flush();
      act(() => {
        button(view.container, 'Повторно отправить на модерацию')?.click();
      });
      await flush();
      const savedDuringSubmit = detail(status, 'Needs changes', '2026-09-28T00:00:00.000Z');
      await act(async () => {
        resolveSubmit({ product: product('PENDING_REVIEW', 'Needs changes') });
        reads[0]?.(savedDuringSubmit);
        await Promise.resolve();
      });
      await flush();
      await flush();
      expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.disabled).toBe(true);
      expect(button(view.container, 'Сохранить изменения')).toBeNull();
      expect(button(view.container, 'Повторно отправить на модерацию')).toBeNull();
      const pending = detail('PENDING_REVIEW', 'Needs changes', '2026-09-29T00:00:00.000Z');
      const pendingRead = reads.at(-1);
      expect(pendingRead).toBeTypeOf('function');
      await act(async () => {
        pendingRead?.(pending);
        await Promise.resolve();
      });
      await flush();
      expect(view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId))).toEqual(pending);
      expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.disabled).toBe(true);
      expect(button(view.container, 'Сохранить изменения')).toBeNull();
      expect(button(view.container, 'Повторно отправить на модерацию')).toBeNull();
      act(() => {
        view.queryClient.setQueryData(
          ownerWorkQueryKeys.detail(productId),
          detail(status, 'Needs changes', '2026-09-30T00:00:00.000Z'),
        );
      });
      await flush();
      expect(button(view.container, 'Повторно отправить на модерацию')).toBeInstanceOf(HTMLButtonElement);
      expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.disabled).toBe(false);
      view.unmount();
    },
  );
});

/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { advanceAuthEpoch, authKeys, clearAuthenticatedSession } from '../../lib/query-cache';
import { ownerWorkQueryKeys } from './owner-work-query';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

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

vi.mock('react-native', () => ({
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
  FormPageShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
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
    DestructiveButton: PressButton,
    FormSection: ({ children }: { children?: ReactNode }) => createElement('section', null, children),
    PageState: () => null,
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

function mount(props: { flow?: string; stepParam?: '4' } = {}) {
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

function button(container: ParentNode, label: string) {
  return [...container.querySelectorAll('button')].find((node) => node.textContent === label) ?? null;
}

function setInput(container: ParentNode, label: string, value: string) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing field ${label}`);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
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

describe('product draft submit lifecycle', () => {
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
});

/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authKeys } from '../../lib/query-cache';
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
  launchImageLibraryAsync: vi.fn(),
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
    images: { add: vi.fn(), remove: vi.fn(), reorder: vi.fn() },
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
  harness.listCategories.mockResolvedValue({
    categories: [{ id: categoryId, slug: 'painting', name: 'Painting' }],
  });
  harness.getProduct.mockResolvedValue(detail());
  harness.updateProduct.mockResolvedValue({ product: product() });
});

afterEach(() => {
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
});

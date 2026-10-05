/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flush, inputValue, setInput } from '../../testing/dom';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const productId = '11111111-1111-4111-8111-111111111111';
const categoryId = '33333333-3333-4333-8333-333333333333';

const harness = vi.hoisted(() => ({
  replace: vi.fn(),
  setParams: vi.fn(),
  dispatch: vi.fn(),
  listCategories: vi.fn(),
  getProduct: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  submitProduct: vi.fn(),
  addImages: vi.fn(),
  removeImage: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    replace: harness.replace,
    setParams: harness.setParams,
  }),
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
      create: harness.createProduct,
      update: harness.updateProduct,
      submit: harness.submitProduct,
    },
    images: { add: harness.addImages, remove: harness.removeImage, reorder: vi.fn() },
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
  InfrastructurePageStatus: () => null,
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
    const inactive = Boolean(disabled || loading);
    return createElement(
      'button',
      {
        type: 'button',
        disabled: inactive,
        'aria-busy': loading ? 'true' : undefined,
        onClick: () => {
          if (inactive) return;
          onPress?.();
        },
      },
      label,
    );
  }
  return {
    AppDialog: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
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

import { authKeys, clearAuthenticatedSession } from '../../lib/query-cache';
import { ownerWorkQueryKeys } from './owner-work-query';
import { ProductDraftScreen } from './product-draft-screen';

function product(title = 'Saved title', technique = 'Oil') {
  return {
    id: productId,
    publicId: 'draftwork01',
    sellerProfileId: '44444444-4444-4444-8444-444444444444',
    categoryId,
    title,
    story: '',
    technique,
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
    status: 'DRAFT',
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

function detail(title = 'Saved title', technique = 'Oil') {
  return {
    product: product(title, technique),
    editingRevision: {
      id: '22222222-2222-4222-8222-222222222222',
      version: 1,
      status: 'DRAFT',
      updatedAt: '2026-09-27T00:00:00.000Z',
    },
    creationIntro: null,
    creationSteps: [],
    lastModerationReason: null,
  };
}

function mount(props: {
  productId?: string;
  flow?: string;
  stepParam?: '1' | '2' | '3' | '4';
  sessionId?: string;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, { id: props.sessionId ?? 'user-a' });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ProductDraftScreen, {
          productId: props.productId,
          flow: props.flow,
          stepParam: props.stepParam,
        }),
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

function clickNth(container: ParentNode, label: string, index: number) {
  const target = [...container.querySelectorAll('button')].filter(
    (button) => button.textContent === label,
  )[index];
  if (!target) throw new Error(`Missing button ${label} at ${index}`);
  act(() => {
    target.click();
  });
}

function formIsDirty() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

beforeEach(() => {
  window.history.replaceState({}, '');
  vi.spyOn(window.history, 'back').mockImplementation(() => {
    window.history.replaceState({}, '');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });
  harness.replace.mockReset();
  harness.setParams.mockReset();
  harness.dispatch.mockReset();
  harness.listCategories.mockReset();
  harness.getProduct.mockReset();
  harness.createProduct.mockReset();
  harness.updateProduct.mockReset();
  harness.submitProduct.mockReset();
  harness.addImages.mockReset();
  harness.removeImage.mockReset();
  harness.listCategories.mockResolvedValue({
    categories: [{ id: categoryId, slug: 'painting', name: 'Painting' }],
  });
  harness.getProduct.mockResolvedValue(detail());
  harness.updateProduct.mockResolvedValue({ product: product() });
  harness.createProduct.mockResolvedValue({ product: product() });
  harness.submitProduct.mockResolvedValue({ product: product('Saved title', 'Oil') });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('product draft save reconciliation', () => {
  it('keeps text entered after the snapshot and applies normalization to an untouched field', async () => {
    let resolveSave: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Сохранить изменения') instanceof HTMLButtonElement, 'save');
    click(view.container, 'Сохранить изменения');
    await flush();
    setInput(view.container, 'Название', 'Typed later');
    await act(async () => {
      resolveSave({ product: product('Saved title', 'Oil paint') });
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Название')).toBe('Typed later');
    expect(inputValue(view.container, 'Техника')).toBe('Oil paint');
    expect(formIsDirty()).toBe(true);
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    setInput(view.container, 'Название', 'Saved title');
    expect(formIsDirty()).toBe(false);
    view.unmount();
  });

  it('clears a field that was dirty before send once that snapshot is saved', async () => {
    let resolveSave: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Сохранить изменения') instanceof HTMLButtonElement, 'save');
    setInput(view.container, 'Название', 'Next title');
    expect(formIsDirty()).toBe(true);
    click(view.container, 'Сохранить изменения');
    await flush();
    await act(async () => {
      resolveSave({ product: product('Next title', 'Oil paint') });
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Название')).toBe('Next title');
    expect(inputValue(view.container, 'Техника')).toBe('Oil paint');
    expect(formIsDirty()).toBe(false);
    view.unmount();
  });

  it('keeps a failed save editable and retries with the current text', async () => {
    harness.updateProduct
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ product: product('Kept title') });
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Сохранить изменения') instanceof HTMLButtonElement, 'save');
    setInput(view.container, 'Название', 'Kept title');
    click(view.container, 'Сохранить изменения');
    await until(view.container, () => view.container.textContent?.includes('Не удалось сохранить предмет') === true, 'error');
    expect(inputValue(view.container, 'Название')).toBe('Kept title');
    expect(findButton(view.container, 'Сохранить изменения')).toBeInstanceOf(HTMLButtonElement);
    click(view.container, 'Сохранить изменения');
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(2);
    expect(harness.updateProduct).toHaveBeenLastCalledWith(
      productId,
      expect.objectContaining({ title: 'Kept title' }),
    );
    view.unmount();
  });

  it('assigns the created id and updates on the next save', async () => {
    const createdId = '66666666-6666-4666-8666-666666666666';
    let resolveCreate: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.createProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const view = mount({ productId: undefined, flow: 'creation' });
    await until(view.container, () => findButton(view.container, 'Painting') instanceof HTMLButtonElement, 'category');
    click(view.container, 'Painting');
    setInput(view.container, 'Название', 'First work');
    click(view.container, 'Сохранить и продолжить');
    await flush();
    expect(inputValue(view.container, 'Название')).toBe('First work');
    setInput(view.container, 'Название', 'Typed during create');
    expect(inputValue(view.container, 'Название')).toBe('First work');
    await act(async () => {
      resolveCreate({
        product: {
          ...product('First work'),
          id: createdId,
          images: [],
        },
      });
      await Promise.resolve();
    });
    await flush();
    expect(harness.createProduct).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ id: createdId }),
      }),
    );
    click(view.container, 'Сохранить и продолжить');
    await flush();
    expect(harness.createProduct).toHaveBeenCalledTimes(1);
    expect(harness.updateProduct).toHaveBeenCalledWith(
      createdId,
      expect.objectContaining({ title: 'First work' }),
    );
    view.unmount();
  });

  it('blocks edits and a second submit until the save fails, then stays on the page', async () => {
    let resolveUpdate: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    let rejectUpdate: (error: Error) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveUpdate = resolve;
          rejectUpdate = reject;
        }),
    );
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Отправить на модерацию') instanceof HTMLButtonElement, 'submit');
    click(view.container, 'Отправить на модерацию');
    click(view.container, 'Отправить на модерацию');
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    expect(inputValue(view.container, 'Название')).toBe('Saved title');
    setInput(view.container, 'Название', 'During submit');
    expect(inputValue(view.container, 'Название')).toBe('Saved title');
    await act(async () => {
      rejectUpdate(new Error('save failed'));
      await Promise.resolve();
    });
    await flush();
    expect(harness.submitProduct).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    expect(harness.setParams).not.toHaveBeenCalled();
    expect(findButton(view.container, 'Отправить на модерацию')).toBeInstanceOf(HTMLButtonElement);
    expect((findButton(view.container, 'Отправить на модерацию') as HTMLButtonElement).disabled).toBe(false);
    void resolveUpdate;
    view.unmount();
  });

  it('keeps local edits when the detail query refetches', async () => {
    let resolveRefetch: (value: ReturnType<typeof detail>) => void = () => undefined;
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Обновить') instanceof HTMLButtonElement, 'refresh');
    harness.getProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefetch = resolve;
        }),
    );
    setInput(view.container, 'Название', 'Local edit');
    click(view.container, 'Обновить');
    await act(async () => {
      resolveRefetch(detail('Server title', 'Server technique'));
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Название')).toBe('Local edit');
    expect(inputValue(view.container, 'Техника')).toBe('Oil');
    view.unmount();
  });

  it('does not restore a private product query after the session is cleared', async () => {
    let resolveSave: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Сохранить изменения') instanceof HTMLButtonElement, 'save');
    view.queryClient.setQueryData(['user', 'me'], null);
    view.queryClient.setQueryData(['portfolio-works'], { marker: true });
    const readsBeforeSave = harness.getProduct.mock.calls.length;
    click(view.container, 'Сохранить изменения');
    await act(async () => {
      resolveSave({ product: product('Saved title', 'Oil paint') });
      await Promise.resolve();
    });
    await flush();
    expect(harness.getProduct.mock.calls.length).toBe(readsBeforeSave);
    expect(view.queryClient.getQueryData(['portfolio-works'])).toEqual({ marker: true });
    view.unmount();
  });

  it('drops a work save from the previous session after logout and login', async () => {
    let resolveSave: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId, sessionId: 'user-a' });
    await until(
      view.container,
      () => view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value === 'Saved title',
      'work A',
    );
    click(view.container, 'Сохранить изменения');
    await flush();
    const workB = detail('User B title');
    workB.editingRevision.updatedAt = '2026-09-30T00:00:00.000Z';
    workB.product.updatedAt = '2026-09-30T00:00:00.000Z';
    harness.getProduct.mockResolvedValue(workB);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
      view.queryClient.setQueryData(authKeys.session, { id: 'user-b' });
      view.queryClient.setQueryData(ownerWorkQueryKeys.detail(productId), workB);
    });
    await flush();
    harness.getProduct.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      resolveSave({ product: product('From user A', 'Oil paint') });
      await Promise.resolve();
    });
    await flush();
    expect(view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId))).toEqual(workB);
    expect(inputValue(view.container, 'Название')).toBe('User B title');
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('runs one ordinary save at a time and keeps text typed during that save', async () => {
    const resolvers: Array<(value: { product: ReturnType<typeof product> }) => void> = [];
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Сохранить изменения') instanceof HTMLButtonElement, 'save');
    setInput(view.container, 'Название', 'Title A');
    act(() => {
      const save = findButton(view.container, 'Сохранить изменения');
      save?.click();
      save?.click();
      findButton(view.container, 'Отправить на модерацию')?.click();
    });
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    expect(resolvers).toHaveLength(1);
    expect(harness.submitProduct).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();
    setInput(view.container, 'Название', 'Title B');
    await act(async () => {
      resolvers[1]?.({ product: product('Title A', 'Second paint') });
      resolvers[0]?.({ product: product('Title A', 'First paint') });
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Название')).toBe('Title B');
    expect(inputValue(view.container, 'Техника')).toBe('First paint');
    click(view.container, 'Сохранить изменения');
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(2);
    expect(harness.updateProduct).toHaveBeenLastCalledWith(
      productId,
      expect.objectContaining({ title: 'Title B' }),
    );
    expect(harness.submitProduct).not.toHaveBeenCalled();
    view.unmount();
  });

  it('deletes the confirmed image after an in-flight save instead of dropping the action', async () => {
    const imageId = '55555555-5555-4555-8555-555555555555';
    const approved = detail('Saved title', 'Oil');
    approved.product.status = 'APPROVED';
    approved.editingRevision.status = 'APPROVED';
    harness.getProduct.mockResolvedValue(approved);
    let resolveSave: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Сохранить изменения') instanceof HTMLButtonElement, 'save');
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Сохранить изменения');
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    clickNth(view.container, 'Удалить изображение', 0);
    await flush();
    clickNth(view.container, 'Удалить изображение', 1);
    clickNth(view.container, 'Удалить изображение', 1);
    await flush();
    expect(harness.removeImage).not.toHaveBeenCalled();
    const confirm = [...view.container.querySelectorAll('button')].filter(
      (button) => button.textContent === 'Удалить изображение',
    )[1];
    expect(confirm).toHaveProperty('disabled', true);
    expect(findButton(view.container, 'Отмена')).toHaveProperty('disabled', true);
    await act(async () => {
      resolveSave({
        product: { ...approved.product, title: 'Revised title' },
      });
      await Promise.resolve();
    });
    await flush();
    expect(harness.removeImage).toHaveBeenCalledTimes(1);
    expect(harness.removeImage).toHaveBeenCalledWith(productId, imageId);
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('does not delete when the in-flight save fails and accepts a later confirm', async () => {
    const imageId = '55555555-5555-4555-8555-555555555555';
    const approved = detail('Saved title', 'Oil');
    approved.product.status = 'APPROVED';
    approved.editingRevision.status = 'APPROVED';
    harness.getProduct.mockResolvedValue(approved);
    let rejectSave: (error: Error) => void = () => undefined;
    let resolveRetry: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    let attempt = 0;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          attempt += 1;
          if (attempt === 1) rejectSave = reject;
          else resolveRetry = resolve;
        }),
    );
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Сохранить изменения') instanceof HTMLButtonElement, 'save');
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Сохранить изменения');
    await flush();
    clickNth(view.container, 'Удалить изображение', 0);
    await flush();
    clickNth(view.container, 'Удалить изображение', 1);
    await act(async () => {
      rejectSave(new Error('save failed'));
      await Promise.resolve();
    });
    await flush();
    expect(harness.removeImage).not.toHaveBeenCalled();
    expect(findButton(view.container, 'Отмена')).toHaveProperty('disabled', false);
    clickNth(view.container, 'Удалить изображение', 1);
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(2);
    expect(harness.removeImage).not.toHaveBeenCalled();
    await act(async () => {
      resolveRetry({
        product: { ...approved.product, title: 'Revised title' },
      });
      await Promise.resolve();
    });
    await flush();
    expect(harness.removeImage).toHaveBeenCalledTimes(1);
    expect(harness.removeImage).toHaveBeenCalledWith(productId, imageId);
    view.unmount();
  });

  it('does not delete when the session is cleared before the in-flight save finishes', async () => {
    const approved = detail('Saved title', 'Oil');
    approved.product.status = 'APPROVED';
    approved.editingRevision.status = 'APPROVED';
    harness.getProduct.mockResolvedValue(approved);
    let resolveSave: (value: { product: ReturnType<typeof product> }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(view.container, () => findButton(view.container, 'Сохранить изменения') instanceof HTMLButtonElement, 'save');
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Сохранить изменения');
    await flush();
    clickNth(view.container, 'Удалить изображение', 0);
    await flush();
    clickNth(view.container, 'Удалить изображение', 1);
    await act(async () => {
      await clearAuthenticatedSession(view.queryClient);
    });
    await act(async () => {
      resolveSave({
        product: { ...approved.product, title: 'Revised title' },
      });
      await Promise.resolve();
    });
    await flush();
    expect(harness.removeImage).not.toHaveBeenCalled();
    view.unmount();
  });
});

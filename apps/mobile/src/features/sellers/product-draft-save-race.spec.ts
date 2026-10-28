/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import { flush, inputValue, setInput } from '../../testing/dom';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.mock('../../components/figma/FigmaIcon', () => ({ FigmaIcon: () => null }));
vi.mock('../../components/ui/MotionPressable', () => ({
  MotionPressable: ({
    children,
    accessibilityLabel,
    disabled,
    onPress,
  }: {
    children?: ReactNode;
    accessibilityLabel?: string;
    disabled?: boolean;
    onPress?: () => void;
  }) =>
    createElement(
      'button',
      { 'aria-label': accessibilityLabel, disabled, onClick: onPress },
      children,
    ),
}));

vi.mock('../../components/shared/PrivateStoryImage', () => ({
  PrivateStoryImage: () => null,
}));

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
  pickImages: vi.fn(),
  reorderImages: vi.fn(),
  imageActions: null as ReturnType<
    typeof import('./product-draft-image-actions').useProductDraftImageActions
  > | null,
  imageSession: null as
    | import('./product-draft-save').ProductDraftSaveSession
    | null,
}));

vi.mock('./product-draft-image-actions', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./product-draft-image-actions')>();
  return {
    ...actual,
    useProductDraftImageActions: (
      options: Parameters<typeof actual.useProductDraftImageActions>[0],
    ) => {
      const actions = actual.useProductDraftImageActions(options);
      harness.imageActions = actions;
      harness.imageSession = options.session;
      return actions;
    },
  };
});

vi.mock('../../components/figma/FigmaIconButton', () => ({
  FigmaIconButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        'aria-label': label,
        disabled,
        onClick: onPress,
      },
      label,
    ),
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
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        disabled,
        'aria-pressed': selected,
        onClick: onPress,
      },
      label,
    ),
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
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        'aria-label': label,
        disabled,
        onClick: () => onPress(),
      },
      value || label,
    ),
}));

vi.mock('./product-catalog-term-sheet', () => ({
  ProductCatalogTermSheet: () => null,
}));

vi.mock('react-native', () => ({
  Image: ({
    source,
    accessibilityLabel,
  }: {
    source: { uri: string };
    accessibilityLabel: string;
  }) => createElement('img', { src: source.uri, alt: accessibilityLabel }),
  ActivityIndicator: () => createElement('span', { role: 'progressbar' }),
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
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
  launchImageLibraryAsync: harness.pickImages,
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    categories: { list: harness.listCategories },
    catalog: { listTerms: async () => ({ terms: [] }) },
    sellers: { getProduct: harness.getProduct },
    products: {
      create: harness.createProduct,
      update: harness.updateProduct,
      submit: harness.submitProduct,
    },
    images: {
      add: harness.addImages,
      remove: harness.removeImage,
      reorder: harness.reorderImages,
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
    AppDialog: ({ children }: { children?: ReactNode }) =>
      createElement('div', null, children),
    AppText: ({ children }: { children?: ReactNode }) =>
      createElement('span', null, children),
    PrimaryButton: PressButton,
    FormSection: ({ children }: { children?: ReactNode }) =>
      createElement('section', null, children),
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
        onChange: (event: { target: { value: string } }) =>
          onChangeText?.(event.target.value),
      }),
  };
});

import {
  advanceAuthEpoch,
  authKeys,
  clearAuthenticatedSession,
} from '../../lib/query-cache';
import { ownerWorkQueryKeys } from './owner-work-query';
import { ProductDraftScreen } from './product-draft-screen';

function product(title = 'Saved title', dimensions = '') {
  return {
    id: productId,
    publicId: 'draftwork01',
    sellerProfileId: '44444444-4444-4444-8444-444444444444',
    categoryId,
    title,
    story: '',
    technique: 'Oil',
    materials: '',
    dimensions,
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
        slotId: '55555555-5555-4555-8555-555555555555',
        slotVersion: 0,
        crop: null,
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

function detail(title = 'Saved title', dimensions = '') {
  return {
    product: product(title, dimensions),
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

function mount(
  props: {
    productId?: string;
    flow?: string;
    stepParam?: '1' | '2' | '3' | '4';
    sessionId?: string;
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, {
    id: props.sessionId ?? 'user-a',
  });
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

function findButton(container: ParentNode, label: string) {
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

function formIsDirty() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '');
  vi.spyOn(window.history, 'back').mockImplementation(() => {
    window.history.replaceState({}, '');
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });
  harness.imageActions = null;
  harness.imageSession = null;
  harness.replace.mockReset();
  harness.setParams.mockReset();
  harness.dispatch.mockReset();
  harness.listCategories.mockReset();
  harness.getProduct.mockReset();
  harness.createProduct.mockReset();
  harness.updateProduct.mockReset();
  harness.submitProduct.mockReset();
  harness.addImages.mockReset();
  harness.addImages.mockResolvedValue({ ok: true });
  harness.removeImage.mockReset();
  harness.pickImages.mockReset();
  harness.pickImages.mockResolvedValue({ canceled: true, assets: [] });
  harness.reorderImages.mockReset();
  harness.listCategories.mockResolvedValue({
    categories: [{ id: categoryId, slug: 'painting', name: 'Painting' }],
  });
  harness.getProduct.mockResolvedValue(detail());
  harness.updateProduct.mockResolvedValue({ product: product() });
  harness.createProduct.mockResolvedValue({ product: product() });
  harness.submitProduct.mockResolvedValue({
    product: product('Saved title', 'Oil'),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('product draft save reconciliation', () => {
  it('keeps text entered after the snapshot and applies normalization to an untouched field', async () => {
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    click(view.container, 'Сохранить изменения');
    await flush();
    setInput(view.container, 'Название', 'Typed later');
    await act(async () => {
      resolveSave({ product: product('Saved title', 'Oil paint') });
      await Promise.resolve();
    });
    await flush();
    expect(inputValue(view.container, 'Название')).toBe('Typed later');
    expect(inputValue(view.container, 'Размеры')).toBe('Oil paint');
    expect(formIsDirty()).toBe(true);
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    setInput(view.container, 'Название', 'Saved title');
    expect(formIsDirty()).toBe(false);
    view.unmount();
  });

  it('clears a field that was dirty before send once that snapshot is saved', async () => {
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
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
    expect(inputValue(view.container, 'Размеры')).toBe('Oil paint');
    expect(formIsDirty()).toBe(false);
    view.unmount();
  });

  it('keeps a failed save editable and retries with the current text', async () => {
    harness.updateProduct
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ product: product('Kept title') });
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Название', 'Kept title');
    click(view.container, 'Сохранить изменения');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Не удалось сохранить предмет') ===
        true,
      'error',
    );
    expect(inputValue(view.container, 'Название')).toBe('Kept title');
    expect(findButton(view.container, 'Сохранить изменения')).toBeInstanceOf(
      HTMLButtonElement,
    );
    click(view.container, 'Сохранить изменения');
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(2);
    expect(harness.updateProduct).toHaveBeenLastCalledWith(
      productId,
      expect.objectContaining({ title: 'Kept title' }),
    );
    expect(view.container.textContent).not.toContain(
      'Не удалось сохранить предмет',
    );
    expect(view.container.textContent).toContain('Загружено 1 из 1');
    view.unmount();
  });

  it('assigns the created id and updates on the next save', async () => {
    const createdId = '66666666-6666-4666-8666-666666666666';
    let resolveCreate: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.createProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const view = mount({ productId: undefined, flow: 'creation' });
    await until(
      view.container,
      () => findButton(view.container, 'Painting') instanceof HTMLButtonElement,
      'category',
    );
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
    let resolveUpdate: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    let rejectUpdate: (error: Error) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveUpdate = resolve;
          rejectUpdate = reject;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на модерацию') instanceof
        HTMLButtonElement,
      'submit',
    );
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
    expect(findButton(view.container, 'Отправить на модерацию')).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(
      (
        findButton(
          view.container,
          'Отправить на модерацию',
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    void resolveUpdate;
    view.unmount();
  });

  it('confirms the saved snapshot when the field update succeeds but the submit fails', async () => {
    harness.updateProduct.mockResolvedValue({
      product: product('Revised title'),
    });
    harness.submitProduct.mockRejectedValue(
      new ApiClientError('Отправка временно недоступна.', {
        kind: 'conflict',
        status: 409,
      }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Отправить на модерацию') instanceof
        HTMLButtonElement,
      'submit',
    );
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Отправить на модерацию');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes(
          'Не удалось сохранить и отправить предмет на модерацию.',
        ) === true,
      'submit error',
    );
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    expect(harness.updateProduct).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({ title: 'Revised title' }),
    );
    expect(harness.submitProduct).toHaveBeenCalledTimes(1);
    // The server already accepted the fields: the form is reconciled to the
    // saved snapshot instead of staying dirty with a stale base and draft.
    expect(formIsDirty()).toBe(false);
    expect(inputValue(view.container, 'Название')).toBe('Revised title');
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('keeps local edits when the detail query refetches', async () => {
    let resolveRefetch: (value: ReturnType<typeof detail>) => void = () =>
      undefined;
    const view = mount({ productId });
    await until(
      view.container,
      () => findButton(view.container, 'Обновить') instanceof HTMLButtonElement,
      'refresh',
    );
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
    expect(inputValue(view.container, 'Размеры')).toBe('');
    view.unmount();
  });

  it('does not restore a private product query after the session is cleared', async () => {
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
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
    expect(view.queryClient.getQueryData(['portfolio-works'])).toEqual({
      marker: true,
    });
    view.unmount();
  });

  it('drops a work save from the previous session after logout and login', async () => {
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId, sessionId: 'user-a' });
    await until(
      view.container,
      () =>
        view.container.querySelector<HTMLInputElement>(
          '[aria-label="Название"]',
        )?.value === 'Saved title',
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
      view.queryClient.setQueryData(
        ownerWorkQueryKeys.detail(productId),
        workB,
      );
    });
    await flush();
    harness.getProduct.mockImplementation(() => new Promise(() => undefined));
    await act(async () => {
      resolveSave({ product: product('From user A', 'Oil paint') });
      await Promise.resolve();
    });
    await flush();
    expect(
      view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId)),
    ).toEqual(workB);
    expect(inputValue(view.container, 'Название')).toBe('User B title');
    expect(harness.replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('runs one ordinary save at a time and keeps text typed during that save', async () => {
    const resolvers: Array<
      (value: { product: ReturnType<typeof product> }) => void
    > = [];
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
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
    expect(inputValue(view.container, 'Размеры')).toBe('First paint');
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
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Сохранить изменения');
    await flush();
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    act(() =>
      harness.imageActions!.setImagePendingDelete(
        '55555555-5555-4555-8555-555555555555',
      ),
    );
    await flush();
    click(view.container, 'Удалить изображение');
    click(view.container, 'Удалить изображение');
    await flush();
    expect(harness.removeImage).not.toHaveBeenCalled();
    const confirm = [...view.container.querySelectorAll('button')].filter(
      (button) => button.textContent === 'Удалить изображение',
    )[0];
    expect(confirm).toHaveProperty('disabled', true);
    expect(findButton(view.container, 'Отмена')).toHaveProperty(
      'disabled',
      true,
    );
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
    let resolveRetry: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
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
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Сохранить изменения');
    await flush();
    act(() =>
      harness.imageActions!.setImagePendingDelete(
        '55555555-5555-4555-8555-555555555555',
      ),
    );
    await flush();
    click(view.container, 'Удалить изображение');
    await act(async () => {
      rejectSave(new Error('save failed'));
      await Promise.resolve();
    });
    await flush();
    expect(harness.removeImage).not.toHaveBeenCalled();
    expect(findButton(view.container, 'Отмена')).toHaveProperty(
      'disabled',
      false,
    );
    click(view.container, 'Удалить изображение');
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
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Сохранить изменения');
    await flush();
    act(() =>
      harness.imageActions!.setImagePendingDelete(
        '55555555-5555-4555-8555-555555555555',
      ),
    );
    await flush();
    click(view.container, 'Удалить изображение');
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

  it('saves an unchanged approved form once before picker and upload', async () => {
    const approved = detail('Saved title', 'Oil');
    approved.product.status = 'APPROVED';
    approved.editingRevision.status = 'APPROVED';
    harness.getProduct.mockResolvedValue(approved);
    harness.updateProduct.mockResolvedValue({ product: approved.product });
    harness.pickImages.mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'blob:photo',
        width: 100,
        height: 100,
        mimeType: 'image/png',
        file: new File(['photo'], 'photo.png', { type: 'image/png' }),
      }],
    });
    const view = mount({ productId });
    try {
      await until(
        view.container,
        () => Boolean(findButton(view.container, 'Добавить изображения')),
        'images',
      );
      click(view.container, 'Добавить изображения');
      await flush();
      expect(harness.addImages).not.toHaveBeenCalled();
      click(view.container, 'Загрузить фото');
      await until(
        view.container,
        () => harness.addImages.mock.calls.length === 1,
        'upload',
      );
      expect(harness.updateProduct).toHaveBeenCalledTimes(1);
      expect(harness.updateProduct.mock.invocationCallOrder[0]).toBeLessThan(
        harness.pickImages.mock.invocationCallOrder[0]!,
      );
      expect(harness.pickImages.mock.invocationCallOrder[0]).toBeLessThan(
        harness.addImages.mock.invocationCallOrder[0]!,
      );
    } finally {
      view.unmount();
    }
  });

  it('saves edits made after selection before a deferred upload', async () => {
    const approved = detail('Saved title', 'Oil');
    approved.product.status = 'APPROVED';
    approved.editingRevision.status = 'APPROVED';
    harness.getProduct.mockResolvedValue(approved);
    harness.updateProduct.mockResolvedValue({ product: approved.product });
    harness.pickImages.mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'blob:photo',
        width: 100,
        height: 100,
        mimeType: 'image/png',
        file: new File(['photo'], 'photo.png', { type: 'image/png' }),
      }],
    });
    const view = mount({ productId });
    try {
      await until(
        view.container,
        () => Boolean(findButton(view.container, 'Добавить изображения')),
        'images',
      );
      const selected = (await act(() => harness.imageActions!.selectImages()))!;
      expect(harness.updateProduct).toHaveBeenCalledTimes(1);
      expect(harness.addImages).not.toHaveBeenCalled();
      setInput(view.container, 'Название', 'Edited after picker');
      harness.updateProduct.mockResolvedValue({
        product: { ...approved.product, title: 'Edited after picker' },
      });
      await act(async () => {
        await Promise.all([
          harness.imageActions!.startUpload(selected),
          harness.imageActions!.startUpload(selected),
        ]);
      });
      await until(
        view.container,
        () => harness.addImages.mock.calls.length === 1,
        'upload',
      );
      await act(() => harness.imageActions!.startUpload(selected));
      await flush();
      expect(harness.addImages).toHaveBeenCalledTimes(1);
      expect(harness.updateProduct).toHaveBeenCalledTimes(2);
      expect(harness.updateProduct.mock.calls[1]?.[1]).toMatchObject({
        title: 'Edited after picker',
      });
      expect(harness.updateProduct.mock.invocationCallOrder[1]).toBeLessThan(
        harness.addImages.mock.invocationCallOrder[0]!,
      );
    } finally {
      view.unmount();
    }
  });

  it.each(['success', 'failure', 'newer-edit'] as const)(
    'waits for a real in-flight save before deferred upload: %s',
    async (outcome) => {
      const approved = detail('Saved title', 'Oil');
      approved.product.status = 'APPROVED';
      approved.editingRevision.status = 'APPROVED';
      harness.getProduct.mockResolvedValue(approved);
      harness.updateProduct.mockResolvedValue({ product: approved.product });
      harness.pickImages.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'blob:photo',
          width: 100,
          height: 100,
          mimeType: 'image/png',
          file: new File(['photo'], 'photo.png', { type: 'image/png' }),
        }],
      });
      const view = mount({ productId });
      try {
        await until(
          view.container,
          () => Boolean(findButton(view.container, 'Добавить изображения')),
          'images',
        );
        const selected = (await act(() =>
          harness.imageActions!.selectImages(),
        ))!;
        setInput(view.container, 'Название', 'Saving now');
        let finish!: () => void;
        harness.updateProduct.mockImplementationOnce(
          () =>
            new Promise((resolve, reject) => {
              finish = () =>
                outcome === 'failure'
                  ? reject(new Error('save failed'))
                  : resolve({
                      product: { ...approved.product, title: 'Saving now' },
                    });
            }),
        );
        click(view.container, 'Сохранить изменения');
        await until(
          view.container,
          () => harness.updateProduct.mock.calls.length === 2,
          'pending save',
        );
        let start!: Promise<void>;
        act(() => {
          start = harness.imageActions!.startUpload(selected);
        });
        await flush();
        expect(harness.updateProduct).toHaveBeenCalledTimes(2);
        expect(harness.addImages).not.toHaveBeenCalled();
        if (outcome === 'newer-edit') {
          setInput(view.container, 'Название', 'Latest edit');
          harness.updateProduct.mockResolvedValue({
            product: { ...approved.product, title: 'Latest edit' },
          });
        }
        await act(async () => {
          finish();
          await start;
        });
        await flush();
        expect(harness.addImages).toHaveBeenCalledTimes(
          outcome === 'failure' ? 0 : 1,
        );
        expect(harness.updateProduct).toHaveBeenCalledTimes(
          outcome === 'newer-edit' ? 3 : 2,
        );
        if (outcome === 'newer-edit') {
          expect(harness.updateProduct.mock.calls[2]?.[1]).toMatchObject({
            title: 'Latest edit',
          });
          expect(
            harness.updateProduct.mock.invocationCallOrder[2],
          ).toBeLessThan(harness.addImages.mock.invocationCallOrder[0]!);
        }
      } finally {
        view.unmount();
      }
    },
  );

  it.each(['session', 'operation', 'product', 'unmount'] as const)(
    'does not upload after %s changes during a real deferred save',
    async (reason) => {
      const approved = detail('Saved title', 'Oil');
      approved.product.status = 'APPROVED';
      approved.editingRevision.status = 'APPROVED';
      harness.getProduct.mockResolvedValue(approved);
      harness.updateProduct.mockResolvedValue({ product: approved.product });
      harness.pickImages.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'blob:photo',
          width: 100,
          height: 100,
          mimeType: 'image/png',
          file: new File(['photo'], 'photo.png', { type: 'image/png' }),
        }],
      });
      const view = mount({ productId });
      try {
        await until(
          view.container,
          () => Boolean(findButton(view.container, 'Добавить изображения')),
          'images',
        );
        const selected = (await act(() =>
          harness.imageActions!.selectImages(),
        ))!;
        setInput(view.container, 'Название', 'Deferred edit');
        let finish!: () => void;
        harness.updateProduct.mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finish = () =>
                resolve({
                  product: { ...approved.product, title: 'Deferred edit' },
                });
            }),
        );
        let start!: Promise<void>;
        act(() => {
          start = harness.imageActions!.startUpload(selected);
        });
        await until(
          view.container,
          () => harness.updateProduct.mock.calls.length === 2,
          'deferred save',
        );
        if (reason === 'session')
          await act(() => clearAuthenticatedSession(view.queryClient));
        else if (reason === 'operation')
          vi.spyOn(harness.imageSession!, 'isCurrentOperation').mockReturnValue(
            false,
          );
        else if (reason === 'product')
          vi.spyOn(harness.imageSession!, 'persistedProductId').mockReturnValue(
            'other-product',
          );
        else view.unmount();
        await act(async () => {
          finish();
          await start;
        });
        await flush();
        expect(harness.updateProduct).toHaveBeenCalledTimes(2);
        expect(harness.addImages).not.toHaveBeenCalled();
      } finally {
        if (reason !== 'unmount') view.unmount();
      }
    },
  );

  it('opens the image picker after an in-flight save instead of dropping the action', async () => {
    const approved = detail('Saved title', 'Oil');
    approved.product.status = 'APPROVED';
    approved.editingRevision.status = 'APPROVED';
    harness.getProduct.mockResolvedValue(approved);
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Сохранить изменения');
    await flush();
    click(view.container, 'Добавить изображения');
    await flush();
    expect(harness.pickImages).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave({
        product: { ...approved.product, title: 'Revised title' },
      });
      await Promise.resolve();
    });
    await flush();
    expect(harness.pickImages).toHaveBeenCalledTimes(1);
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('reorders after an in-flight save instead of dropping the action', async () => {
    const approved = detail('Saved title', 'Oil');
    approved.product.status = 'APPROVED';
    approved.editingRevision.status = 'APPROVED';
    approved.product.images = [
      ...approved.product.images,
      {
        ...approved.product.images[0],
        id: '66666666-6666-4666-8666-666666666666',
        position: 1,
      },
    ];
    harness.getProduct.mockResolvedValue(approved);
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Название', 'Revised title');
    click(view.container, 'Сохранить изменения');
    await flush();
    act(() => {
      void harness.imageActions!.reorder(
        '55555555-5555-4555-8555-555555555555',
        1,
      );
    });
    await flush();
    expect(harness.reorderImages).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave({
        product: { ...approved.product, title: 'Revised title' },
      });
      await Promise.resolve();
    });
    await flush();
    expect(harness.reorderImages).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('replaces a stale save error with the next failure and drops it after the session changes', async () => {
    let rejectSave: (error: unknown) => void = () => undefined;
    harness.updateProduct
      .mockRejectedValueOnce(
        new ApiClientError('Предмет не найден.', {
          kind: 'not_found',
          status: 404,
        }),
      )
      .mockRejectedValueOnce(
        new ApiClientError('Недостаточно прав для сохранения предмета.', {
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
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    setInput(view.container, 'Название', 'Kept title');
    click(view.container, 'Сохранить изменения');
    await until(
      view.container,
      () => view.container.textContent?.includes('Предмет не найден.') === true,
      'first error',
    );
    expect(inputValue(view.container, 'Название')).toBe('Kept title');
    expect(view.container.textContent).toContain('Загружено 1 из 1');
    click(view.container, 'Сохранить изменения');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes(
          'Недостаточно прав для сохранения предмета.',
        ) === true,
      'second error',
    );
    expect(view.container.textContent).not.toContain('Предмет не найден.');
    click(view.container, 'Сохранить изменения');
    await flush();
    expect(view.container.textContent).not.toContain(
      'Недостаточно прав для сохранения предмета.',
    );
    await act(async () => {
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    await act(async () => {
      rejectSave(
        new ApiClientError('Старая ошибка предмета.', {
          kind: 'not_found',
          status: 404,
        }),
      );
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).not.toContain('Старая ошибка предмета.');
    expect(view.container.textContent).not.toContain(
      'Недостаточно прав для сохранения предмета.',
    );
    view.unmount();
  });

  it('does not let a late successful save clear the next session error', async () => {
    let resolveSave: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.updateProduct.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount({ productId });
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save',
    );
    click(view.container, 'Сохранить изменения');
    await flush();
    await act(async () => {
      advanceAuthEpoch(view.queryClient);
    });
    await flush();
    harness.updateProduct.mockRejectedValueOnce(
      new ApiClientError('Новая ошибка предмета.', {
        kind: 'forbidden',
        status: 403,
      }),
    );
    await until(
      view.container,
      () =>
        findButton(view.container, 'Сохранить изменения') instanceof
        HTMLButtonElement,
      'save again',
    );
    click(view.container, 'Сохранить изменения');
    await until(
      view.container,
      () =>
        view.container.textContent?.includes('Новая ошибка предмета.') === true,
      'new error',
    );
    await act(async () => {
      resolveSave({ product: product('Saved title') });
      await Promise.resolve();
    });
    await flush();
    expect(view.container.textContent).toContain('Новая ошибка предмета.');
    view.unmount();
  });
});

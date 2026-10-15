/**
 * @vitest-environment jsdom
 */
import { act, createElement, useEffect, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flush, setInput } from '../../testing/dom';

import { authKeys } from '../../lib/query-cache';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const productId = '11111111-1111-4111-8111-111111111111';
const categoryId = '33333333-3333-4333-8333-333333333333';

const harness = vi.hoisted(() => ({
  dispatch: vi.fn(),
  listCategories: vi.fn(),
  getProduct: vi.fn(),
  updateProduct: vi.fn(),
  replaceCreation: vi.fn(),
  preventRemove: false,
  callback: null as null | ((event: { data: { action: { type: string } } }) => void),
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
  ProductDraftStoryStep: ({
    blocks,
    onAddText,
    onEditText,
  }: {
    blocks: Array<{ key: string }>;
    onAddText: (type: 'PARAGRAPH') => void;
    onEditText: (key: string, value: string) => void;
  }) => createElement('div', null,
    createElement('button', { type: 'button', onClick: () => onAddText('PARAGRAPH') }, 'Добавить абзац истории'),
    createElement('button', {
      type: 'button',
      disabled: blocks.length === 0,
      onClick: () => blocks[0] && onEditText(blocks[0].key, 'Сохранённая история'),
    }, 'Заполнить абзац истории'),
  ),
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
  Platform: { OS: 'web' },
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: vi.fn(), setParams: vi.fn() }),
  useNavigation: () => ({ dispatch: harness.dispatch }),
}));

vi.mock('expo-router/build/react-navigation/core', () => ({
  usePreventRemove: (
    preventRemove: boolean,
    callback: (event: { data: { action: { type: string } } }) => void,
  ) => {
    harness.preventRemove = preventRemove;
    harness.callback = callback;
    useEffect(() => {
      harness.preventRemove = preventRemove;
      harness.callback = callback;
    });
  },
}));

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({
    categories: { list: harness.listCategories },
    catalog: { listTerms: async () => ({ terms: [] }) },
    sellers: { getProduct: harness.getProduct },
    products: {
      create: vi.fn(),
      update: harness.updateProduct,
      replaceCreation: harness.replaceCreation,
      submit: vi.fn(),
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
  InfrastructurePageStatus: () => null,
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

function detail() {
  return {
    product: {
      id: productId,
      publicId: 'draftwork01',
      sellerProfileId: '44444444-4444-4444-8444-444444444444',
      categoryId,
      title: 'Saved title',
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
    },
    editingRevision: {
      id: '22222222-2222-4222-8222-222222222222',
      version: 1,
      status: 'DRAFT',
      updatedAt: '2026-09-27T00:00:00.000Z',
    },
    creationIntro: null,
    creationSteps: [],
    story: { storyToken: 0, blocks: [] },
    lastModerationReason: null,
  };
}

function emitRouteRemoval() {
  if (!harness.preventRemove || !harness.callback) return false;
  const event = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
    data: { action: { type: 'POP' } },
  };
  event.preventDefault();
  harness.callback({ data: event.data });
  return event.defaultPrevented;
}

function mount() {
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
        createElement(ProductDraftScreen, { productId }),
      ),
    );
  });
  return {
    container,
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

beforeEach(() => {
  window.localStorage.clear();
  harness.dispatch.mockReset();
  harness.preventRemove = false;
  harness.callback = null;
  harness.listCategories.mockReset();
  harness.getProduct.mockReset();
  harness.updateProduct.mockReset();
  harness.replaceCreation.mockReset();
  harness.replaceCreation.mockResolvedValue({
    storyToken: 1,
    blocks: [{
      id: '86666666-6666-4666-8666-666666666666',
      position: 0,
      type: 'PARAGRAPH',
      text: 'Сохранённая история',
    }],
  });
  harness.listCategories.mockResolvedValue({
    categories: [{ id: categoryId, slug: 'painting', name: 'Painting' }],
  });
  harness.getProduct.mockResolvedValue(detail());
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('product draft route removal', () => {
  it('waits for the browser guard pop before resetting the saved form or releasing navigation', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    harness.updateProduct.mockResolvedValue({ product: { ...detail().product, title: 'Dirty title' } });
    const view = mount();
    await until(view.container, () => view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value === 'Saved title', 'title');
    setInput(view.container, 'Название', 'Dirty title');
    await flush();
    act(() => [...view.container.querySelectorAll('button')].find(button => button.textContent === 'Сохранить изменения')?.click());
    await flush();
    expect(back).toHaveBeenCalledTimes(1);
    expect(harness.preventRemove).toBe(true);
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value).toBe('Dirty title');
    await act(async () => {
      window.history.replaceState({}, '');
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      await Promise.resolve();
    });
    await flush();
    expect(harness.preventRemove).toBe(false);
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.disabled).toBe(false);
    view.unmount();
    back.mockRestore();
  });

  it('keeps route removal blocked until a delayed save succeeds once', async () => {
    let resolveSave: (value: { product: ReturnType<typeof detail>['product'] }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value === 'Saved title',
      'title',
    );
    setInput(view.container, 'Название', 'Dirty title');
    await flush();
    expect(harness.preventRemove).toBe(true);
    expect(emitRouteRemoval()).toBe(true);
    await flush();
    expect(harness.preventRemove).toBe(true);
    expect(emitRouteRemoval()).toBe(true);
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    expect(harness.dispatch).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave({ product: { ...detail().product, title: 'Dirty title' } });
      await Promise.resolve();
    });
    await flush();
    await flush();
    expect(harness.dispatch).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('does not navigate when the save before route removal fails', async () => {
    harness.updateProduct.mockRejectedValue(new Error('offline'));
    const view = mount();
    await until(
      view.container,
      () => view.container.querySelector<HTMLInputElement>('[aria-label="Название"]') instanceof HTMLInputElement,
      'title',
    );
    setInput(view.container, 'Название', 'Dirty title');
    await flush();
    expect(emitRouteRemoval()).toBe(true);
    await flush();
    expect(harness.dispatch).not.toHaveBeenCalled();
    expect(harness.preventRemove).toBe(true);
    const title = view.container.querySelector<HTMLInputElement>('[aria-label="Название"]');
    expect(title?.disabled).toBe(false);
    expect(title?.value).toBe('Dirty title');
    view.unmount();
  });

  it('does not leave during an ordinary save when route removal is requested', async () => {
    let resolveSave: (value: { product: ReturnType<typeof detail>['product'] }) => void = () => undefined;
    harness.updateProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () => view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value === 'Saved title',
      'title',
    );
    setInput(view.container, 'Название', 'Dirty title');
    await flush();
    const save = [...view.container.querySelectorAll('button')].find((node) => node.textContent === 'Сохранить изменения');
    act(() => {
      save?.click();
    });
    await flush();
    expect(emitRouteRemoval()).toBe(true);
    expect(harness.updateProduct).toHaveBeenCalledTimes(1);
    expect(harness.dispatch).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave({ product: { ...detail().product, title: 'Dirty title' } });
      await Promise.resolve();
    });
    await flush();
    await flush();
    expect(harness.dispatch).not.toHaveBeenCalled();
    expect(view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')?.value).toBe('Dirty title');
    view.unmount();
  });
  it('persists dirty story blocks before allowing route removal', async () => {
    const view = mount();
    await until(view.container, () => !!view.container.querySelector('button') && (
      [...view.container.querySelectorAll('button')].some((button) => button.textContent === 'Добавить абзац истории')
    ), 'story editor');
    act(() => [...view.container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Добавить абзац истории')?.click());
    act(() => [...view.container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Заполнить абзац истории')?.click());
    await flush();
    expect(harness.preventRemove).toBe(true);
    expect(emitRouteRemoval()).toBe(true);
    await until(view.container, () => harness.replaceCreation.mock.calls.length === 1, 'story save');
    expect(harness.replaceCreation.mock.calls[0]?.[1]).toMatchObject({
      storyToken: 0,
      blocks: [{ type: 'PARAGRAPH', text: 'Сохранённая история' }],
    });
    await until(view.container, () => harness.dispatch.mock.calls.length === 1, 'route continuation');
    expect(harness.dispatch).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('does not navigate or discard dirty story after a failed save', async () => {
    harness.replaceCreation.mockRejectedValue(new Error('offline'));
    const view = mount();
    await until(view.container, () => [...view.container.querySelectorAll('button')]
      .some((button) => button.textContent === 'Добавить абзац истории'), 'story editor');
    act(() => [...view.container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Добавить абзац истории')?.click());
    act(() => [...view.container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Заполнить абзац истории')?.click());
    await flush();
    expect(emitRouteRemoval()).toBe(true);
    await until(view.container, () => harness.replaceCreation.mock.calls.length === 1, 'failed story save');
    await flush();
    expect(harness.dispatch).not.toHaveBeenCalled();
    expect(harness.preventRemove).toBe(true);
    view.unmount();
  });

});

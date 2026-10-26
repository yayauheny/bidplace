/**
 * @vitest-environment jsdom
 *
 * Characterization contract for ProductDraftScreen — Wave 3 split.
 *
 * Pins the DOM-level wiring per state (loading, error, not found, creation
 * wizard, edit flow, locked revision, story step) so a render refactor
 * cannot silently break the plumbing. Save/submit/navigation behavior is
 * covered by product-draft-submit-lifecycle/save-race/route-guard specs —
 * keep this file lean.
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import '../../testing/author-application-mocks';

import { flush } from '../../testing/dom';
import { advanceAuthEpoch, authKeys } from '../../lib/query-cache';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

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
  updateProduct: vi.fn(),
  submitProduct: vi.fn(),
  addImages: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

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
        onClick: () => {
          if (!disabled) onPress();
        },
      },
      label,
    ),
}));

vi.mock('./product-draft-story', () => ({
  ProductDraftStoryStep: () => null,
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
      description,
      children,
    }: {
      open: boolean;
      title?: string;
      description?: string;
      children?: ReactNode;
    }) =>
      open
        ? createElement(
            'div',
            { 'data-testid': 'app-dialog' },
            title,
            description,
            children,
          )
        : null,
    AppText: ({ children }: { children?: ReactNode }) =>
      createElement('span', null, children),
    PrimaryButton: PressButton,
    FormSection: ({
      children,
      title,
    }: {
      children?: ReactNode;
      title?: string;
    }) => createElement('section', null, title, children),
    PageState: ({ title }: { title: string }) =>
      createElement('div', null, title),
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

function detail(status = 'DRAFT') {
  return {
    product: product(status),
    editingRevision: {
      id: '22222222-2222-4222-8222-222222222222',
      version: 1,
      status,
      updatedAt: '2026-09-27T00:00:00.000Z',
    },
    creationIntro: null,
    creationSteps: [],
    lastModerationReason: null,
  };
}

function mount(
  props: { productId?: string; flow?: string; stepParam?: string } = {},
) {
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
        createElement(ProductDraftScreen, {
          productId: 'productId' in props ? props.productId : productId,
          flow: props.flow,
          stepParam: props.stepParam as never,
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

function hasButton(container: ParentNode, label: string) {
  return [...container.querySelectorAll('button')].some(
    (node) =>
      node.textContent === label || node.getAttribute('aria-label') === label,
  );
}

function titleInput(container: ParentNode) {
  return container.querySelector<HTMLInputElement>('[aria-label="Название"]');
}

beforeEach(() => {
  for (const mock of [
    harness.replace,
    harness.setParams,
    harness.dispatch,
    harness.listCategories,
    harness.getProduct,
    harness.updateProduct,
    harness.submitProduct,
    harness.addImages,
    harness.launchImageLibraryAsync,
  ]) {
    mock.mockReset();
  }
  harness.addImages.mockResolvedValue({ ok: true });
  harness.launchImageLibraryAsync.mockResolvedValue({
    canceled: true,
    assets: [],
  });
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

describe('ProductDraftScreen render contract', () => {
  it('renders the loading status while categories are pending', async () => {
    harness.listCategories.mockReturnValue(new Promise(() => undefined));
    const { container } = mount();
    await until(
      container,
      () => container.textContent?.includes('loading') ?? false,
      'loading status',
    );
  });

  it('renders the error status when the page data fails', async () => {
    harness.listCategories.mockRejectedValue(new Error('categories down'));
    const { container } = mount();
    await until(
      container,
      () => container.textContent?.includes('error') ?? false,
      'error status',
    );
  });

  it('renders the not-found page for a missing product', async () => {
    harness.getProduct.mockRejectedValue(
      new ApiClientError('missing', { kind: 'not_found', status: 404 }),
    );
    const { container } = mount();
    await until(
      container,
      () => container.textContent?.includes('Предмет не найден') ?? false,
      'not found state',
    );
  });

  it('renders the creation wizard chrome for a new draft', async () => {
    const { container } = mount({ productId: undefined, flow: 'creation' });
    await until(
      container,
      () => hasButton(container, '1. О работе'),
      'creation wizard',
    );
    expect(container.textContent).toContain('Основная информация');
    expect(container.textContent).not.toContain('Новый предмет');
    for (const label of [
      '1. О работе',
      '2. Изображения',
      '3. История создания',
      '4. Проверка',
    ]) {
      expect(hasButton(container, label)).toBe(true);
    }
    expect(titleInput(container)).toBeInstanceOf(HTMLInputElement);
    expect(hasButton(container, 'Закрыть')).toBe(true);
  });

  it('keeps photo continuation outside the grid and exposes edit and delete per tile', async () => {
    const { container } = mount({ flow: 'creation', stepParam: '2' });
    await until(
      container,
      () => hasButton(container, 'Продолжить'),
      'photo continuation',
    );
    expect(hasButton(container, 'Удалить фото 1')).toBe(true);
    expect(hasButton(container, 'Редактировать фото 1')).toBe(true);
    expect(container.textContent).not.toContain('1/10 изображений');
    expect(container.textContent).not.toContain('Назад к описанию');
    expect(container.textContent).not.toContain('Изображение 1: загружено');
  });

  it('renders the editable edit flow with status and submit action', async () => {
    const { container } = mount();
    await until(
      container,
      () => container.textContent?.includes('Редактировать предмет') ?? false,
      'edit flow',
    );
    expect(container.textContent).toContain('Статус предмета');
    expect(hasButton(container, 'Отправить на модерацию')).toBe(true);
    expect(titleInput(container)?.disabled).toBe(false);
  });

  it('locks the edit flow while the revision is pending review', async () => {
    harness.getProduct.mockResolvedValue(detail('PENDING_REVIEW'));
    const { container } = mount();
    await until(
      container,
      () =>
        container.textContent?.includes('Предмет уже нельзя редактировать') ??
        false,
      'locked revision',
    );
    expect(hasButton(container, 'Отправить на модерацию')).toBe(false);
    expect(titleInput(container)?.disabled).toBe(true);
  });

  it('reviews labelled catalog values, including selected inactive terms, without exposing IDs', async () => {
    const materialId = '81111111-1111-4111-8111-111111111111';
    const techniqueId = '82222222-2222-4222-8222-222222222222';
    const saved = detail();
    harness.getProduct.mockResolvedValue({
      ...saved,
      product: {
        ...saved.product,
        dimensions: '20 × 30 см',
        year: 2026,
        uniqueness: 'Единственный экземпляр',
      },
      selection: {
        category: { id: categoryId, name: 'Живопись', slug: 'painting' },
        materialTermIds: [materialId],
        techniqueTermIds: [techniqueId],
        materialTerms: [{ id: materialId, name: 'Холст', active: false }],
        techniqueTerms: [{ id: techniqueId, name: 'Масло', active: false }],
        proposals: [],
      },
    });
    harness.listCategories.mockResolvedValue({ categories: [] });
    const { container, unmount } = mount({ flow: 'creation', stepParam: '4' });
    await until(
      container,
      () =>
        container.textContent?.includes('Проверка перед модерацией') ?? false,
      'review step',
    );
    for (const label of [
      'Категория: Живопись',
      'Материалы: Холст',
      'Техники: Масло',
      'Размеры: 20 × 30 см',
      'Год создания: 2026',
      'Уникальность: Единственный экземпляр',
    ]) {
      expect(container.textContent).toContain(label);
    }
    expect(container.textContent).not.toContain(materialId);
    expect(container.textContent).not.toContain(techniqueId);
    expect(harness.updateProduct).not.toHaveBeenCalled();
    expect(harness.submitProduct).not.toHaveBeenCalled();
    unmount();
  });

  it('omits empty optional review values instead of rendering empty labels', async () => {
    const { container, unmount } = mount({ flow: 'creation', stepParam: '4' });
    await until(
      container,
      () =>
        container.textContent?.includes('Проверка перед модерацией') ?? false,
      'review step',
    );
    expect(container.textContent).toContain('Категория: Painting');
    for (const label of [
      'Материалы:',
      'Техники:',
      'Размеры:',
      'Год создания:',
      'Уникальность:',
    ]) {
      expect(container.textContent).not.toContain(label);
    }
    unmount();
  });

  it('renders the story-step chrome in the creation wizard', async () => {
    const { container } = mount({ flow: 'creation', stepParam: '3' });
    await until(
      container,
      () => hasButton(container, 'Назад к изображениям'),
      'story step chrome',
    );
    expect(container.textContent).not.toContain('Редактировать предмет');
    expect(container.textContent).not.toContain('Создание предмета');
  });
});

describe('ProductDraftScreen recovered story copy', () => {
  const revisionId = '22222222-2222-4222-8222-222222222222';
  const legacyKey = `bidplace:draft:user-a:product-story:${productId}`;
  const recoveryKey = `${legacyKey}@${revisionId}~recovery`;
  const copyLabel = 'Скопировать сохранённый текст';

  const seedLegacyCopy = (text: string) => {
    window.localStorage.setItem(
      legacyKey,
      JSON.stringify({
        v: 2,
        revisionId: '99999999-9999-4999-8999-999999999999',
        token: 0,
        blocks: [{ key: 'local', type: 'PARAGRAPH', text }],
      }),
    );
  };

  const setClipboard = (clipboard: { writeText: unknown } | undefined) => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: clipboard,
      configurable: true,
      writable: true,
    });
  };

  const clickRecoveryCopy = async (container: HTMLElement) => {
    await until(container, () => hasButton(container, copyLabel), copyLabel);
    const button = [...container.querySelectorAll('button')].find(
      (node) => node.textContent === copyLabel,
    )!;
    await act(async () => {
      button.click();
      await flush();
    });
  };

  afterEach(() => {
    setClipboard(undefined);
    window.localStorage.clear();
  });

  it('copies the recovered text and confirms only that payload', async () => {
    seedLegacyCopy('RECOVERY TEXT');
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const { container } = mount();
    await clickRecoveryCopy(container);
    expect(writeText).toHaveBeenCalledWith('RECOVERY TEXT');
    await until(
      container,
      () => hasButton(container, 'Скопировано'),
      'copied status',
    );
  });

  it('offers the text for manual selection when the clipboard write rejects', async () => {
    seedLegacyCopy('RECOVERY TEXT');
    setClipboard({
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
    });
    const { container } = mount();
    await clickRecoveryCopy(container);
    const dialog = await (async () => {
      await until(
        container,
        () => Boolean(container.querySelector('[data-testid="app-dialog"]')),
        'manual copy dialog',
      );
      return container.querySelector('[data-testid="app-dialog"]')!;
    })();
    expect(dialog.textContent).toContain('RECOVERY TEXT');
    // The text is honestly not copied: no copied status is claimed.
    expect(hasButton(container, 'Скопировано')).toBe(false);
  });

  it('offers the text for manual selection when the Clipboard API is absent', async () => {
    seedLegacyCopy('RECOVERY TEXT');
    setClipboard(undefined);
    const { container } = mount();
    await clickRecoveryCopy(container);
    await until(
      container,
      () => Boolean(container.querySelector('[data-testid="app-dialog"]')),
      'manual copy dialog',
    );
    expect(
      container.querySelector('[data-testid="app-dialog"]')!.textContent,
    ).toContain('RECOVERY TEXT');
  });

  it('drops the copied status when the recovered text changes', async () => {
    seedLegacyCopy('RECOVERY TEXT');
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const { container, queryClient } = mount();
    await clickRecoveryCopy(container);
    await until(
      container,
      () => hasButton(container, 'Скопировано'),
      'copied status',
    );
    // Another recovery copy arrives for the same revision; the stale
    // "copied" label must not stick to the new payload.
    window.localStorage.setItem(
      recoveryKey,
      JSON.stringify({
        v: 2,
        revisionId: '99999999-9999-4999-8999-999999999999',
        token: 0,
        blocks: [{ key: 'local-2', type: 'PARAGRAPH', text: 'NEWER TEXT' }],
      }),
    );
    act(() => {
      advanceAuthEpoch(queryClient);
    });
    await until(
      container,
      () => hasButton(container, copyLabel),
      'reset status',
    );
    expect(hasButton(container, 'Скопировано')).toBe(false);
  });
});

describe('ordered block actions', () => {
  it('opens only on request, blocks boundary movement, closes after an action and guards pending writes', async () => {
    const { ProductBlockActions } = await import('./product-block-actions');
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const onMove = vi.fn();
    const onDelete = vi.fn();
    const render = (disabled: boolean) =>
      act(() =>
        root.render(
          createElement(ProductBlockActions, {
            kind: 'text',
            editable: true,
            disabled,
            first: true,
            last: false,
            onMove,
            onDelete,
            children: createElement('input', { 'aria-label': 'Текст' }),
          }),
        ),
      );
    const button = (label: string) =>
      [...container.querySelectorAll('button')].find(
        (node) =>
          node.textContent === label ||
          node.getAttribute('aria-label') === label,
      )!;
    try {
      render(false);
      act(() => container.querySelector('input')!.focus());
      expect(hasButton(container, 'Выше')).toBe(false);
      act(() => button('Действия с блоком').click());
      expect(button('Выше').disabled).toBe(true);
      act(() => button('Ниже').click());
      expect(onMove).toHaveBeenCalledExactlyOnceWith(1);
      expect(hasButton(container, 'Ниже')).toBe(false);
      act(() => button('Действия с блоком').click());
      render(true);
      act(() => button('Удалить').click());
      expect(onDelete).not.toHaveBeenCalled();
      render(false);
      act(() => button('Удалить').click());
      expect(onDelete).toHaveBeenCalledOnce();
      expect(hasButton(container, 'Удалить')).toBe(false);
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  });
});

/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { workImageMaxInputBytes } from '@bidplace/contracts';
import { ApiClientError, type ApiClient } from '@bidplace/api-client';
import {
  ProductDraftImagesStep,
  type ProductDraftImagesStepProps,
} from './product-draft-images';
import { useProductDraftImageActions } from './product-draft-image-actions';
import type { ProductDraftSaveSession } from './product-draft-save';
import type { ProductStoryEditor } from './use-product-story-editor';

import { flush, setInput } from '../../testing/dom';

import {
  advanceAuthEpoch,
  authKeys,
  clearAuthenticatedSession,
} from '../../lib/query-cache';
import { ownerWorkQueryKeys } from './owner-work-query';
import {
  workPhotoSessionKey,
  type WorkPhotoSession,
} from './work-photo-session';
import { prepareImageUpload, WORK_PHOTO_PREPARE } from '../../lib/media/prepare-image-upload';
import { originalPhotoEdit } from '../../lib/media/photo-edit';

vi.mock('../../lib/media/prepare-image-upload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/media/prepare-image-upload')>();
  return { ...actual, prepareImageUpload: vi.fn(async (input: { uri: string; file?: File }) => ({ uri: input.uri, blob: input.file ?? await (await fetch(input.uri)).blob() })) };
});

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.mock('../../components/shared/PrivateStoryImage', () => ({
  PrivateStoryImage: () => null,
}));
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
  addStoryImage: vi.fn(),
  storyError: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  reorderImages: vi.fn(),
  photoOperation: vi.fn(),
  removeImages: vi.fn(),
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
  ActivityIndicator: () => createElement('span', { role: 'progressbar' }),
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
    images: {
      add: harness.addImages,
      reorder: harness.reorderImages,
      photoOperation: harness.photoOperation,
      remove: harness.removeImages,
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
  InfrastructurePageStatus: ({ onRetry }: { onRetry?: () => void }) =>
    createElement(
      'button',
      { type: 'button', onClick: () => onRetry?.() },
      'Повторить',
    ),
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
            { role: 'dialog' },
            createElement('h2', null, title),
            children,
          )
        : null,
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

function detail(
  status = 'DRAFT',
  title = 'Saved title',
  updatedAt = '2026-09-27T00:00:00.000Z',
) {
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
    lastModerationReason:
      status === 'CHANGES_REQUESTED' ? 'Уточните название' : null,
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
        createElement(ProductDraftScreen, {
          productId,
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

function button(container: ParentNode, label: string) {
  return (
    [...container.querySelectorAll('button')].find(
      (node) =>
        node.textContent === label || node.getAttribute('aria-label') === label,
    ) ?? null
  );
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
  vi.mocked(prepareImageUpload).mockImplementation(async (input) => ({ uri: input.uri, blob: input.file ?? await (await fetch(input.uri)).blob() }));
  harness.addStoryImage.mockReset();
  harness.storyError.mockReset();
  harness.launchImageLibraryAsync.mockReset();
  harness.addImages.mockImplementation(async () => ({
    ok: true,
    photos: [
      {
        revisionId: '22222222-2222-4222-8222-222222222222',
        slotId: crypto.randomUUID(),
        imageId: crypto.randomUUID(),
        version: 0,
        crop: null,
      },
    ],
  }));
  harness.removeImages.mockReset();
  harness.removeImages.mockResolvedValue({ ok: true });
  harness.photoOperation.mockReset();
  harness.photoOperation.mockResolvedValue({ photo: null });
  harness.reorderImages.mockReset();
  harness.reorderImages.mockResolvedValue({
    ok: true,
    photos: [
      {
        revisionId: '22222222-2222-4222-8222-222222222222',
        slotId: '77777777-7777-4777-8777-777777777777',
        imageId: '88888888-8888-4888-8888-888888888888',
        version: 0,
        crop: null,
      },
    ],
  });
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

async function selectAndUpload(container: HTMLElement) {
  act(() => button(container, 'Добавить изображения')?.click());
  await until(
    container,
    () => button(container, 'Добавить изображения')?.disabled === false,
    'selection ready',
  );
  const start = [...container.querySelectorAll('button')].find(
    (node) =>
      /^Загрузить(?: \d+)? фото$/.test(node.textContent ?? '') &&
      !node.disabled,
  );
  if (start) act(() => start.click());
}

function mountImageActions(
  editorStatus: 'DRAFT' | 'APPROVED' = 'DRAFT',
  retainedClient?: QueryClient,
) {
  const queryClient =
    retainedClient ??
    new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.session, { id: 'user-a' });
  const emptyDetail = detail();
  emptyDetail.product.images = [];
  harness.getProduct.mockResolvedValue(emptyDetail);
  const session = {
    transitionLock: { current: false },
    snapshotOperation: () => 0,
    isCurrentOperation: vi.fn(() => true),
    persistedProductId: vi.fn(() => productId),
    inFlightSave: vi.fn(() => null),
    persistCurrentForm: vi.fn(async () => true),
    persistDirtyForm: vi.fn(async () => true),
  };
  let actions!: ReturnType<typeof useProductDraftImageActions>;
  const root = createRoot(document.createElement('div'));
  function Probe() {
    actions = useProductDraftImageActions({
      api: {
        sellers: { getProduct: harness.getProduct },
        images: {
          add: harness.addImages,
          reorder: harness.reorderImages,
          photoOperation: harness.photoOperation,
          remove: harness.removeImages,
        },
      } as unknown as ApiClient,
      queryClient,
      authEpoch: 0,
      existingProduct: { id: productId, images: [] },
      editorStatus,
      session: session as unknown as ProductDraftSaveSession,
      storyEditor: { addImage: harness.addStoryImage, reportError: harness.storyError } as unknown as ProductStoryEditor,
    });
    return null;
  }
  act(() =>
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Probe),
      ),
    ),
  );
  return {
    get actions() {
      return actions;
    },
    queryClient,
    session,
    unmount: () => act(() => root.unmount()),
  };
}

describe('product draft submit lifecycle', () => {
  it.each(['image/jpeg', 'image/png'])('prepares gallery and story %s with the shared photo options', async (mimeType) => {
    const source = { uri: 'blob:phone', width: 6000, height: 4000, mimeType, file: new File([new Uint8Array(9 * 1024 * 1024)], 'phone', { type: mimeType }) };
    const prepared = { uri: 'blob:prepared', blob: new Blob(['prepared'], { type: mimeType }) };
    vi.mocked(prepareImageUpload).mockResolvedValue(prepared);
    const view = mountImageActions();
    try {
      harness.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [source] });
      await act(() => view.actions.chooseStoryImage());
      expect(prepareImageUpload).toHaveBeenCalledWith(source, WORK_PHOTO_PREPARE);
      expect(harness.addStoryImage).toHaveBeenCalledWith(prepared.blob);
      expect(prepared.blob.size).toBeLessThanOrEqual(10 * 1024 * 1024);
      expect(prepared.blob.type).toBe(mimeType);
      harness.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [source] });
      await act(() => view.actions.chooseImages());
      await act(() => view.actions.startUpload());
      await flush();
      expect(prepareImageUpload).toHaveBeenLastCalledWith(source, WORK_PHOTO_PREPARE);
      expect(harness.addImages.mock.calls.at(-1)?.[1]).toEqual([prepared.blob]);
    } finally { view.unmount(); vi.mocked(prepareImageUpload).mockReset(); }
  });

  it('recovers accepted bytes after closing while preserving the pending crop and clears resources on logout', async () => {
    const client = new QueryClient();
    const dispose = vi.fn();
    const crop = { x: 0.1, y: 0.1, width: 0.7, height: 0.7 };
    const server = {
      revisionId: 'revision',
      slotId: 'slot',
      imageId: 'image',
      version: 0,
      crop: null,
    };
    const key = workPhotoSessionKey('user-a', productId);
    client.setQueryData<WorkPhotoSession>(key, {
      cards: [
        {
          id: 'local',
          uri: 'blob:local',
          source: { uri: 'blob:local' },
          sourceDispose: dispose,
          edit: { ...originalPhotoEdit, crop },
          operationKey: 'original',
          kind: 'add',
          status: 'error',
          uncertain: true,
        },
      ],
      revisionId: 'revision',
      orderConfirmed: false,
      orderError: null,
      busy: false,
    });
    harness.photoOperation.mockResolvedValue({ photo: server });
    const view = mountImageActions('DRAFT', client);
    try {
      await flush();
      const card = client.getQueryData<WorkPhotoSession>(key)!.cards[0]!;
      expect(harness.photoOperation).toHaveBeenCalledWith(
        productId,
        'original:0',
        undefined,
      );
      expect(card).toMatchObject({
        server,
        kind: 'crop',
        status: 'local',
        uncertain: false,
        operationKey: 'original:crop',
        edit: { crop },
      });
      expect(harness.addImages).not.toHaveBeenCalled();
      expect(dispose).not.toHaveBeenCalled();
      view.unmount();
      expect(client.getQueryData(key)).toBeDefined();
      await act(() => clearAuthenticatedSession(client));
      expect(client.getQueryData(key)).toBeUndefined();
      expect(dispose).toHaveBeenCalledOnce();
    } finally {
      client.clear();
    }
  });

  it.each(['blob:local', '/api/images/accepted-image'])(
    'waits for decoding only when reconciliation changes the source %s',
    async (uri) => {
      const client = new QueryClient();
      const dispose = vi.fn();
      const key = workPhotoSessionKey('user-a', productId);
      const server = {
        revisionId: 'revision',
        slotId: 'slot',
        imageId: 'accepted-image',
        version: 0,
        crop: null,
      };
      client.setQueryData<WorkPhotoSession>(key, {
        cards: [
          {
            id: 'local',
            uri,
            source: { uri: 'blob:local' },
            sourceDispose: dispose,
            edit: { ...originalPhotoEdit },
            operationKey: 'upload',
            kind: 'add',
            status: 'error',
            uncertain: true,
          },
        ],
        revisionId: 'revision',
        orderConfirmed: false,
        orderError: null,
        busy: false,
      });
      harness.photoOperation.mockResolvedValue({ photo: server });
      const view = mountImageActions('DRAFT', client);
      const confirmed = detail();
      confirmed.product.images = [
        {
          ...confirmed.product.images[0]!,
          id: 'accepted-image',
          slotId: 'slot',
        },
      ];
      harness.getProduct.mockResolvedValue(confirmed);
      try {
        await flush();
        if (uri === '/api/images/accepted-image') {
          expect(view.actions.photoCards[0]?.preview).toBeUndefined();
          expect(dispose).toHaveBeenCalledOnce();
          return;
        }
        expect(view.actions.photoCards[0]).toMatchObject({
          status: 'done',
          uri: '/api/images/accepted-image',
          preview: { uri: 'blob:local' },
        });
        expect(dispose).not.toHaveBeenCalled();
        act(() =>
          view.actions.photoLoadState(
            'local',
            '/api/images/accepted-image',
            'failed',
          ),
        );
        await flush();
        expect(view.actions.photoCards[0]?.preview?.failed).toBe(true);
        act(() =>
          view.actions.photoLoadState(
            'local',
            '/api/images/accepted-image',
            'loading',
          ),
        );
        await flush();
        expect(view.actions.photoCards[0]?.preview?.failed).toBe(false);
        expect(dispose).not.toHaveBeenCalled();
        act(() =>
          view.actions.photoLoadState('local', '/api/images/stale', 'loaded'),
        );
        expect(dispose).not.toHaveBeenCalled();
        act(() =>
          view.actions.photoLoadState(
            'local',
            '/api/images/accepted-image',
            'loaded',
          ),
        );
        expect(dispose).toHaveBeenCalledOnce();
        await flush();
        expect(view.actions.photoCards[0]?.preview).toBeUndefined();
        await act(() => clearAuthenticatedSession(client));
        expect(dispose).toHaveBeenCalledOnce();
      } finally {
        view.unmount();
        client.clear();
      }
    },
  );

  it.each(['oversized', 'empty', 'unreadable'] as const)(
    'does not transfer a previous %s source error to a valid file in one batch or separate selections',
    async (invalid) => {
      const bad =
        invalid === 'oversized'
          ? { uri: 'blob:bad', fileSize: workImageMaxInputBytes + 1 }
          : invalid === 'empty'
            ? { uri: 'blob:bad', file: new File([], 'bad.png') }
            : { uri: 'blob:bad' };
      const good = {
        uri: 'blob:valid',
        file: new File(['valid-bytes'], 'valid.jpg', { type: 'image/jpeg' }),
      };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('unreadable')),
      );
      for (const together of [true, false]) {
        const view = mountImageActions();
        try {
          harness.launchImageLibraryAsync.mockResolvedValueOnce({
            canceled: false,
            assets: together ? [bad, good] : [bad],
          });
          await act(() => view.actions.chooseImages());
          if (!together) {
            harness.launchImageLibraryAsync.mockResolvedValueOnce({
              canceled: false,
              assets: [good],
            });
            await act(() => view.actions.chooseImages());
          }
          await flush();
          expect(view.actions.photoCards.map((card) => card.status)).toEqual([
            'error',
            'local',
          ]);
          expect(view.actions.photoCards[1]!.error).toBeUndefined();
          await act(() => view.actions.startUpload());
          await flush();
          expect(harness.addImages.mock.calls.at(-1)?.[1]).toEqual([good.file]);
        } finally {
          view.unmount();
        }
      }
    },
  );

  it('accepts selected source files independently and allows reselecting a removed file', async () => {
    const asset = (bytes: string, name: string) => ({
      uri: `blob:${name}`,
      file: new File([bytes], name, { type: 'image/png' }),
    });
    const first = asset('same', 'first.png');
    harness.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        first,
        asset('same', 'different-name.png'),
        asset('diff', 'first.png'),
      ],
    });
    const view = mountImageActions();
    try {
      await act(() => view.actions.chooseImages());
      await flush();
      expect(view.actions.photoCards).toHaveLength(3);
      expect(view.actions.imageSelectionError).toBeNull();
      await act(() => view.actions.removePhoto(view.actions.photoCards[0]!.id));
      harness.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [first],
      });
      await act(() => view.actions.chooseImages());
      await flush();
      expect(view.actions.photoCards).toHaveLength(3);
      expect(harness.addImages).not.toHaveBeenCalled();
    } finally {
      view.unmount();
    }
  });

  it('keeps pending edits bound to their revision when the server switches revision', async () => {
    const view = mountImageActions();
    await flush();
    const key = workPhotoSessionKey('user-a', productId);
    const server = {
      revisionId: 'old-revision',
      slotId: 'old-slot',
      imageId: 'same-image',
      version: 0,
      crop: null,
    };
    act(() =>
      view.queryClient.setQueryData<WorkPhotoSession>(key, {
        cards: [
          {
            id: 'local',
            uri: 'blob:local',
            server,
            edit: {
              ...originalPhotoEdit,
              crop: { x: 0, y: 0, width: 0.5, height: 1 },
            },
            kind: 'crop',
            operationKey: 'edit',
            status: 'local',
          },
        ],
        revisionId: server.revisionId,
        busy: false,
        orderConfirmed: false,
        orderError: null,
      }),
    );
    try {
      await act(() => view.actions.startUpload());
      expect(harness.addImages).not.toHaveBeenCalled();
      expect(
        view.queryClient.getQueryData<WorkPhotoSession>(key),
      ).toMatchObject({
        cards: [{ server }],
        preparationError: expect.any(Error),
        orderError: null,
      });
    } finally {
      view.unmount();
    }
  });

  it('reconciles a lost upload response before removing its failed card', async () => {
    const view = mountImageActions();
    await flush();
    const key = workPhotoSessionKey('user-a', productId);
    const server = {
      revisionId: 'revision',
      slotId: 'accepted-slot',
      imageId: 'accepted-image',
      version: 0,
      crop: null,
    };
    act(() =>
      view.queryClient.setQueryData<WorkPhotoSession>(key, {
        cards: [
          {
            id: 'local',
            uri: 'blob:local',
            edit: originalPhotoEdit,
            kind: 'add',
            operationKey: 'lost',
            status: 'error',
            uncertain: true,
          },
        ],
        revisionId: null,
        busy: false,
        orderConfirmed: false,
        orderError: null,
      }),
    );
    harness.photoOperation.mockResolvedValue({ photo: server });
    try {
      await act(() => view.actions.removePhoto('local'));
      expect(harness.photoOperation).toHaveBeenCalledWith(
        productId,
        'lost:0',
        undefined,
      );
      expect(harness.removeImages).toHaveBeenCalledWith(
        productId,
        'accepted-image',
        'revision',
      );
      expect(
        view.queryClient.getQueryData<WorkPhotoSession>(key)!.cards,
      ).toEqual([]);
    } finally {
      view.unmount();
    }
  });

  it('retains an uncertain card when status is still unresolved and removes it after delayed acceptance', async () => {
    const view = mountImageActions();
    await flush();
    const key = workPhotoSessionKey('user-a', productId);
    act(() =>
      view.queryClient.setQueryData<WorkPhotoSession>(key, {
        cards: [
          {
            id: 'local',
            uri: 'blob:local',
            edit: originalPhotoEdit,
            kind: 'add',
            operationKey: 'pending',
            status: 'error',
            uncertain: true,
          },
        ],
        revisionId: null,
        busy: false,
        orderConfirmed: false,
        orderError: null,
      }),
    );
    try {
      await act(() => view.actions.removePhoto('local'));
      expect(harness.removeImages).not.toHaveBeenCalled();
      expect(view.actions.photoCards).toHaveLength(1);
      await act(async () => {
        expect(await view.actions.cancelUpload()).toBe(false);
      });
      expect(view.actions.photoCards).toHaveLength(1);
      harness.photoOperation.mockResolvedValue({
        photo: {
          revisionId: 'revision',
          slotId: 'slot',
          imageId: 'accepted',
          version: 0,
          crop: null,
        },
      });
      await act(() => view.actions.removePhoto('local'));
      expect(harness.removeImages).toHaveBeenCalledWith(
        productId,
        'accepted',
        'revision',
      );
      expect(
        view.queryClient.getQueryData<WorkPhotoSession>(key)!.cards,
      ).toHaveLength(0);
    } finally {
      view.unmount();
    }
  });

  it('does not open a local editor after its operation is retired while refreshing', async () => {
    const view = mountImageActions();
    await flush();
    const key = workPhotoSessionKey('user-a', productId);
    act(() =>
      view.queryClient.setQueryData<WorkPhotoSession>(key, {
        cards: [
          {
            id: 'local',
            uri: 'blob:local',
            edit: originalPhotoEdit,
            kind: 'add',
            operationKey: 'local',
            status: 'local',
          },
        ],
        revisionId: null,
        busy: false,
        orderConfirmed: false,
        orderError: null,
      }),
    );
    let finish!: (value: ReturnType<typeof detail>) => void;
    harness.getProduct.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    let opening!: Promise<void>;
    act(() => {
      opening = view.actions.editPhoto('local');
    });
    await flush();
    view.session.isCurrentOperation.mockReturnValue(false);
    await act(async () => {
      finish(detail());
      await opening;
    });
    expect(view.actions.editingPhoto).toBeNull();
    view.unmount();
  });

  it('allows a slow large upload and retries a timed-out request with the same identity', async () => {
    const image = new Blob([new Uint8Array(25 * 1024 * 1024)], {
      type: 'image/png',
    });
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:large', file: image }],
    });
    harness.addImages
      .mockImplementationOnce(
        (_id, _images, _key, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      )
      .mockResolvedValue({
        ok: true,
        photos: [
          {
            revisionId: '22222222-2222-4222-8222-222222222222',
            slotId: '77777777-7777-4777-8777-777777777777',
            imageId: '88888888-8888-4888-8888-888888888888',
            version: 0,
            crop: null,
          },
        ],
      });
    const timer = vi.spyOn(globalThis, 'setTimeout');
    const view = mount();
    try {
      await until(
        view.container,
        () => Boolean(button(view.container, 'Добавить изображения')),
        'images',
      );
      await selectAndUpload(view.container);
      await until(
        view.container,
        () => harness.addImages.mock.calls.length === 1,
        'upload',
      );
      const deadline = timer.mock.calls.find((call) => call[1] === 460_000);
      expect(deadline).toBeDefined();
      await act(async () => {
        const expire = deadline![0];
        if (typeof expire !== 'function')
          throw new Error('Expected a timeout callback');
        expire();
        await Promise.resolve();
      });
      await until(
        view.container,
        () =>
          Boolean(
            [...view.container.querySelectorAll('button')].find((node) =>
              node
                .getAttribute('aria-label')
                ?.startsWith('Повторить загрузку фото'),
            ),
          ),
        'retry',
      );
      await until(
        view.container,
        () =>
          Boolean(
            view.container.textContent?.includes(
              'Загрузка заняла слишком много времени',
            ),
          ),
        'timeout feedback',
      );
      expect(view.container.textContent).toContain(
        'Загрузка заняла слишком много времени',
      );
      act(() =>
        [...view.container.querySelectorAll('button')]
          .find((node) =>
            node
              .getAttribute('aria-label')
              ?.startsWith('Повторить загрузку фото'),
          )
          ?.click(),
      );
      await until(
        view.container,
        () => harness.addImages.mock.calls.length === 2,
        'second upload',
      );
      expect(harness.addImages.mock.calls[1]?.slice(0, 3)).toEqual(
        harness.addImages.mock.calls[0]?.slice(0, 3),
      );
    } finally {
      view.unmount();
      timer.mockRestore();
    }
  });

  it('offers confirmed local-photo discard only when closing, and keeps edits when the dialog is cancelled', async () => {
    const file = new File(['local'], 'local.png', { type: 'image/png' });
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:local', file }],
    });
    const view = mount({ flow: 'creation', stepParam: '2' });
    const key = workPhotoSessionKey('user-a', productId);
    try {
      await until(
        view.container,
        () => Boolean(button(view.container, 'Добавить изображения')),
        'images',
      );
      act(() => button(view.container, 'Добавить изображения')!.click());
      await until(
        view.container,
        () => Boolean(button(view.container, 'Загрузить 1 фото')),
        'local selection',
      );
      expect(
        button(view.container, 'Отбросить локальные изменения'),
      ).toBeNull();
      expect(harness.addImages).not.toHaveBeenCalled();
      const localId = view.queryClient
        .getQueryData<WorkPhotoSession>(key)!
        .cards.find((card) => card.source?.file === file)!.id;
      act(() => button(view.container, 'Закрыть')!.click());
      await flush();
      expect(
        view.container.querySelector('[role="dialog"]')?.textContent,
      ).toContain('Отбросить локальные изменения фото?');
      act(() => button(view.container, 'Продолжить редактирование')!.click());
      await flush();
      expect(view.container.querySelector('[role="dialog"]')).toBeNull();
      expect(
        view.queryClient
          .getQueryData<WorkPhotoSession>(key)!
          .cards.some((card) => card.id === localId),
      ).toBe(true);
      expect(harness.replace).not.toHaveBeenCalled();
      act(() => button(view.container, 'Закрыть')!.click());
      await flush();
      act(() => button(view.container, 'Отбросить изменения')!.click());
      await until(
        view.container,
        () => harness.replace.mock.calls.some((call) => call[0] === '/profile'),
        'confirmed close',
      );
      expect(
        view.queryClient
          .getQueryData<WorkPhotoSession>(key)!
          .cards.some((card) => card.id === localId),
      ).toBe(false);
      expect(harness.removeImages).not.toHaveBeenCalled();
    } finally {
      view.unmount();
    }
  });

  it('keeps closing available while a photo is being sent', async () => {
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'blob:image', file: new Blob(['image'], { type: 'image/png' }) },
      ],
    });
    let finish: () => void = () => undefined;
    harness.addImages.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ ok: true });
        }),
    );
    const view = mount({ flow: 'creation', stepParam: '2' });
    try {
      await until(
        view.container,
        () => Boolean(button(view.container, 'Добавить изображения')),
        'images',
      );
      await selectAndUpload(view.container);
      await until(
        view.container,
        () => harness.addImages.mock.calls.length === 1,
        'upload',
      );
      expect(button(view.container, 'Закрыть')?.disabled).toBe(false);
      await until(
        view.container,
        () => Boolean(button(view.container, 'Продолжить')),
        'upload CTA label',
      );
      expect(button(view.container, 'Продолжить')?.disabled).toBe(true);
      expect(
        button(view.container, 'Завершите загрузку фотографий'),
      ).toBeNull();
      harness.setParams.mockClear();
      act(() => button(view.container, 'Назад')?.click());
      expect(harness.setParams).not.toHaveBeenCalled();
      await act(async () => {
        finish();
        await Promise.resolve();
      });
      await until(
        view.container,
        () => !button(view.container, 'Назад')?.disabled,
        'unlock',
      );
    } finally {
      view.unmount();
    }
  });

  it('keeps a submitted draft closed until a newer moderation decision arrives', async () => {
    let resolveSubmit: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        button(view.container, 'Отправить на модерацию') instanceof
        HTMLButtonElement,
      'submit',
    );
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
    const cached = view.queryClient.getQueryData<{
      editingRevision?: { status: string };
    }>(ownerWorkQueryKeys.detail(productId));
    expect(cached?.editingRevision?.status).toBe('DRAFT');
    expect(
      button(view.container, 'Отправить на модерацию')?.hasAttribute(
        'disabled',
      ),
    ).not.toBe(false);
    expect(button(view.container, 'Сохранить изменения')).toBeNull();
    const title = view.container.querySelector<HTMLInputElement>(
      '[aria-label="Название"]',
    );
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
    expect(
      view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')
        ?.value,
    ).toBe('Revised title');
    expect(
      view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')
        ?.disabled,
    ).toBe(false);
    view.unmount();
  });

  it('enables Close after a creation submit and still accepts a later rejection', async () => {
    let resolveSubmit: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount({ flow: 'creation', stepParam: '4' });
    await until(
      view.container,
      () =>
        button(view.container, 'Отправить на модерацию') instanceof
        HTMLButtonElement,
      'submit',
    );
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
    expect(
      button(view.container, 'Повторно отправить на модерацию'),
    ).toBeInstanceOf(HTMLButtonElement);
    view.unmount();
  });

  it('releases the transition lock when the post-submit refetch fails', async () => {
    let resolveSubmit: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount({ flow: 'creation', stepParam: '4' });
    await until(
      view.container,
      () =>
        button(view.container, 'Отправить на модерацию') instanceof
        HTMLButtonElement,
      'submit',
    );
    act(() => {
      button(view.container, 'Отправить на модерацию')?.click();
    });
    await flush();
    harness.getProduct.mockRejectedValue(new Error('refetch failed'));
    await act(async () => {
      resolveSubmit({ product: product('PENDING_REVIEW') });
      await Promise.resolve();
    });
    await until(
      view.container,
      () => button(view.container, 'Повторить') instanceof HTMLButtonElement,
      'retry',
    );
    harness.getProduct.mockResolvedValue(
      detail('CHANGES_REQUESTED', 'Saved title', '2026-09-30T00:00:00.000Z'),
    );
    act(() => {
      button(view.container, 'Повторить')?.click();
    });
    await until(
      view.container,
      () =>
        button(view.container, 'Повторно отправить на модерацию') instanceof
        HTMLButtonElement,
      'recovered submit',
    );
    expect(
      button(view.container, 'Повторно отправить на модерацию')?.hasAttribute(
        'disabled',
      ),
    ).toBe(false);
    expect(button(view.container, 'Закрыть')?.hasAttribute('disabled')).toBe(
      false,
    );
    view.unmount();
  });

  it.each([
    ['another account', 'user-b'],
    ['the same account', 'user-a'],
  ] as const)(
    'does not submit a work update that finishes after login of %s',
    async (_label, nextUserId) => {
      let resolveUpdate: (value: {
        product: ReturnType<typeof product>;
      }) => void = () => undefined;
      harness.updateProduct.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          }),
      );
      const view = mount();
      await until(
        view.container,
        () =>
          button(view.container, 'Отправить на модерацию') instanceof
          HTMLButtonElement,
        'submit',
      );
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
        view.queryClient.setQueryData(
          ownerWorkQueryKeys.detail(productId),
          workB,
        );
        advanceAuthEpoch(view.queryClient);
      });
      await flush();
      await act(async () => {
        resolveUpdate({ product: product('DRAFT', 'From user A') });
        await Promise.resolve();
      });
      await flush();
      expect(harness.submitProduct).not.toHaveBeenCalled();
      expect(
        view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId)),
      ).toEqual(workB);
      expect(
        view.container.querySelector<HTMLInputElement>(
          '[aria-label="Название"]',
        )?.value,
      ).toBe('User B title');
      view.unmount();
    },
  );

  it.each(['CHANGES_REQUESTED', 'REJECTED'] as const)(
    'keeps a resubmitted %s work locked when the refetch is the previous snapshot',
    async (status) => {
      const initial = detail(
        status,
        'Needs changes',
        '2026-09-27T00:00:00.000Z',
      );
      harness.getProduct.mockResolvedValue(initial);
      let resolveSubmit: (value: {
        product: ReturnType<typeof product>;
      }) => void = () => undefined;
      harness.submitProduct.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          }),
      );
      const view = mount();
      await until(
        view.container,
        () =>
          button(view.container, 'Повторно отправить на модерацию') instanceof
          HTMLButtonElement,
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
      expect(
        view.container.querySelector<HTMLInputElement>(
          '[aria-label="Название"]',
        )?.disabled,
      ).toBe(true);
      expect(button(view.container, 'Сохранить изменения')).toBeNull();
      expect(
        button(view.container, 'Повторно отправить на модерацию')?.hasAttribute(
          'disabled',
        ),
      ).not.toBe(false);
      view.unmount();
    },
  );

  it('opens editing after a newer approval even when the parent clock did not move', async () => {
    const initial = detail(
      'CHANGES_REQUESTED',
      'Needs changes',
      '2026-09-27T00:00:00.000Z',
    );
    harness.getProduct.mockResolvedValue(initial);
    let resolveSubmit: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        button(view.container, 'Повторно отправить на модерацию') instanceof
        HTMLButtonElement,
      'resubmit',
    );
    act(() => {
      button(view.container, 'Повторно отправить на модерацию')?.click();
    });
    await flush();
    const approved = detail(
      'APPROVED',
      'Approved title',
      '2026-09-27T00:00:00.000Z',
    );
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
    expect(
      view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')
        ?.disabled,
    ).toBe(false);
    expect(
      view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')
        ?.value,
    ).toBe('Edited after approval');
    view.unmount();
  });

  it('does not let a stale moderation snapshot replace a newer decision', async () => {
    const initial = detail(
      'CHANGES_REQUESTED',
      'Needs changes',
      '2026-09-27T00:00:00.000Z',
    );
    harness.getProduct.mockResolvedValue(initial);
    let resolveSubmit: (value: {
      product: ReturnType<typeof product>;
    }) => void = () => undefined;
    let resolveRefetch: (value: ReturnType<typeof detail>) => void = () =>
      undefined;
    harness.submitProduct.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        button(view.container, 'Повторно отправить на модерацию') instanceof
        HTMLButtonElement,
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
    const approved = detail(
      'APPROVED',
      'Approved title',
      '2026-09-27T00:00:00.000Z',
    );
    approved.editingRevision.updatedAt = '2026-09-30T00:00:00.000Z';
    approved.editingRevision.status = 'APPROVED';
    act(() => {
      view.queryClient.setQueryData(
        ownerWorkQueryKeys.detail(productId),
        approved,
      );
    });
    await flush();
    await act(async () => {
      resolveRefetch(initial);
      await Promise.resolve();
    });
    await flush();
    expect(
      view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId)),
    ).toEqual(approved);
    expect(
      view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')
        ?.value,
    ).toBe('Approved title');
    expect(
      view.container.querySelector<HTMLInputElement>('[aria-label="Название"]')
        ?.disabled,
    ).toBe(false);
    view.unmount();
  });

  it('selects without reading or uploading and freezes the inputs when upload starts', async () => {
    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.png', { type: 'image/png' });
    const assets = [
      { uri: 'blob:first', file: first },
      { uri: 'blob:second', file: second },
    ];
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets,
    });
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
      expect(harness.addImages.mock.calls.map((call) => call[1])).toEqual([
        [first],
        [second],
      ]);
      expect(read).not.toHaveBeenCalled();
      await act(() => view.actions.startUpload(selection));
      await flush();
      expect(harness.addImages).toHaveBeenCalledTimes(2);
    } finally {
      view.unmount();
    }
  });

  it.each([
    'unmount',
    'session-change',
    'operation-change',
    'product-change',
    'new-selection',
  ] as const)('rejects a deferred selection after %s', async (reason) => {
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:photo' }],
    });
    const read = vi.fn();
    vi.stubGlobal('fetch', read);
    const view = mountImageActions();
    const selected = (await act(() => view.actions.selectImages()))!;
    try {
      if (reason === 'unmount') view.unmount();
      else if (reason === 'session-change')
        await act(() => clearAuthenticatedSession(view.queryClient));
      else if (reason === 'operation-change')
        view.session.isCurrentOperation.mockReturnValue(false);
      else if (reason === 'product-change')
        view.session.persistedProductId.mockReturnValue('other-work');
      else await act(() => view.actions.selectImages());
      await act(() => view.actions.startUpload(selected));
      await flush();
      expect(read).not.toHaveBeenCalled();
      expect(harness.addImages).not.toHaveBeenCalled();
    } finally {
      if (reason !== 'unmount') view.unmount();
    }
  });

  it('waits for the current approved form save before starting a deferred upload', async () => {
    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:photo', file }],
    });
    const view = mountImageActions('APPROVED');
    try {
      const selected = (await act(() => view.actions.selectImages()))!;
      let finishSave!: (saved: boolean) => void;
      view.session.persistDirtyForm.mockImplementation(
        () =>
          new Promise((resolve) => {
            finishSave = resolve;
          }),
      );
      let start!: Promise<void>;
      act(() => {
        start = view.actions.startUpload(selected);
      });
      await act(() => view.actions.startUpload(selected));
      expect(harness.addImages).not.toHaveBeenCalled();
      expect(view.actions.photosBusy).toBe(true);
      await act(async () => {
        finishSave(true);
        await start;
      });
      await flush();
      expect(harness.addImages).toHaveBeenCalledTimes(1);
      expect(harness.addImages.mock.calls[0]?.[1]).toEqual([file]);
    } finally {
      view.unmount();
    }
  });

  it.each(['failed-save', 'session-change', 'unmount'] as const)(
    'does not start a deferred upload when the approved save ends after %s',
    async (reason) => {
      harness.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'blob:photo' }],
      });
      const view = mountImageActions('APPROVED');
      const selected = (await act(() => view.actions.selectImages()))!;
      let finishSave!: (saved: boolean) => void;
      view.session.persistDirtyForm.mockImplementation(
        () =>
          new Promise((resolve) => {
            finishSave = resolve;
          }),
      );
      let start!: Promise<void>;
      act(() => {
        start = view.actions.startUpload(selected);
      });
      await flush();
      try {
        if (reason === 'unmount') {
          view.unmount();
          expect(
            view.queryClient.getQueryData<WorkPhotoSession>(
              workPhotoSessionKey('user-a', productId),
            )?.busy,
          ).toBe(false);
        } else if (reason === 'session-change')
          await act(() => clearAuthenticatedSession(view.queryClient));
        await act(async () => {
          finishSave(reason !== 'failed-save');
          await start;
        });
        await flush();
        expect(harness.addImages).not.toHaveBeenCalled();
      } finally {
        if (reason !== 'unmount') view.unmount();
      }
    },
  );

  it.each([
    { fileSize: 0, message: 'Выбранный файл пустой.' },
    {
      fileSize: workImageMaxInputBytes + 1,
      message: 'Исходный файл слишком большой.',
    },
  ])(
    'reports an invalid $fileSize-byte Work file without uploading',
    async ({ fileSize, message }) => {
      harness.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'blob:invalid', fileSize, file: new Blob([]) }],
      });
      const view = mount();
      try {
        await until(
          view.container,
          () => Boolean(button(view.container, 'Добавить изображения')),
          'images',
        );
        await selectAndUpload(view.container);
        await until(
          view.container,
          () => Boolean(view.container.textContent?.includes(message)),
          'file error',
        );
        expect(harness.addImages).not.toHaveBeenCalled();
      } finally {
        view.unmount();
      }
    },
  );

  it.each(['picker', 'read'] as const)(
    'ignores a late %s result after unmount',
    async (phase) => {
      const file = new Blob(['photo'], { type: 'image/png' });
      let finish!: () => void;
      if (phase === 'picker') {
        harness.launchImageLibraryAsync.mockImplementation(
          () =>
            new Promise((resolve) => {
              finish = () =>
                resolve({ canceled: false, assets: [{ uri: 'blob:photo' }] });
            }),
        );
      } else {
        harness.launchImageLibraryAsync.mockResolvedValue({
          canceled: false,
          assets: [{ uri: 'blob:photo' }],
        });
        vi.stubGlobal(
          'fetch',
          vi.fn(
            () =>
              new Promise((resolve) => {
                finish = () => resolve({ ok: true, blob: async () => file });
              }),
          ),
        );
      }
      const view = mountImageActions();
      let choosing!: Promise<void>;
      act(() => {
        choosing = view.actions
          .chooseImages()
          .then(() =>
            phase === 'read' ? view.actions.startUpload() : undefined,
          );
      });
      await flush();
      view.unmount();
      await act(async () => {
        finish();
        await choosing;
      });
      await flush();
      expect(harness.addImages).not.toHaveBeenCalled();
    },
  );

  it('retries an unknown upload response with the same blobs and identity without reopening the picker', async () => {
    const image = new Blob(['image'], { type: 'image/png' });
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:image' }],
    });
    harness.addImages
      .mockRejectedValueOnce(new Error('response lost'))
      .mockResolvedValue({
        ok: true,
        photos: [
          {
            revisionId: '22222222-2222-4222-8222-222222222222',
            slotId: '77777777-7777-4777-8777-777777777777',
            imageId: '88888888-8888-4888-8888-888888888888',
            version: 0,
            crop: null,
          },
        ],
      });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => image })),
    );
    const view = mount();
    await until(
      view.container,
      () => Boolean(button(view.container, 'Добавить изображения')),
      'images',
    );
    await selectAndUpload(view.container);
    await until(
      view.container,
      () =>
        Boolean(
          [...view.container.querySelectorAll('button')].find((node) =>
            node
              .getAttribute('aria-label')
              ?.startsWith('Повторить загрузку фото'),
          ),
        ),
      'retry',
    );
    act(() =>
      [...view.container.querySelectorAll('button')]
        .find((node) =>
          node
            .getAttribute('aria-label')
            ?.startsWith('Повторить загрузку фото'),
        )
        ?.click(),
    );
    await flush();
    expect(harness.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
    expect(harness.addImages).toHaveBeenCalledTimes(2);
    expect(harness.addImages.mock.calls[1]?.slice(0, 3)).toEqual(
      harness.addImages.mock.calls[0]?.slice(0, 3),
    );
    expect(harness.addImages.mock.calls[0]?.[2]).toEqual(expect.any(String));
    vi.unstubAllGlobals();
    view.unmount();
  });

  it('continues after a failed photo and retries only that photo before confirming the selected order', async () => {
    const files = ['first', 'second', 'third'].map(
      (text) => new File([text], `${text}.png`, { type: 'image/png' }),
    );
    const initial = detail();
    const results = files.map((_, index) => ({
      revisionId: initial.editingRevision.id,
      slotId: `77777777-7777-4777-8777-77777777777${index}`,
      imageId: `88888888-8888-4888-8888-88888888888${index}`,
      version: 0,
      crop: null,
    }));
    const serverImages = [...initial.product.images];
    harness.getProduct.mockImplementation(async () => ({
      ...initial,
      product: { ...initial.product, images: [...serverImages] },
    }));
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: files.map((file, i) => ({ uri: `blob:${i}`, file })),
    });
    let failed = false;
    harness.addImages.mockImplementation(async (_id, [file]) => {
      const index = files.indexOf(file);
      if (index === 1 && !failed) {
        failed = true;
        throw new Error('response lost');
      }
      const result = results[index]!;
      serverImages.push({
        ...initial.product.images[0]!,
        id: result.imageId,
        slotId: result.slotId,
        position: serverImages.length,
      });
      return { ok: true, photos: [result] };
    });
    harness.reorderImages.mockImplementation(async (_id, ids) => {
      serverImages.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      return { ok: true };
    });
    const view = mount({ flow: 'creation', stepParam: '2' });
    try {
      await until(
        view.container,
        () => Boolean(button(view.container, 'Добавить изображения')),
        'images',
      );
      await selectAndUpload(view.container);
      await until(
        view.container,
        () => harness.addImages.mock.calls.length === 3,
        'other files continued',
      );
      await flush();
      expect(harness.addImages.mock.calls.map((call) => call[1])).toEqual([
        [files[0]],
        [files[1]],
        [files[2]],
      ]);
      expect(harness.reorderImages).not.toHaveBeenCalled();
      expect(button(view.container, '3. История создания')?.disabled).toBe(
        true,
      );
      expect(button(view.container, 'Добавить изображения')?.disabled).toBe(
        false,
      );
      const retry = button(view.container, 'Повторить загрузку фото 3');
      expect(retry).toBeDefined();
      act(() => retry?.click());
      await until(
        view.container,
        () => harness.addImages.mock.calls.length === 4,
        'addressed retry',
      );
      await until(
        view.container,
        () => button(view.container, 'Продолжить')?.disabled === false,
        'confirmed order',
      );
      expect(harness.addImages.mock.calls[3]?.slice(0, 3)).toEqual(
        harness.addImages.mock.calls[1]?.slice(0, 3),
      );
      expect(harness.reorderImages.mock.calls[0]?.[1]).toEqual([
        initial.product.images[0]!.id,
        ...results.map((result) => result.imageId),
      ]);
      act(() => button(view.container, 'Продолжить')?.click());
      await until(
        view.container,
        () =>
          harness.setParams.mock.calls.some(([params]) => params.step === '3'),
        'story',
      );
    } finally {
      view.unmount();
    }
  });

  it('removes only a terminal failed card and permits selecting its source again', async () => {
    const image = new File(['valid'], 'photo.png', { type: 'image/png' });
    harness.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'blob:first', file: image },
        { uri: 'blob:too-large', fileSize: workImageMaxInputBytes + 1 },
      ],
    });
    const view = mount({ flow: 'creation', stepParam: '2' });
    try {
      await until(
        view.container,
        () => Boolean(button(view.container, 'Добавить изображения')),
        'images',
      );
      await selectAndUpload(view.container);
      await until(
        view.container,
        () => harness.addImages.mock.calls.length === 1,
        'valid photo uploaded',
      );
      await flush();
      expect(view.container.textContent).toContain(
        'Исходный файл слишком большой',
      );
      expect(button(view.container, 'Повторить загрузку фото 3')).toBeNull();
      await until(
        view.container,
        () => button(view.container, 'Удалить фото 3')?.disabled === false,
        'delete enabled',
      );
      act(() => button(view.container, 'Удалить фото 3')?.click());
      await until(
        view.container,
        () =>
          !view.container.textContent?.includes(
            'Исходный файл слишком большой',
          ),
        'failed card removed',
      );
      expect(view.container.textContent).not.toContain(
        'Исходный файл слишком большой',
      );
      expect(harness.addImages).toHaveBeenCalledTimes(1);
    } finally {
      view.unmount();
    }
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
        await selectAndUpload(view.container);
        await until(
          view.container,
          () => harness.addImages.mock.calls.length === 1,
          'first request',
        );
        const signal = harness.addImages.mock.calls[0]![3]
          .signal as AbortSignal;
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
      await selectAndUpload(view.container);
      await flush();
      expect(harness.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
      expect(harness.addImages).not.toHaveBeenCalled();
      expect(
        [...view.container.querySelectorAll('button')].find((node) =>
          node
            .getAttribute('aria-label')
            ?.startsWith('Повторить загрузку фото'),
        ),
      ).toBeUndefined();
      expect(button(view.container, 'Добавить изображения')?.disabled).toBe(
        false,
      );
    } finally {
      view.unmount();
    }
  });

  it('does not upload a work image chosen by the previous session', async () => {
    const imageA = new Blob(['image-a'], { type: 'image/png' });
    let resolvePicker: (value: {
      canceled: boolean;
      assets: Array<{ uri: string }>;
    }) => void = () => undefined;
    harness.launchImageLibraryAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => imageA })),
    );
    const view = mount();
    await until(
      view.container,
      () =>
        button(view.container, 'Добавить изображения') instanceof
        HTMLButtonElement,
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
      view.queryClient.setQueryData(
        ownerWorkQueryKeys.detail(productId),
        workB,
      );
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
      () =>
        button(view.container, 'Добавить изображения') instanceof
        HTMLButtonElement,
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
      view.queryClient.setQueryData(
        ownerWorkQueryKeys.detail(productId),
        workB,
      );
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
      const initial = detail(
        status,
        'Needs changes',
        '2026-09-27T00:00:00.000Z',
      );
      harness.getProduct.mockResolvedValue(initial);
      let resolveSubmit: (value: {
        product: ReturnType<typeof product>;
      }) => void = () => undefined;
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
        () =>
          button(view.container, 'Повторно отправить на модерацию') instanceof
          HTMLButtonElement,
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
      const savedDuringSubmit = detail(
        status,
        'Needs changes',
        '2026-09-28T00:00:00.000Z',
      );
      await act(async () => {
        resolveSubmit({ product: product('PENDING_REVIEW', 'Needs changes') });
        reads[0]?.(savedDuringSubmit);
        await Promise.resolve();
      });
      await flush();
      await flush();
      expect(
        view.container.querySelector<HTMLInputElement>(
          '[aria-label="Название"]',
        )?.disabled,
      ).toBe(true);
      expect(button(view.container, 'Сохранить изменения')).toBeNull();
      expect(
        button(view.container, 'Повторно отправить на модерацию'),
      ).toBeNull();
      const pending = detail(
        'PENDING_REVIEW',
        'Needs changes',
        '2026-09-29T00:00:00.000Z',
      );
      const pendingRead = reads.at(-1);
      expect(pendingRead).toBeTypeOf('function');
      await act(async () => {
        pendingRead?.(pending);
        await Promise.resolve();
      });
      await flush();
      expect(
        view.queryClient.getQueryData(ownerWorkQueryKeys.detail(productId)),
      ).toEqual(pending);
      expect(
        view.container.querySelector<HTMLInputElement>(
          '[aria-label="Название"]',
        )?.disabled,
      ).toBe(true);
      expect(button(view.container, 'Сохранить изменения')).toBeNull();
      expect(
        button(view.container, 'Повторно отправить на модерацию'),
      ).toBeNull();
      act(() => {
        view.queryClient.setQueryData(
          ownerWorkQueryKeys.detail(productId),
          detail(status, 'Needs changes', '2026-09-30T00:00:00.000Z'),
        );
      });
      await flush();
      expect(
        button(view.container, 'Повторно отправить на модерацию'),
      ).toBeInstanceOf(HTMLButtonElement);
      expect(
        view.container.querySelector<HTMLInputElement>(
          '[aria-label="Название"]',
        )?.disabled,
      ).toBe(false);
      view.unmount();
    },
  );
});

describe('photo status transitions', () => {
  it('distinguishes preparation, sending, order confirmation and completion in one status area', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const props: ProductDraftImagesStepProps = {
      images: [],
      productStatus: 'DRAFT',
      editable: true,
      isCreationFlow: true,
      wizardStep: 2,
      reorderPending: false,
      removePending: false,
      uploadPending: false,
      uploadError: false,
      imageSelectionError: null,
      removeOrReorderError: false,
      onChooseImages() {},
      onMoveImage() {},
      onDeleteImage() {},
    };
    const transitions = [
      ['local', true, 'Подготовка фотографий'],
      ['preparing', true, 'Подготовка фотографий'],
      ['uploading', true, 'Загрузка фотографий'],
      ['done', true, 'Сохранение порядка'],
      ['done', false, 'Загружено 1 из 1'],
    ] as const;
    try {
      for (const [status, pending, expected] of transitions) {
        act(() =>
          root.render(
            createElement(ProductDraftImagesStep, {
              ...props,
              photoOperationPending: pending,
              photoCards: [
                {
                  id: 'photo',
                  uri: 'blob:photo',
                  kind: 'add',
                  operationKey: 'upload',
                  status,
                  edit: { ...originalPhotoEdit },
                },
              ],
            }),
          ),
        );
        expect(container.textContent).toContain(expected);
        if (status === 'uploading')
          expect(container.textContent).not.toContain('Подготовка фотографий');
      }
    } finally {
      act(() => root.unmount());
    }
  });
});

describe('photo failure feedback', () => {
  it.each([
    {
      status: 401,
      order: true,
      title: 'Не удалось сохранить порядок',
      message: 'Фото загружены, но порядок ещё не подтверждён.',
    },
    {
      status: 403,
      order: false,
      title: 'Не удалось начать загрузку',
      message: 'Нет доступа к изменению фото этой работы.',
    },
    {
      status: 409,
      order: false,
      title: 'Не удалось начать загрузку',
      message: 'Работа изменилась в другой сессии.',
    },
    {
      status: 503,
      order: true,
      title: 'Не удалось сохранить порядок',
      message:
        'Фото загружены. Проверьте соединение и повторите сохранение порядка.',
    },
  ])(
    'explains HTTP $status for order=$order without unsafe reload advice',
    ({ status, order, title, message }) => {
      const error = new ApiClientError('Synthetic failure', {
        kind: status === 409 ? 'conflict' : 'server',
        status,
      });
      const container = document.createElement('div');
      const root = createRoot(container);
      const props: ProductDraftImagesStepProps = {
        photoCards: [],
        images: [],
        productStatus: 'DRAFT',
        editable: true,
        isCreationFlow: true,
        wizardStep: 2,
        reorderPending: false,
        removePending: false,
        uploadPending: false,
        uploadError: false,
        imageSelectionError: null,
        removeOrReorderError: false,
        photoOrderError: order ? error : null,
        photoPreparationError: order ? null : error,
        onChooseImages() {},
        onMoveImage() {},
        onDeleteImage() {},
      };
      try {
        act(() => root.render(createElement(ProductDraftImagesStep, props)));
        expect(container.textContent).toContain(title);
        expect(container.textContent).toContain(message);
        expect(container.textContent).not.toContain('Обновите страницу');
        act(() =>
          root.render(
            createElement(ProductDraftImagesStep, {
              ...props,
              imageSelectionError: 'Не удалось прочитать выбранное фото.',
            }),
          ),
        );
        expect(container.textContent).toContain('Не удалось выбрать фото');
        expect(container.textContent).toContain('Не удалось прочитать выбранное фото.');
        expect(container.textContent).not.toContain(message);
      } finally {
        act(() => root.unmount());
      }
    },
  );
});

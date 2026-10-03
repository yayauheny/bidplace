/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@bidplace/api-client';

import { ApiProvider } from '../providers/api-provider';
import { AnalyticsProvider } from '../providers/analytics-provider';
import { authKeys, categoryKeys } from './query-cache';
import { ProductListScreen } from '../features/products/product-list-screen';
import { ProductDraftScreen } from '../features/sellers/product-draft-screen';
import { PublicSellerScreen } from '../features/sellers/public-seller-screen';
import { CategoriesSearchPane } from '../features/search/panes/CategoriesSearchPane';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

notifyManager.setNotifyFunction((callback) => {
  act(() => {
    callback();
  });
});

afterAll(() => {
  notifyManager.setNotifyFunction((callback) => {
    callback();
  });
});

const categoryId = '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1';
const productId = '11111111-1111-4111-8111-111111111111';
const sellerId = '44444444-4444-4444-8444-444444444444';
const checksum = 'ab'.repeat(32);

const categoriesBody = {
  categories: [
    {
      id: categoryId,
      slug: 'glass',
      name: 'Glass',
      description: null,
    },
  ],
};

const harness = vi.hoisted(() => {
  const state: {
    fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  } = {
    fetchImpl: () => Promise.reject(new Error('category fetch was not installed')),
  };
  const sessionUser = {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'author@example.com',
    phone: null,
    emailVerifiedAt: '2026-04-01T00:00:00.000Z',
    phoneVerifiedAt: null,
    acceptedRulesVersion: null,
    displayName: 'Maker 1',
    role: 'user' as const,
    status: 'active' as const,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  };
  return { state, sessionUser };
});

vi.mock('../lib/api', () => ({
  createMobileApiClient: () => {
    const fetchImpl = harness.state.fetchImpl;
    return createApiClient({
      baseUrl: 'https://catalog.example.test',
      fetchImpl,
    });
  },
}));

vi.mock('react-native', () => {
  function host({
    accessibilityRole,
    accessibilityLabel,
    testID,
  }: {
    accessibilityRole?: string;
    accessibilityLabel?: string;
    testID?: string;
  }) {
    return {
      role: accessibilityRole,
      'aria-label': accessibilityLabel,
      'data-testid': testID,
    };
  }
  function renderChildren(
    children?: ReactNode | ((state: { pressed: boolean; hovered: boolean; focused: boolean }) => ReactNode),
  ) {
    return typeof children === 'function'
      ? children({ pressed: false, hovered: false, focused: false })
      : children;
  }
  return {
    Platform: { OS: 'web', select: (options: { web?: unknown }) => options.web },
    StyleSheet: {
      create: <T,>(styles: T) => styles,
      flatten: (style: unknown) => style,
      hairlineWidth: 1,
      absoluteFill: {},
    },
    AccessibilityInfo: {
      isReduceMotionEnabled: async () => false,
      addEventListener: () => ({ remove() {} }),
    },
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
    View: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      accessibilityRole?: string;
      accessibilityLabel?: string;
      testID?: string;
    }) => createElement('div', host(props), children),
    ScrollView: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      accessibilityRole?: string;
      accessibilityLabel?: string;
      testID?: string;
    }) => createElement('div', host(props), children),
    Text: ({
      children,
      ...props
    }: {
      children?: ReactNode;
      accessibilityRole?: string;
      accessibilityLabel?: string;
      testID?: string;
    }) => createElement('span', host(props), children),
    Pressable: ({
      children,
      onPress,
      ...props
    }: {
      children?: ReactNode | ((state: { pressed: boolean; hovered: boolean; focused: boolean }) => ReactNode);
      onPress?: () => void;
      accessibilityRole?: string;
      accessibilityLabel?: string;
      testID?: string;
    }) =>
      createElement(
        'button',
        { type: 'button', ...host(props), onClick: () => onPress?.() },
        renderChildren(children),
      ),
    Modal: ({ children, visible }: { children?: ReactNode; visible?: boolean }) =>
      visible ? createElement('div', null, children) : null,
    ActivityIndicator: () => null,
  };
});

vi.mock('react-native-svg', () => {
  const shape = ({
    children,
    accessibilityRole,
    accessibilityLabel,
  }: {
    children?: ReactNode;
    accessibilityRole?: string;
    accessibilityLabel?: string;
  }) =>
    createElement(
      'svg',
      { role: accessibilityRole, 'aria-label': accessibilityLabel },
      children,
    );
  return {
    default: shape,
    Svg: shape,
    Circle: shape,
    Ellipse: shape,
    G: shape,
    Line: shape,
    Path: shape,
    Rect: shape,
  };
});

vi.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));

vi.mock('react-native-reanimated', () => {
  function chain() {
    const api = {
      duration() {
        return api;
      },
      easing() {
        return api;
      },
      reduceMotion() {
        return api;
      },
    };
    return api;
  }
  return {
    default: {
      View: ({ children, testID }: { children?: ReactNode; testID?: string }) =>
        createElement('div', { 'data-testid': testID }, children),
    },
    Easing: { bezier: () => 'bezier' },
    FadeIn: chain(),
    FadeOut: chain(),
    LinearTransition: chain(),
    ReduceMotion: { System: 'system' },
    SlideInDown: chain(),
    SlideOutDown: chain(),
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async () => null,
    setItem: async () => undefined,
    removeItem: async () => undefined,
  },
}));

vi.mock('lucide-react-native', () => ({
  X: () => null,
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    canGoBack: () => false,
    back: () => undefined,
    replace: () => undefined,
    push: () => undefined,
    setParams: () => undefined,
  }),
  useNavigation: () => ({ dispatch: () => undefined, addListener: () => () => undefined }),
  useIsFocused: () => true,
  Link: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-router/build/react-navigation/core', () => ({
  usePreventRemove: () => undefined,
}));

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('expo-image', () => ({
  Image: () => null,
}));

vi.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  BlurTargetView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-linking', () => ({
  getInitialURL: async () => null,
  addEventListener: () => ({ remove() {} }),
}));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { version: '1.0.0' } },
}));

vi.mock('../providers/auth-provider', () => ({
  useAuth: () => ({
    user: harness.sessionUser,
    isAuthenticated: true,
    isAdmin: false,
    logout: () => undefined,
  }),
}));

vi.mock('../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  FormPageShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  FormPageColumns: ({ children, sidebar }: { children?: ReactNode; sidebar?: ReactNode }) =>
    createElement('div', null, sidebar, children),
  navigateBack: () => undefined,
}));

vi.mock('../components/ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  AppDialog: () => null,
  MotionPressable: ({
    children,
    onPress,
    accessibilityRole,
    accessibilityLabel,
    testID,
  }: {
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    onPress?: () => void;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    testID?: string;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        role: accessibilityRole,
        'aria-label': accessibilityLabel,
        'data-testid': testID,
        onClick: () => onPress?.(),
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    ),
  FormSection: ({ children, title }: { children?: ReactNode; title?: string }) =>
    createElement('section', null, title, children),
  PageState: ({ title }: { title?: string }) => createElement('div', null, title),
  PrimaryButton: ({ label }: { label: string }) => createElement('button', { type: 'button' }, label),
  SecondaryButton: ({ label }: { label: string }) => createElement('button', { type: 'button' }, label),
  DestructiveButton: ({ label }: { label: string }) => createElement('button', { type: 'button' }, label),
  TextButton: ({ label }: { label: string }) => createElement('button', { type: 'button' }, label),
  TextField: ({ label }: { label: string }) => createElement('input', { 'aria-label': label }),
  ResilientRemoteImage: () => null,
  ImagePlaceholder: () => null,
}));

vi.mock('../components/figma', () => ({
  FigmaButton: ({ label }: { label: string }) => createElement('button', { type: 'button' }, label),
  FilterSortBar: () => createElement('div', { 'data-marker': 'filter-sort' }),
  FilterSortSheet: () => null,
  WorkCoverCardGrid: ({
    items,
  }: {
    items: Array<{ work: { publicId: string; title: string } }>;
  }) =>
    createElement(
      'ul',
      null,
      items.map((item) => createElement('li', { key: item.work.publicId }, item.work.title)),
    ),
}));

vi.mock('../features/discovery/CatalogFilterSheet', () => ({
  CatalogFilterSheet: () => null,
}));

type Started = { url: URL; resolve: (response: Response) => void };

function deferredTransport() {
  const queue: Started[] = [];
  const waiters: Array<(request: Started) => boolean> = [];

  const fetchImpl: typeof fetch = (input) =>
    new Promise<Response>((resolve) => {
      const request = { url: new URL(String(input)), resolve };
      const index = waiters.findIndex((waiter) => waiter(request));
      if (index >= 0) {
        waiters.splice(index, 1);
        return;
      }
      queue.push(request);
    });

  return {
    fetchImpl,
    take(pathname: string) {
      const existing = queue.findIndex((request) => request.url.pathname === pathname);
      if (existing >= 0) return Promise.resolve(queue.splice(existing, 1)[0]);
      return new Promise<Started>((resolve) => {
        waiters.push((request) => {
          if (request.url.pathname !== pathname) return false;
          resolve(request);
          return true;
        });
      });
    },
    finish(bodyFor: (url: URL) => unknown) {
      for (const request of queue.splice(0)) {
        request.resolve(jsonResponse(bodyFor(request.url)));
      }
      waiters.splice(0);
    },
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function authorRecord() {
  return {
    id: sellerId,
    slug: 'maker-1',
    fullName: 'Maker 1',
    country: 'Belarus',
    city: 'Minsk',
    discipline: 'Ceramics',
    practice: null,
    biography: null,
    profilePhotoUrl: '/api/sellers/maker-1/photo',
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: 'Practice 1',
    achievements: [],
    sharePath: '/authors/maker-1',
  };
}

function workRecord() {
  return {
    id: '11111111-0000-4000-8000-000000000001',
    publicId: 'w0000000001',
    title: 'Glass bowl',
    story: null,
    categoryId,
    technique: null,
    materials: 'Glass',
    dimensions: null,
    year: null,
    uniqueness: null,
    images: [
      {
        id: '33333333-0000-4000-8000-000000000001',
        position: 0,
        url: '/api/images/33333333-0000-4000-8000-000000000001',
        mimeType: 'image/png',
        byteLength: 128,
        checksum,
        width: null,
        height: null,
      },
    ],
    publishedAt: '2026-04-01T00:00:00.000Z',
    sharePath: '/works/w0000000001',
  };
}

function bodyFor(url: URL) {
  if (url.pathname === '/api/categories') return categoriesBody;
  if (url.pathname === '/api/portfolio/facets') {
    return { materials: ['Glass'], cities: ['Minsk'], tags: ['ceramic'] };
  }
  if (url.pathname === '/api/works') {
    return {
      works: [{ work: workRecord(), author: authorRecord() }],
      pagination: { page: 1, limit: 12, total: 1 },
    };
  }
  if (url.pathname === '/api/authors/maker-1') {
    return {
      author: authorRecord(),
      works: [{ work: workRecord(), author: authorRecord() }],
      pagination: { page: 1, limit: 20, total: 1 },
    };
  }
  if (url.pathname === `/api/seller/products/${productId}`) {
    return {
      product: {
        id: productId,
        publicId: 'draftwork01',
        sellerProfileId: sellerId,
        categoryId,
        title: 'Saved bowl',
        story: null,
        technique: null,
        materials: null,
        dimensions: null,
        weight: null,
        year: null,
        condition: null,
        uniqueness: null,
        provenance: null,
        city: null,
        packaging: null,
        deliveryInfo: null,
        publishedAt: null,
        status: 'DRAFT',
        images: [],
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-02T00:00:00.000Z',
      },
      editingRevision: {
        id: '55555555-5555-4555-8555-555555555555',
        version: 1,
        status: 'DRAFT',
        updatedAt: '2026-04-02T00:00:00.000Z',
      },
      creationIntro: null,
      creationSteps: [],
      lastModerationReason: null,
    };
  }
  return { status: 404, code: 'not_found', message: 'Missing catalog fixture' };
}

type Mounted = {
  unmount: () => void;
  queryClient: QueryClient;
  transport: ReturnType<typeof deferredTransport>;
  root: HTMLElement;
  releaseSubscriptions: () => void;
};

const mounted: Mounted[] = [];

function mountConsumer(node: ReactNode) {
  const transport = deferredTransport();
  harness.state.fetchImpl = transport.fetchImpl;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false } },
  });
  queryClient.setQueryData(authKeys.session, harness.sessionUser);
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  let unmounted = false;
  let releaseSubscriptions = () => {};
  const view: Mounted = {
    transport,
    queryClient,
    root: container,
    releaseSubscriptions() {
      releaseSubscriptions();
      releaseSubscriptions = () => {};
    },
    unmount() {
      if (unmounted) return;
      unmounted = true;
      act(() => root.unmount());
      container.remove();
    },
  };
  mounted.push(view);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ApiProvider, null, createElement(AnalyticsProvider, null, node)),
      ),
    );
  });
  return view;
}

function nextNotifyTurn() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

type CategoryPublication = 'ready' | 'failed' | 'disposed';

function hasCategoryPayload(data: unknown) {
  if (typeof data !== 'object' || data === null || !('categories' in data)) return false;
  const categories = data.categories;
  if (!Array.isArray(categories)) return false;
  return categories.some(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      item.id === categoryId,
  );
}

function hasObservedCategoryPayload(queryClient: QueryClient) {
  return queryClient.getQueryCache().findAll().some((query) => {
    return (
      (query.getObserversCount() ?? 0) > 0 &&
      query.state.status === 'success' &&
      hasCategoryPayload(query.state.data)
    );
  });
}

function hasObservedCategoryFailure(queryClient: QueryClient) {
  return queryClient.getQueryCache().findAll().some((query) => {
    const [root] = query.queryKey;
    return (
      root === 'categories' &&
      (query.getObserversCount() ?? 0) > 0 &&
      query.state.status === 'error'
    );
  });
}

async function publishMountedConsumer(view: Mounted, paths: string[], readyText: string) {
  const requests = await Promise.all(paths.map((pathname) => view.transport.take(pathname)));
  let unsubscribe = () => {};
  let outcome: CategoryPublication | undefined;
  let settle: (next: CategoryPublication) => void = () => {};
  const finish = (next: CategoryPublication) => {
    if (outcome) return;
    outcome = next;
    unsubscribe();
    unsubscribe = () => {};
    settle(next);
  };
  view.releaseSubscriptions = () => {
    finish('disposed');
  };
  const published = new Promise<CategoryPublication>((resolve) => {
    settle = resolve;
    const read = () => {
      if (outcome) return;
      if (hasObservedCategoryFailure(view.queryClient)) {
        finish('failed');
        return;
      }
      if (hasObservedCategoryPayload(view.queryClient)) finish('ready');
    };
    read();
    unsubscribe = view.queryClient.getQueryCache().subscribe(read);
  });
  try {
    await act(async () => {
      for (const request of requests) {
        request.resolve(jsonResponse(bodyFor(request.url)));
      }
      const publication = await published;
      if (publication === 'ready') await nextNotifyTurn();
    });
  } finally {
    view.releaseSubscriptions();
  }
  if (outcome === 'failed') throw new Error('category publication failed');
  if (outcome !== 'ready') throw new Error('category publication disposed');
  expect(view.root.textContent).toContain(readyText);
}

afterEach(() => {
  const entries = mounted.splice(0);
  for (const entry of entries) {
    entry.releaseSubscriptions();
    entry.unmount();
  }
  act(() => {
    for (const entry of entries) entry.queryClient.clear();
  });
  for (const entry of entries) entry.transport.finish((url) => bodyFor(url));
  harness.state.fetchImpl = () => Promise.reject(new Error('category fetch was not installed'));
  document.body.replaceChildren();
});

describe('category query identity', () => {
  it.each([
    {
      consumer: 'ProductListScreen',
      node: createElement(ProductListScreen, { state: { sort: 'newest' } }),
      paths: ['/api/categories', '/api/portfolio/facets', '/api/works'],
      readyText: 'Glass bowl',
    },
    {
      consumer: 'ProductDraftScreen',
      node: createElement(ProductDraftScreen, { productId }),
      paths: ['/api/categories', `/api/seller/products/${productId}`],
      readyText: 'Редактировать предмет',
    },
    {
      consumer: 'PublicSellerScreen',
      node: createElement(PublicSellerScreen, { slug: 'maker-1' }),
      paths: ['/api/categories', '/api/authors/maker-1'],
      readyText: 'Maker 1',
    },
    {
      consumer: 'CategoriesSearchPane',
      node: createElement(CategoriesSearchPane, { query: '' }),
      paths: ['/api/categories'],
      readyText: 'Glass',
    },
  ])('$consumer keeps an active observer on categoryKeys.all', async ({ node, paths, readyText }) => {
    const view = mountConsumer(node);
    await publishMountedConsumer(view, paths, readyText);

    const query = view.queryClient.getQueryCache().find({
      queryKey: categoryKeys.all,
      exact: true,
    });
    expect(categoryKeys.all).toEqual(['categories']);
    expect(query?.getObserversCount()).toBeGreaterThan(0);
    expect(query?.state.data).toEqual(categoriesBody);
  });
});

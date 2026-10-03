/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@bidplace/api-client';

import { ApiProvider } from '../../providers/api-provider';
import { WORKS_CATALOG_INTRO } from '../../lib/portfolio-copy';
import { ProductListScreen } from './product-list-screen';

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
const checksum = 'ab'.repeat(32);

const harness = vi.hoisted(() => {
  const state: {
    fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  } = {
    fetchImpl: () => Promise.reject(new Error('catalog fetch was not installed')),
  };
  return { state };
});

vi.mock('../../lib/api', () => ({
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
  return {
    Platform: { OS: 'web', select: (options: { web?: unknown }) => options.web },
    StyleSheet: {
      create: <T,>(styles: T) => styles,
      flatten: (style: unknown) => style,
      absoluteFill: {},
      hairlineWidth: 1,
    },
    AccessibilityInfo: {
      isReduceMotionEnabled: async () => false,
      addEventListener: () => ({ remove() {} }),
    },
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
    ActivityIndicator: () => null,
    View: (props: { children?: ReactNode; accessibilityRole?: string; accessibilityLabel?: string; testID?: string }) =>
      createElement('div', host(props), props.children),
    ScrollView: (props: { children?: ReactNode; accessibilityRole?: string; accessibilityLabel?: string; testID?: string }) =>
      createElement('div', host(props), props.children),
    Text: (props: { children?: ReactNode; accessibilityRole?: string; accessibilityLabel?: string; testID?: string }) =>
      createElement('span', host(props), props.children),
    Pressable: ({
      children,
      onPress,
      ...props
    }: {
      children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
      onPress?: () => void;
      accessibilityRole?: string;
      accessibilityLabel?: string;
      testID?: string;
    }) =>
      createElement(
        'button',
        { type: 'button', ...host(props), onClick: () => onPress?.() },
        typeof children === 'function' ? children({ pressed: false }) : children,
      ),
  };
});

vi.mock('react-native-svg', () => {
  const shape = ({
    children,
    accessibilityRole,
  }: {
    children?: ReactNode;
    accessibilityRole?: string;
  }) => createElement('svg', { role: accessibilityRole }, children);
  return { default: shape, Svg: shape, Circle: shape, Ellipse: shape, G: shape, Line: shape, Path: shape, Rect: shape };
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
      View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
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

vi.mock('expo-image', () => ({
  Image: () => null,
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  BlurTargetView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
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
}));

vi.mock('../../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/figma', () => ({
  FigmaButton: ({ label }: { label: string }) => createElement('button', { type: 'button' }, label),
  FilterSortBar: ({
    filterLabel = 'Фильтры',
    sortLabel = 'Сортировка',
  }: {
    filterLabel?: string;
    sortLabel?: string;
  }) => createElement('div', { 'data-marker': 'filter-sort' }, filterLabel, sortLabel),
  FilterSortSheet: () => null,
  WorkCoverCardGrid: ({
    items,
  }: {
    items: Array<{ work: { publicId: string; title: string } }>;
  }) =>
    createElement(
      'ul',
      { 'data-marker': 'work-cards' },
      items.map((item) => createElement('li', { key: item.work.publicId }, item.work.title)),
    ),
}));

vi.mock('../discovery/CatalogFilterSheet', () => ({
  CatalogFilterSheet: () => null,
}));

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function catalogBody(url: URL) {
  if (url.pathname === '/api/categories') {
    return {
      categories: [{ id: categoryId, slug: 'glass', name: 'Glass', description: null }],
    };
  }
  if (url.pathname === '/api/portfolio/facets') {
    return { materials: ['Glass'], cities: ['Minsk'], tags: ['ceramic'] };
  }
  return {
    works: [
      {
        work: {
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
        },
        author: {
          id: '44444444-4444-4444-8444-444444444444',
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
        },
      },
    ],
    pagination: { page: 1, limit: 12, total: 1 },
  };
}

type Mounted = { unmount: () => void; root: HTMLElement; queryClient: QueryClient };

const mounted: Mounted[] = [];

function mountCatalog() {
  harness.state.fetchImpl = (input) => Promise.resolve(jsonResponse(catalogBody(new URL(String(input)))));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false } },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  let unmounted = false;
  const view = {
    root: container,
    queryClient,
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
        createElement(
          ApiProvider,
          null,
          createElement(ProductListScreen, {
            state: { sort: 'newest', category: categoryId },
            title: 'Каталог работ на Bidplace',
          }),
        ),
      ),
    );
  });
  return { container, queryClient, unmount: view.unmount };
}

function nodeWithText(root: ParentNode, text: string) {
  return [...root.querySelectorAll('*')].find(
    (node) => node.childNodes.length === 1 && node.textContent === text,
  );
}

afterEach(() => {
  const entries = mounted.splice(0);
  for (const entry of entries) entry.unmount();
  act(() => {
    for (const entry of entries) entry.queryClient.clear();
  });
  harness.state.fetchImpl = () => Promise.reject(new Error('catalog fetch was not installed'));
  document.body.replaceChildren();
});

describe('Works catalog chrome', () => {
  it('hides the HIDE_FOR_FIRST_MVP catalog-segment tab', async () => {
    const view = mountCatalog();
    await act(async () => {
      await vi.waitFor(() => {
        expect(nodeWithText(view.container, 'Glass bowl')).toBeTruthy();
      });
    });

    expect(view.container.textContent).not.toContain('Все работы');
    expect(view.container.querySelector('[role="tablist"]')).toBeNull();
    expect(view.container.querySelector('[role="tab"]')).toBeNull();
  });

  it('keeps title, intro, Filter/Sort, then cards', async () => {
    const view = mountCatalog();
    await act(async () => {
      await vi.waitFor(() => {
        expect(nodeWithText(view.container, 'Glass bowl')).toBeTruthy();
      });
    });

    const title = nodeWithText(view.container, 'Каталог работ на Bidplace');
    const intro = nodeWithText(view.container, WORKS_CATALOG_INTRO);
    const filterSort = view.container.querySelector('[data-marker="filter-sort"]');
    const card = nodeWithText(view.container, 'Glass bowl');
    expect(title).toBeTruthy();
    expect(intro).toBeTruthy();
    expect(filterSort).toBeTruthy();
    expect(card).toBeTruthy();
    expect(title!.compareDocumentPosition(intro!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(intro!.compareDocumentPosition(filterSort!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(filterSort!.compareDocumentPosition(card!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

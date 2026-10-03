/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@bidplace/api-client';

import { ApiProvider } from '../../providers/api-provider';
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

const router = vi.hoisted(() => ({
  canGoBack: (): boolean => false,
  back: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  setParams: vi.fn(),
}));

const harness = vi.hoisted(() => {
  const pending: Array<(response: Response) => void> = [];
  const state: {
    fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  } = {
    fetchImpl: (input) =>
      new Promise<Response>((resolve) => {
        void input;
        pending.push(resolve);
      }),
  };
  return { state, pending };
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

vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (options: { web?: unknown }) => options.web },
  StyleSheet: {
    create: <T,>(styles: T) => styles,
    flatten: (style: unknown) => style,
    absoluteFill: {},
    hairlineWidth: 1,
  },
  ActivityIndicator: () => null,
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
  AccessibilityInfo: {
    isReduceMotionEnabled: async () => false,
    addEventListener: () => ({ remove() {} }),
  },
  View: ({
    children,
    testID,
    accessibilityRole,
    accessibilityLabel,
  }: {
    children?: ReactNode;
    testID?: string;
    accessibilityRole?: string;
    accessibilityLabel?: string;
  }) =>
    createElement(
      'div',
      { 'data-testid': testID, role: accessibilityRole, 'aria-label': accessibilityLabel },
      children,
    ),
  Text: ({
    children,
    accessibilityRole,
  }: {
    children?: ReactNode;
    accessibilityRole?: string;
  }) => createElement('span', { role: accessibilityRole }, children),
  ScrollView: ({
    children,
    accessibilityRole,
  }: {
    children?: ReactNode;
    accessibilityRole?: string;
  }) => createElement('div', { role: accessibilityRole }, children),
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
  }: {
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityRole?: string;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        'aria-label': accessibilityLabel,
        role: accessibilityRole,
        onClick: () => onPress?.(),
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    ),
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

vi.mock('lucide-react-native', () => ({
  X: () => null,
}));

vi.mock('expo-router', () => ({
  useRouter: () => router,
}));

vi.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('react-native-svg', () => ({
  default: () => null,
  Svg: ({ children }: { children?: ReactNode }) => createElement('svg', null, children),
  Path: () => null,
  Circle: () => null,
  Ellipse: () => null,
}));

vi.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));

vi.mock('../../components/layout', () => ({
  AppShell: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/figma', () => ({
  FigmaButton: () => null,
  FilterSortBar: () => null,
  FilterSortSheet: () => null,
  WorkCoverCardGrid: () => null,
}));

vi.mock('../discovery/CatalogFilterSheet', () => ({
  CatalogFilterSheet: () => null,
}));

const mounted: Array<{ unmount: () => void; queryClient: QueryClient }> = [];

function mountCatalog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false } },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  let unmounted = false;
  const view = {
    container,
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
            state: {
              sort: 'newest',
              category: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
            },
          }),
        ),
      ),
    );
  });
  return view;
}

afterEach(() => {
  const entries = mounted.splice(0);
  for (const entry of entries) entry.unmount();
  act(() => {
    for (const entry of entries) entry.queryClient.clear();
    for (const resolve of harness.pending.splice(0)) {
      resolve(new Response(null, { status: 204 }));
    }
  });
  router.back.mockReset();
  router.replace.mockReset();
  router.push.mockReset();
  router.setParams.mockReset();
  router.canGoBack = () => false;
  document.body.replaceChildren();
});

describe('Works catalog back', () => {
  it('hides Back when the router has no history', () => {
    router.canGoBack = () => false;
    const view = mountCatalog();
    expect(view.container.querySelector('[data-testid="works-back"]')).toBeNull();
    expect(view.container.querySelector('[aria-label="Назад"]')).toBeNull();
  });

  it('calls router.back from the real back control when history exists', () => {
    router.canGoBack = () => true;
    const view = mountCatalog();
    const back = view.container.querySelector<HTMLButtonElement>('[aria-label="Назад"]');
    expect(view.container.querySelector('[data-testid="works-back"]')).toBeTruthy();
    expect(back).toBeTruthy();
    act(() => {
      back!.click();
    });
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

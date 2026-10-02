/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { ApiProvider } from '../../providers/api-provider';
import { AUTHORS_CATALOG_INTRO, WORKS_CATALOG_INTRO } from '../../lib/portfolio-copy';
import { PublicAuthorsScreen } from '../sellers/public-authors-screen';
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

const harness = vi.hoisted(() => {
  const state: {
    fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  } = {
    fetchImpl: () => Promise.reject(new Error('catalog intro fetch was not installed')),
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

vi.mock('../../components/ui/AppText', () => ({
  AppText: ({
    role,
    tone,
    children,
  }: {
    role?: string;
    tone?: string;
    children?: ReactNode;
  }) => createElement('p', { 'data-role': role, 'data-tone': tone ?? '' }, children),
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
  const shape = ({ children, accessibilityRole }: { children?: ReactNode; accessibilityRole?: string }) =>
    createElement('svg', { role: accessibilityRole }, children);
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
  FigmaButton: () => null,
  FilterSortBar: () => createElement('div', { 'data-marker': 'filter-sort' }),
  FilterSortSheet: () => null,
  WorkCoverCardGrid: () => null,
}));

vi.mock('../discovery/CatalogFilterSheet', () => ({
  CatalogFilterSheet: () => null,
}));

type Mounted = {
  container: HTMLElement;
  queryClient: QueryClient;
  releaseTransport: () => void;
  unmount: () => void;
};

const mounted: Mounted[] = [];

function mountScreen(node: ReactNode) {
  const pending: Array<(response: Response) => void> = [];
  harness.state.fetchImpl = () =>
    new Promise<Response>((resolve) => {
      pending.push(resolve);
    });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false } },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  let unmounted = false;
  const view: Mounted = {
    container,
    queryClient,
    releaseTransport() {
      for (const resolve of pending.splice(0)) {
        resolve(new Response(null, { status: 204 }));
      }
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
        createElement(ApiProvider, null, node),
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
  });
  for (const entry of entries) entry.releaseTransport();
  harness.state.fetchImpl = () => Promise.reject(new Error('catalog intro fetch was not installed'));
  document.body.replaceChildren();
});

describe('Catalog intro typography', () => {
  it('reuses bodySmall ink without changing textSecondary', () => {
    expect(designTokens.typography.bodySmall).toMatchObject({
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: -0.14,
      fontWeight: '400',
    });
    expect(designTokens.color.ink).toBe('#2A2A2A');
    expect(designTokens.color.textSecondary).toBe('#8A8A8A');
  });

  it.each([
    {
      catalog: 'Works',
      intro: WORKS_CATALOG_INTRO,
      node: createElement(ProductListScreen, { state: { sort: 'newest' } }),
    },
    {
      catalog: 'Authors',
      intro: AUTHORS_CATALOG_INTRO,
      node: createElement(PublicAuthorsScreen, { state: { sort: 'added' } }),
    },
  ])('$catalog intro uses bodySmall without a secondary tone', ({ intro, node }) => {
    const view = mountScreen(node);
    const rendered = [...view.container.querySelectorAll('p')].find((item) => item.textContent === intro);
    expect(rendered?.getAttribute('data-role')).toBe('bodySmall');
    expect(rendered?.getAttribute('data-tone')).not.toBe('secondary');
  });
});

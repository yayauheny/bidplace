/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const nativeHarness = vi.hoisted(() => {
  const harness = {
    setAccessibilityFocus: vi.fn(),
    hardwareBack: vi.fn((handler: () => boolean | null | undefined) => {
      void handler;
      return { remove() {} };
    }),
    findNodeHandle: (node: unknown) => (node ? 7 : null),
  };
  (globalThis as { __dialogNative?: typeof harness }).__dialogNative = harness;
  return harness;
});

vi.mock(
  '@rn-primitives/dialog',
  () => import('../../../node_modules/@rn-primitives/dialog/dist/dialog.mjs'),
);

vi.mock('@rn-primitives/portal', () => ({
  Portal: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  PortalHost: () => null,
}));

vi.mock('lucide-react-native', () => ({
  X: () => null,
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
      withCallback() { return api; },
    };
    return api;
  }
  return {
    default: { View: ({ children }: { children?: ReactNode }) => createElement('div', null, children) },
    Easing: { bezier: () => 'bezier' },
    FadeIn: chain(),
    FadeOut: chain(),
    LinearTransition: chain(),
    ReduceMotion: { System: 'system' },
    SlideInDown: chain(),
    SlideOutDown: chain(),
  };
});

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  findNodeHandle: (node: unknown) => (node ? 7 : null),
  AccessibilityInfo: {
    setAccessibilityFocus: nativeHarness.setAccessibilityFocus,
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove() {} }),
  },
  BackHandler: {
    addEventListener: (event: string, handler: () => boolean) => {
      if (event === 'hardwareBackPress') nativeHarness.hardwareBack(handler);
      return { remove() {} };
    },
  },
  StyleSheet: {
    create<T>(styles: T) {
      return styles;
    },
    flatten: (style: unknown) => style ?? {},
    absoluteFill: {},
  },
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
  View: forwardRef(function View(
    { children, role }: { children?: ReactNode; role?: string },
    ref,
  ) {
    return createElement('div', { ref, role }, children);
  }),
  Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  ScrollView: forwardRef(function ScrollView(
    { children, role }: { children?: ReactNode; role?: string },
    ref,
  ) {
    return createElement('div', { ref, role }, children);
  }),
  Pressable: forwardRef(function Pressable(
    {
      children,
      onPress,
      accessibilityLabel,
    }: {
      children?: ReactNode;
      onPress?: () => void;
      accessibilityLabel?: string;
    },
    ref,
  ) {
    return createElement(
      'button',
      { ref, type: 'button', 'aria-label': accessibilityLabel, onClick: () => onPress?.() },
      children,
    );
  }),
}));

import { AppDialog } from './AppDialog';

afterEach(() => {
  document.body.replaceChildren();
  nativeHarness.setAccessibilityFocus.mockClear();
  nativeHarness.hardwareBack.mockClear();
});

function mount(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return {
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('AppDialog native focus fallback', () => {
  it('moves accessibility focus through the installed dialog when it opens', async () => {
    const view = mount(
      createElement(AppDialog, {
        open: true,
        title: 'Нативное',
        onClose: () => undefined,
        children: createElement('input', { 'aria-label': 'Поле' }),
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(nativeHarness.setAccessibilityFocus).toHaveBeenCalledWith(7);
    expect(nativeHarness.hardwareBack).toHaveBeenCalled();
    view.unmount();
  });
});

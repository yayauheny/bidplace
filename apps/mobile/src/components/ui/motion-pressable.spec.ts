/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { figmaButtonTokens, designTokens } from '@bidplace/design-tokens';
import { afterEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map((item) => flattenStyle(item)));
  }
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

function resolvePressableStyle(
  style: unknown,
  state: { pressed: boolean; hovered: boolean },
) {
  return flattenStyle(
    typeof style === 'function' ? style(state) : style,
  );
}

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  StyleSheet: {
    create<T>(styles: T) {
      return styles;
    },
    flatten: flattenStyle,
    absoluteFill: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove() {} }),
  },
  ActivityIndicator: () => createElement('span', { role: 'progressbar' }),
  View: forwardRef(function View(
    { children }: { children?: ReactNode },
    ref,
  ) {
    return createElement('div', { ref }, children);
  }),
  Text: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
  Pressable: forwardRef(function Pressable(
    props: {
      style?: unknown;
      disabled?: boolean;
      children?: ReactNode;
    },
    ref,
  ) {
    const idle = resolvePressableStyle(props.style, {
      pressed: false,
      hovered: false,
    });
    const pressed = resolvePressableStyle(props.style, {
      pressed: true,
      hovered: false,
    });
    return createElement('div', {
      ref,
      'data-idle-opacity': String(idle.opacity ?? ''),
      'data-pressed-opacity': String(pressed.opacity ?? ''),
      'data-matrix-opacity': String(idle.opacity ?? ''),
    });
  }),
}));

vi.mock('../../lib/reduced-motion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('react-native-svg', () => ({
  Svg: () => null,
  Defs: () => null,
  LinearGradient: () => null,
  Rect: () => null,
  Stop: () => null,
}));

vi.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));

vi.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('./AppText', () => ({
  AppText: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
}));

vi.mock('../figma/FigmaIcon', () => ({
  FigmaIcon: () => null,
}));

import { MotionPressable } from './MotionPressable';
import { FigmaButton } from '../figma/FigmaButton';

afterEach(() => {
  document.body.replaceChildren();
});

function mount(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('MotionPressable opacityFeedback', () => {
  it('does not append opacity when opacityFeedback is component', () => {
    const view = mount(
      createElement(MotionPressable, {
        opacityFeedback: 'component',
        disabled: true,
        style: { opacity: figmaButtonTokens.disabledOpacity },
      }),
    );
    const shell = view.container.querySelector('div');
    expect(shell?.getAttribute('data-matrix-opacity')).toBe(
      String(figmaButtonTokens.disabledOpacity),
    );
    expect(shell?.getAttribute('data-pressed-opacity')).toBe(
      String(figmaButtonTokens.disabledOpacity),
    );
    view.unmount();
  });

  it('keeps preset pressed and disabled opacity overrides', () => {
    const view = mount(
      createElement(MotionPressable, {
        preset: 'primaryAction',
        opacityFeedback: 'preset',
        style: { backgroundColor: '#121212' },
        children: 'x',
      }),
    );
    const shell = view.container.querySelector('div');
    expect(shell?.getAttribute('data-pressed-opacity')).toBe('0.9');
    view.unmount();

    const disabled = mount(
      createElement(MotionPressable, {
        preset: 'button',
        opacityFeedback: 'preset',
        disabled: true,
      }),
    );
    const disabledShell = disabled.container.querySelector('div');
    expect(disabledShell?.getAttribute('data-idle-opacity')).toBe(
      String(designTokens.opacity.disabled),
    );
    disabled.unmount();
  });
});

describe('FigmaButton disabled shell opacity', () => {
  it('applies matrix disabled opacity once through the real MotionPressable path', () => {
    const view = mount(
      createElement(FigmaButton, {
        label: 'Кнопка',
        variant: 'solid',
        disabled: true,
        onPress: () => undefined,
      }),
    );
    const shell = view.container.querySelector('div');
    expect(shell?.getAttribute('data-matrix-opacity')).toBe(
      String(figmaButtonTokens.disabledOpacity),
    );
    view.unmount();
  });

  it('does not add preset pressed opacity while the control is active', () => {
    const view = mount(
      createElement(FigmaButton, {
        label: 'Кнопка',
        variant: 'solid',
        onPress: () => undefined,
      }),
    );
    const shell = view.container.querySelector('div');
    expect(shell?.getAttribute('data-pressed-opacity')).not.toBe('0.9');
    expect(shell?.getAttribute('data-pressed-opacity')).not.toBe('0.92');
    view.unmount();
  });
});

vi.mock('../figma/FigmaGlassSurface', () => ({ FigmaGlassSurface: () => null }));

vi.mock('react-native-reanimated', () => ({
  default: { View: ({ children }: { children?: ReactNode }) => createElement('div', null, children) },
  useSharedValue: (value: number) => ({ value }),
  useAnimatedStyle: (style: () => object) => style(),
  withTiming: (value: number) => value,
  cancelAnimation: vi.fn(),
}));

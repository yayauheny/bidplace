/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { figmaButtonTokens } from '@bidplace/design-tokens';
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
    { style, children }: { style?: unknown; children?: ReactNode },
    ref,
  ) {
    const flat = flattenStyle(style);
    return createElement(
      'div',
      { ref, 'data-align-self': String(flat.alignSelf ?? '') },
      children,
    );
  }),
  Text: ({ style, children }: { style?: unknown; children?: ReactNode }) => {
    const flat = flattenStyle(style);
    return createElement(
      'span',
      { 'data-font-size': String(flat.fontSize ?? '') },
      children,
    );
  },
  Pressable: forwardRef(function Pressable(
    props: {
      style?: unknown;
      children?: ReactNode | ((state: { pressed: boolean; hovered: boolean }) => ReactNode);
      accessibilityLabel?: string;
      accessibilityHint?: string;
      accessibilityState?: { disabled?: boolean; busy?: boolean };
      accessibilityRole?: string;
      disabled?: boolean;
      onPress?: () => void;
      hitSlop?: { top?: number; left?: number };
      opacityFeedback?: string;
    },
    ref,
  ) {
    const resolve = (state: { pressed: boolean; hovered: boolean }) =>
      flattenStyle(
        typeof props.style === 'function'
          ? (props.style as (state: { pressed: boolean; hovered: boolean }) => unknown)(
              state,
            )
          : props.style,
      );
    const flat = resolve({ pressed: false, hovered: false });
    const inactive = Boolean(props.disabled);
    return createElement(
      'button',
      {
        ref,
        type: 'button',
        'aria-label': props.accessibilityLabel,
        'aria-description': props.accessibilityHint,
        'aria-disabled': props.accessibilityState?.disabled ? 'true' : 'false',
        'aria-busy': props.accessibilityState?.busy ? 'true' : 'false',
        'data-role': props.accessibilityRole ?? 'button',
        disabled: inactive,
        'data-pad-x': String(flat.paddingHorizontal ?? ''),
        'data-pad-y': String(flat.paddingVertical ?? ''),
        'data-radius': String(flat.borderRadius ?? ''),
        'data-bg': String(flat.backgroundColor ?? ''),
        'data-opacity': String(flat.opacity ?? ''),
        'data-align-self': String(flat.alignSelf ?? ''),
        'data-hit-top': props.hitSlop?.top == null ? '' : String(props.hitSlop.top),
        onClick: () => {
          if (!inactive) props.onPress?.();
        },
      },
      typeof props.children === 'function'
        ? props.children({ pressed: false, hovered: false })
        : props.children,
    );
  }),
}));

vi.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
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

import {
  DestructiveButton,
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from './Button';
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

function buttonOf(container: ParentNode) {
  const button = container.querySelector('button');
  if (!button) throw new Error('expected a button');
  return button;
}

function expectMatrixMetrics(button: HTMLButtonElement) {
  expect(button.dataset.padX).toBe(
    String(
      figmaButtonTokens.metrics.paddingX + figmaButtonTokens.metrics.strokeWidth,
    ),
  );
  expect(button.dataset.padY).toBe(
    String(
      figmaButtonTokens.metrics.paddingY + figmaButtonTokens.metrics.strokeWidth,
    ),
  );
  expect(button.dataset.radius).toBe(String(figmaButtonTokens.metrics.radius));
  expect(button.querySelector('span')?.dataset.fontSize).toBe(
    String(figmaButtonTokens.typography.fontSize),
  );
}

describe('shared text button wrappers', () => {
  it('renders primary, secondary, destructive, and ghost through FigmaButton metrics', () => {
    const primary = mount(
      createElement(PrimaryButton, {
        label: 'Одобрить',
        onPress: () => undefined,
      }),
    );
    const secondary = mount(
      createElement(SecondaryButton, {
        label: 'Закрыть',
        onPress: () => undefined,
      }),
    );
    const destructive = mount(
      createElement(DestructiveButton, {
        label: 'Удалить',
        onPress: () => undefined,
      }),
    );
    const ghost = mount(
      createElement(TextButton, {
        label: 'Текст',
        onPress: () => undefined,
      }),
    );

    const primaryButton = buttonOf(primary.container);
    expectMatrixMetrics(primaryButton);
    expect(primaryButton.dataset.bg).toBe(figmaButtonTokens.colors.solidIdle);

    const secondaryButton = buttonOf(secondary.container);
    expectMatrixMetrics(secondaryButton);
    expect(secondaryButton.dataset.bg).toBe(figmaButtonTokens.colors.canvas);

    const destructiveButton = buttonOf(destructive.container);
    expectMatrixMetrics(destructiveButton);
    expect(destructiveButton.dataset.bg).toBe(figmaButtonTokens.colors.solidIdle);

    const ghostButton = buttonOf(ghost.container);
    expectMatrixMetrics(ghostButton);
    expect(ghostButton.dataset.bg).toBe(figmaButtonTokens.colors.canvas);

    primary.unmount();
    secondary.unmount();
    destructive.unmount();
    ghost.unmount();
  });

  it('blocks repeat actions while disabled or loading', () => {
    const onPress = vi.fn();
    const disabled = mount(
      createElement(PrimaryButton, {
        disabled: true,
        label: 'Одобрить',
        width: 'full',
        onPress,
      }),
    );
    const loading = mount(
      createElement(DestructiveButton, {
        loading: true,
        label: 'Отклонить',
        onPress,
      }),
    );

    const disabledButton = buttonOf(disabled.container);
    const loadingButton = buttonOf(loading.container);
    act(() => {
      disabledButton.click();
      loadingButton.click();
    });

    expect(onPress).not.toHaveBeenCalled();
    expect(disabledButton.dataset.opacity).toBe(
      String(figmaButtonTokens.disabledOpacity),
    );
    expect(loadingButton.querySelector('[role="progressbar"]')).not.toBeNull();
    disabled.unmount();
    loading.unmount();
  });

  it('exposes link semantics for href buttons', () => {
    const view = mount(
      createElement(FigmaButton, {
        label: 'Модерация',
        variant: 'outline',
        href: '/admin',
      }),
    );
    expect(buttonOf(view.container).dataset.role).toBe('link');
    view.unmount();
  });
});

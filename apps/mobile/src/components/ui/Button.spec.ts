/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { figmaTokens } from '@bidplace/design-tokens';
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
    },
    ref,
  ) {
    const flat = flattenStyle(
      typeof props.style === 'function'
        ? (props.style as (state: { pressed: boolean; hovered: boolean }) => unknown)({
            pressed: false,
            hovered: false,
          })
        : props.style,
    );
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
        disabled: inactive,
        'data-min-height': String(flat.minHeight ?? ''),
        'data-pad-x': String(flat.paddingHorizontal ?? ''),
        'data-pad-y': String(flat.paddingVertical ?? ''),
        'data-radius': String(flat.borderRadius ?? ''),
        'data-bg': String(flat.backgroundColor ?? ''),
        'data-opacity': String(flat.opacity ?? ''),
        'data-border-width': String(flat.borderWidth ?? ''),
        'data-align-self': String(flat.alignSelf ?? ''),
        'data-hit-top': props.hitSlop?.top == null ? '' : String(props.hitSlop.top),
        'data-hit-left': props.hitSlop?.left == null ? '' : String(props.hitSlop.left),
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

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) =>
    createElement('div', { 'data-gradient': 'true' }, children),
}));

vi.mock('react-native-svg', () => ({
  Svg: () => null,
  Circle: () => null,
  Ellipse: () => null,
  Path: () => null,
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

function expectCompact(button: HTMLButtonElement) {
  expect(button.dataset.minHeight).toBe('');
  expect(button.dataset.padX).toBe(String(figmaTokens.space.quietButtonX));
  expect(button.dataset.padY).toBe(String(figmaTokens.space.quietButtonY));
  expect(button.dataset.radius).toBe(String(figmaTokens.radius.chip));
  expect(button.dataset.borderWidth).toBe('0');
  expect(button.dataset.hitTop).toBe(String(figmaTokens.space.quietButtonY));
  expect(button.dataset.hitLeft).toBe(String(figmaTokens.space.quietButtonX));
  expect(button.querySelector('span')?.dataset.fontSize).toBe(
    String(figmaTokens.typography.buttonCompact.fontSize),
  );
}

function expectRegular(button: HTMLButtonElement) {
  expect(button.dataset.minHeight).toBe(String(figmaTokens.size.button));
  expect(button.dataset.padX).toBe(String(figmaTokens.space.buttonX));
  expect(button.dataset.padY).toBe(String(figmaTokens.space.buttonY));
  expect(button.dataset.radius).toBe(String(figmaTokens.radius.button));
  expect(button.dataset.hitTop).toBe('');
  expect(button.querySelector('span')?.dataset.fontSize).toBe(
    String(figmaTokens.typography.button.fontSize),
  );
}

describe('action button compact size', () => {
  it('selects the existing compact control when compact is true', () => {
    const view = mount(
      createElement(PrimaryButton, {
        compact: true,
        label: 'Одобрить',
        onPress: () => undefined,
      }),
    );

    const button = buttonOf(view.container);
    expectCompact(button);
    expect(button.dataset.bg).toBe(figmaTokens.color.solid);
    expect(button.dataset.alignSelf).toBe('flex-start');
    expect(view.container.querySelector('div')?.dataset.alignSelf).toBe(
      'flex-start',
    );
    expect(button.getAttribute('aria-label')).toBe('Одобрить');
    view.unmount();
  });

  it('keeps the regular control when compact is omitted or false', () => {
    const omitted = mount(
      createElement(SecondaryButton, {
        label: 'Закрыть',
        onPress: () => undefined,
      }),
    );
    const explicitFalse = mount(
      createElement(SecondaryButton, {
        compact: false,
        label: 'Назад',
        onPress: () => undefined,
      }),
    );

    expectRegular(buttonOf(omitted.container));
    expect(buttonOf(omitted.container).dataset.bg).toBe('transparent');
    expectRegular(buttonOf(explicitFalse.container));
    omitted.unmount();
    explicitFalse.unmount();
  });

  it('keeps an explicit regular or large size when compact is not set', () => {
    const regular = mount(
      createElement(PrimaryButton, {
        size: 'regular',
        label: 'Обычная',
        onPress: () => undefined,
      }),
    );
    const large = mount(
      createElement(DestructiveButton, {
        size: 'large',
        label: 'Удалить',
        onPress: () => undefined,
      }),
    );

    expectRegular(buttonOf(regular.container));
    expect(buttonOf(large.container).dataset.minHeight).toBe(
      String(figmaTokens.size.buttonLarge),
    );
    expect(buttonOf(large.container).dataset.bg).toBe(figmaTokens.color.danger);
    expect(buttonOf(large.container).querySelector('span')?.dataset.fontSize).toBe(
      String(figmaTokens.typography.button.fontSize),
    );
    regular.unmount();
    large.unmount();
  });

  it('lets compact win when an explicit size is also passed', () => {
    const view = mount(
      createElement(PrimaryButton, {
        compact: true,
        size: 'large',
        label: 'Одобрить',
        onPress: () => undefined,
      }),
    );

    expectCompact(buttonOf(view.container));
    expect(buttonOf(view.container).dataset.minHeight).not.toBe(
      String(figmaTokens.size.buttonLarge),
    );
    view.unmount();
  });

  it('blocks the action while disabled or loading and keeps the variant', () => {
    const onPress = vi.fn();
    const disabled = mount(
      createElement(PrimaryButton, {
        compact: true,
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
        width: 'block',
        alignSelf: 'center',
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
    expect(disabledButton.getAttribute('aria-disabled')).toBe('true');
    expect(disabledButton.dataset.opacity).toBe(String(figmaTokens.opacity.disabled));
    expect(disabledButton.dataset.bg).toBe(figmaTokens.color.solidDisabled);
    expectCompact(disabledButton);
    expect(disabled.container.querySelector('div')?.dataset.alignSelf).toBe(
      'stretch',
    );
    expect(disabledButton.dataset.alignSelf).toBe('stretch');
    expect(loadingButton.getAttribute('aria-busy')).toBe('true');
    expect(loadingButton.getAttribute('aria-disabled')).toBe('true');
    expect(loadingButton.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(loadingButton.dataset.bg).toBe(figmaTokens.color.danger);
    expect(loading.container.querySelector('div')?.dataset.alignSelf).toBe(
      'center',
    );
    disabled.unmount();
    loading.unmount();
  });

  it('does not apply compact to TextButton', () => {
    const view = mount(
      createElement(TextButton, {
        compact: true,
        label: 'Текст',
        onPress: () => undefined,
      }),
    );

    const button = buttonOf(view.container);
    expectRegular(button);
    expect(button.dataset.bg).toBe(figmaTokens.color.canvas);
    view.unmount();
  });
});

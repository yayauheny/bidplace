/**
 * @vitest-environment jsdom
 */
import {
  act,
  cloneElement,
  createElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  designTokens,
  figmaButtonInteractions,
  figmaButtonMatrixCell,
  figmaButtonTokens,
  figmaButtonVariants,
} from '@bidplace/design-tokens';
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

const SAMPLE_SHELL_WIDTH = 82.71875;
const SAMPLE_SHELL_HEIGHT = 43;

function attachFractionalLayout(
  node: HTMLElement | null,
  onLayout?: (event: {
    nativeEvent: {
      layout: { width: number; height: number };
      target: HTMLElement;
    };
  }) => void,
) {
  if (!node || !onLayout) return;
  node.style.width = `${SAMPLE_SHELL_WIDTH}px`;
  node.style.height = `${SAMPLE_SHELL_HEIGHT}px`;
  onLayout({
    nativeEvent: {
      layout: { width: 83, height: 43 },
      target: node,
    },
  });
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
    {
      style,
      children,
      testID,
      onLayout,
    }: {
      style?: unknown;
      children?: ReactNode;
      testID?: string;
      onLayout?: (event: {
        nativeEvent: {
          layout: { width: number; height: number };
          target: HTMLElement;
        };
      }) => void;
    },
    ref,
  ) {
    const flat = flattenStyle(style);
    return createElement(
      'div',
      {
        ref: (node: HTMLDivElement | null) => {
          if (typeof ref === 'function') ref(node);
          else if (ref && typeof ref === 'object') {
            (ref as { current: HTMLDivElement | null }).current = node;
          }
          attachFractionalLayout(node, onLayout);
        },
        'data-testid': testID,
        'data-align-self': String(flat.alignSelf ?? ''),
        'data-bg': String(flat.backgroundColor ?? ''),
        'data-opacity': String(flat.opacity ?? ''),
        'data-pad-x': String(flat.paddingHorizontal ?? ''),
        'data-pad-y': String(flat.paddingVertical ?? ''),
        'data-radius': String(flat.borderRadius ?? ''),
      },
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
      onLayout?: (event: {
        nativeEvent: {
          layout: { width: number; height: number };
          target: HTMLElement;
        };
      }) => void;
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
        ref: (node: HTMLButtonElement | null) => {
          if (typeof ref === 'function') ref(node);
          else if (ref && typeof ref === 'object') {
            (ref as { current: HTMLButtonElement | null }).current = node;
          }
          attachFractionalLayout(node, props.onLayout);
        },
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
  Link: ({
    asChild,
    children,
  }: {
    asChild?: boolean;
    children: ReactNode;
  }) => {
    if (!asChild || !isValidElement(children)) return children;
    const rawStyle = (children.props as { style?: unknown }).style;
    const style =
      rawStyle && typeof rawStyle === 'object' ? { ...rawStyle } : {};
    return cloneElement(children as ReactElement<{ style?: unknown }>, {
      style,
    });
  },
}));

vi.mock('react-native-svg', () => ({
  Svg: ({
    children,
    width,
    height,
    ...props
  }: {
    children?: ReactNode;
    width?: number;
    height?: number;
  }) =>
    createElement(
      'svg',
      {
        ...props,
        width,
        height,
        xmlns: 'http://www.w3.org/2000/svg',
      },
      children,
    ),
  Defs: ({ children }: { children?: ReactNode }) => createElement('defs', null, children),
  LinearGradient: ({
    children,
    x2,
    y2,
  }: {
    children?: ReactNode;
    x2?: number;
    y2?: number;
  }) => createElement('linearGradient', { x2, y2 }, children),
  Rect: (props: Record<string, unknown>) => createElement('rect', props),
  Stop: ({ stopColor }: { stopColor?: string }) =>
    createElement('stop', { 'stop-color': stopColor }),
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
import { FigmaButton, FigmaButtonStatePreview } from '../figma/FigmaButton';
import { FigmaButtonSurface } from '../figma/FigmaButtonSurface';

afterEach(() => {
  document.body.replaceChildren();
});

async function mount(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
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

function svgRects(container: ParentNode) {
  return [...container.querySelectorAll('rect')].map((rect) => ({
    x: Number(rect.getAttribute('x')),
    y: Number(rect.getAttribute('y')),
    width: Number(rect.getAttribute('width')),
    height: Number(rect.getAttribute('height')),
    rx: Number(rect.getAttribute('rx')),
    fill: rect.getAttribute('fill'),
    stroke: rect.getAttribute('stroke'),
  }));
}

describe('shared text button wrappers', () => {
  it('renders primary, secondary, destructive, and ghost through FigmaButton metrics', async () => {
    const primary = await mount(
      createElement(PrimaryButton, {
        label: 'Одобрить',
        onPress: () => undefined,
      }),
    );
    const secondary = await mount(
      createElement(SecondaryButton, {
        label: 'Закрыть',
        onPress: () => undefined,
      }),
    );
    const destructive = await mount(
      createElement(DestructiveButton, {
        label: 'Удалить',
        onPress: () => undefined,
      }),
    );
    const ghost = await mount(
      createElement(TextButton, {
        label: 'Текст',
        onPress: () => undefined,
      }),
    );

    const primaryButton = buttonOf(primary.container);
    expectMatrixMetrics(primaryButton);
    expect(primaryButton.dataset.bg).toBe('transparent');
    expect(svgRects(primary.container)[0]?.fill).toBe(figmaButtonTokens.colors.solidIdle);

    const secondaryButton = buttonOf(secondary.container);
    expectMatrixMetrics(secondaryButton);
    expect(secondaryButton.dataset.bg).toBe('transparent');
    expect(svgRects(secondary.container)[0]?.fill).toBe(figmaButtonTokens.colors.canvas);

    const destructiveButton = buttonOf(destructive.container);
    expectMatrixMetrics(destructiveButton);
    expect(destructiveButton.dataset.bg).toBe('transparent');

    const ghostButton = buttonOf(ghost.container);
    expectMatrixMetrics(ghostButton);
    expect(ghostButton.dataset.bg).toBe('transparent');

    primary.unmount();
    secondary.unmount();
    destructive.unmount();
    ghost.unmount();
  });

  it('forwards auth and suggestion sizes through the same paint', async () => {
    const auth = await mount(
      createElement(PrimaryButton, {
        label: 'Дальше',
        size: 'auth',
        onPress: () => undefined,
      }),
    );
    const chip = await mount(
      createElement(FigmaButton, {
        label: 'имя',
        variant: 'outline',
        size: 'suggestion',
        onPress: () => undefined,
      }),
    );
    const authButton = buttonOf(auth.container);
    expect(authButton.dataset.padY).toBe(
      String(designTokens.space.x3 + figmaButtonTokens.metrics.strokeWidth),
    );
    expect(authButton.querySelector('span')?.dataset.fontSize).toBe(
      String(figmaButtonTokens.typography.fontSize),
    );
    expect(svgRects(auth.container)[0]?.fill).toBe(figmaButtonTokens.colors.solidIdle);
    const chipButton = buttonOf(chip.container);
    expect(chipButton.dataset.padX).toBe(
      String(designTokens.auth.suggestionX + figmaButtonTokens.metrics.strokeWidth),
    );
    expect(chipButton.dataset.padY).toBe(
      String(designTokens.auth.suggestionY + figmaButtonTokens.metrics.strokeWidth),
    );
    expect(chipButton.querySelector('span')?.dataset.fontSize).toBe(
      String(designTokens.typography.authSuggestion.fontSize),
    );
    expect(svgRects(chip.container)[0]?.fill).toBe(figmaButtonTokens.colors.canvas);
    auth.unmount();
    chip.unmount();
  });

  it('blocks repeat actions while disabled or loading', async () => {
    const onPress = vi.fn();
    const disabled = await mount(
      createElement(PrimaryButton, {
        disabled: true,
        label: 'Одобрить',
        width: 'full',
        onPress,
      }),
    );
    const loading = await mount(
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

  it('renders all 16 static matrix previews with transparent shells and SVG fills', async () => {
    for (const variant of figmaButtonVariants) {
      for (const interaction of figmaButtonInteractions) {
        const cell = figmaButtonMatrixCell(variant, interaction);
        const view = await mount(
          createElement(FigmaButtonStatePreview, {
            variant,
            interaction,
            label: figmaButtonTokens.metrics.sampleLabel,
            accessibilityLabel: `Кнопка ${variant} ${interaction}`,
          }),
        );
        const shell = view.container.querySelector(
          `[data-testid="figma-button-preview-${variant}-${interaction}"]`,
        ) as HTMLDivElement | null;
        if (!shell) throw new Error('expected preview shell');
        expect(shell.dataset.opacity).toBe(String(cell.controlOpacity));
        expect(shell.dataset.bg).toBe('transparent');
        const svg = view.container.querySelector('svg');
        expect(svg?.getAttribute('width')).toBe(String(SAMPLE_SHELL_WIDTH));
        expect(svgRects(view.container)[0]?.fill).toBe(cell.fill);
        view.unmount();
      }
    }
  });

  it('paints pressed ghost as an 82×42 SVG frame without a stroke', async () => {
    const view = await mount(
      createElement(FigmaButtonSurface, {
        variant: 'ghost',
        interaction: 'pressed',
        width: SAMPLE_SHELL_WIDTH,
        height: SAMPLE_SHELL_HEIGHT,
      }),
    );
    const rects = svgRects(view.container);
    expect(rects.find((rect) => rect.stroke)).toBeUndefined();
    const base = rects[0];
    expect(base.width).toBe(82);
    expect(base.height).toBe(42);
    expect(base.x).toBe(0);
    expect(base.y).toBe(0);
    expect(base.rx).toBeCloseTo(21, 1);
    view.unmount();
  });

  it('does not round fractional sample shells to an 83-wide SVG viewport', async () => {
    const view = await mount(
      createElement(FigmaButtonSurface, {
        variant: 'solid',
        interaction: 'idle',
        width: SAMPLE_SHELL_WIDTH,
        height: SAMPLE_SHELL_HEIGHT,
      }),
    );
    const svg = view.container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe(String(SAMPLE_SHELL_WIDTH));
    expect(svg?.getAttribute('width')).not.toBe('83');
    view.unmount();
  });

  it('exposes link semantics for href buttons', async () => {
    const view = await mount(
      createElement(FigmaButton, {
        label: 'Модерация',
        variant: 'outline',
        href: '/admin',
      }),
    );
    const link = buttonOf(view.container);
    expect(link.dataset.role).toBe('link');
    expectMatrixMetrics(link);
    expect(link.dataset.bg).toBe('transparent');
    view.unmount();
  });
});

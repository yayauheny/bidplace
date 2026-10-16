/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  blackColorMap,
  designTokens,
  lightColorMap,
  type SemanticColorMap,
} from '@bidplace/design-tokens';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const navigationThemes: Array<{ colors: Record<string, string> }> = [];

vi.mock('expo-router', () => ({
  DefaultTheme: {
    colors: {
      background: 'default',
      card: 'default',
      primary: 'default',
      border: 'default',
      text: 'default',
      notification: 'default',
    },
  },
  ThemeProvider: ({
    value,
    children,
  }: {
    value: { colors: Record<string, string> };
    children?: ReactNode;
  }) => {
    navigationThemes.push(value);
    return createElement('div', null, children);
  },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  useReducedMotion: () => false,
  StyleSheet: { create: (styles: unknown) => styles },
  Pressable: ({
    children,
    style,
    accessibilityLabel,
    accessibilityRole,
  }: {
    children?:
      | ReactNode
      | ((state: { pressed: boolean; hovered: boolean }) => ReactNode);
    style?:
      | unknown
      | ((state: { pressed: boolean; hovered: boolean }) => unknown);
    accessibilityLabel?: string;
    accessibilityRole?: string;
  }) => {
    const state = { pressed: false, hovered: false };
    const resolved = typeof style === 'function' ? style(state) : style;
    const flat: Record<string, unknown> = {};
    const absorb = (item: unknown) => {
      if (Array.isArray(item)) item.forEach(absorb);
      else if (item && typeof item === 'object')
        Object.assign(flat, item as Record<string, unknown>);
    };
    absorb(resolved);
    const content = typeof children === 'function' ? children(state) : children;
    return createElement(
      'div',
      {
        role: accessibilityRole ?? 'button',
        'aria-label': accessibilityLabel,
        style: flat as React.CSSProperties,
      },
      content,
    );
  },
  Text: ({ children, style }: { children?: ReactNode; style?: unknown }) => {
    const flat: Record<string, unknown> = {};
    for (const item of Array.isArray(style) ? style : [style]) {
      if (item && typeof item === 'object') Object.assign(flat, item);
    }
    return createElement(
      'span',
      { style: flat as React.CSSProperties },
      children,
    );
  },
  View: ({ children, style }: { children?: ReactNode; style?: unknown }) => {
    const flat: Record<string, unknown> = {};
    for (const item of Array.isArray(style) ? style : [style]) {
      if (item && typeof item === 'object') Object.assign(flat, item);
    }
    return createElement(
      'div',
      { style: flat as React.CSSProperties },
      children,
    );
  },
  TextInput: ({ value, style }: { value?: string; style?: unknown }) => {
    const flat: Record<string, unknown> = {};
    for (const item of Array.isArray(style) ? style : [style]) {
      if (item && typeof item === 'object') Object.assign(flat, item);
    }
    return createElement('input', {
      value,
      style: flat as React.CSSProperties,
      readOnly: true,
    });
  },
}));

vi.mock('react-native-svg', () => ({
  Svg: ({ children }: { children?: ReactNode }) =>
    createElement('svg', null, children),
  Circle: () => null,
  Ellipse: () => null,
  Path: () => null,
  Defs: () => null,
  LinearGradient: () => null,
  Rect: () => null,
  Stop: () => null,
}));

vi.mock('@hugeicons/react-native', () => ({
  // DOM evidence for the icon color wiring: Hugeicons internals are out of
  // scope; the assertion is that FigmaIcon passes the active theme color.
  HugeiconsIcon: ({ color }: { color?: string }) =>
    createElement('span', {
      'data-figma-icon': '',
      style: { color } as React.CSSProperties,
    }),
}));

import { AppText } from '../components/ui/AppText';
import { FigmaTextField } from '../components/figma/FigmaTextField';
import { FigmaButton } from '../components/figma/FigmaButton';
import { FigmaIcon } from '../components/figma/FigmaIcon';
import { FigmaChip } from '../components/figma/FigmaChip.web';
import { figmaButtonLabelColor } from '../components/figma/figma-button-style';
import { ThemeProvider, useAppTheme } from './theme-provider';

let captured: SemanticColorMap | null = null;
function Probe() {
  captured = useAppTheme();
  return null;
}

function textColor(container: HTMLElement): string {
  const span = container.querySelector('span');
  return String((span?.style as CSSStyleDeclaration).color);
}

afterEach(() => {
  document.documentElement.removeAttribute('data-bidplace-theme');
  document.documentElement.style.removeProperty('--bidplace-focus');
  navigationThemes.length = 0;
});

describe('app theme owner', () => {
  it('keeps designTokens.color as the single light source', () => {
    expect(designTokens.color).toBe(lightColorMap);
    expect(lightColorMap.canvas).toBe('#FFFFFF');
  });

  it('re-renders theme consumers without remount when the theme switches', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    function Gallery({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: [
          createElement(Probe, { key: 'probe' }),
          createElement(
            AppText,
            { key: 'text', role: 'body', tone: 'danger' },
            'Ошибка',
          ),
        ],
      });
    }
    act(() => root.render(createElement(Gallery, { theme: 'light' })));
    const span = container.querySelector('span')!;
    expect(captured).toBe(lightColorMap);
    expect(textColor(container)).toBe('rgb(255, 0, 0)');
    expect(document.documentElement.dataset.bidplaceTheme).toBe('light');
    expect(
      document.documentElement.style.getPropertyValue('--bidplace-focus'),
    ).toBe(lightColorMap.focus);

    // Same root, no remount: switching the prop must update every consumer.
    act(() => root.render(createElement(Gallery, { theme: 'black' })));
    expect(container.querySelector('span')).toBe(span);
    expect(captured).toBe(blackColorMap);
    expect(textColor(container)).toBe('rgb(255, 77, 77)');
    expect(document.documentElement.dataset.bidplaceTheme).toBe('black');
    expect(
      document.documentElement.style.getPropertyValue('--bidplace-focus'),
    ).toBe(blackColorMap.focus);
    expect(navigationThemes.at(-1)?.colors.background).toBe(
      blackColorMap.canvas,
    );
    expect(navigationThemes.at(-1)?.colors.text).toBe(blackColorMap.ink);

    act(() => root.unmount());
    container.remove();
  });

  it('re-themes a field input without remount when the theme switches', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    function FieldGallery({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: createElement(FigmaTextField, {
          label: 'Email',
          value: 'a@bidplace.ru',
        }),
      });
    }
    act(() => root.render(createElement(FieldGallery, { theme: 'light' })));
    const input = container.querySelector('input')!;
    expect(input.style.color).toBe('rgb(18, 18, 18)');

    act(() => root.render(createElement(FieldGallery, { theme: 'black' })));
    expect(container.querySelector('input')).toBe(input);
    expect(input.style.color).toBe('rgb(245, 245, 245)');

    act(() => root.unmount());
    container.remove();
  });

  it('re-themes mounted button, icon and chip gradient without remounting', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    function Consumers({ theme }: { theme: 'light' | 'black' }) {
      return createElement(ThemeProvider, {
        theme,
        children: [
          createElement(FigmaButton, {
            key: 'button',
            variant: 'solid',
            label: 'Сохранить',
            onPress: () => undefined,
          }),
          createElement(FigmaIcon, { key: 'icon', name: 'search-01' }),
          createElement(FigmaChip, {
            key: 'chip',
            tone: 'onDark',
            label: 'Автор',
          }),
        ],
      });
    }
    act(() => root.render(createElement(Consumers, { theme: 'light' })));

    const paletteOf = (theme: 'light' | 'black') =>
      theme === 'light' ? lightColorMap : blackColorMap;
    // jsdom serializes inline colors as rgb(); palette values are hex.
    const rgbOf = (hex: string) => {
      const value = hex.replace('#', '');
      const channels = [0, 2, 4].map((offset) =>
        parseInt(value.slice(offset, offset + 2), 16),
      );
      return `rgb(${channels.join(', ')})`;
    };
    const button = container.querySelector(
      '[aria-label="Сохранить"]',
    ) as HTMLElement;
    const label = button.querySelector('span') as HTMLElement;
    const icon = container.querySelector('[data-figma-icon]') as HTMLElement;
    const chip = [...container.querySelectorAll('div')].find((node) =>
      (node as HTMLElement).style.backgroundImage.includes('linear-gradient'),
    ) as HTMLElement;
    const chipShell = chip.parentElement as HTMLElement;

    for (const theme of ['light', 'black'] as const) {
      const palette = paletteOf(theme);
      // The solid surface paints via FigmaButtonSurface (SVG); the mounted
      // DOM evidence here is the label/icon colors and the chip gradient.
      expect(label.style.color).toBe(
        rgbOf(figmaButtonLabelColor('solid', 'matrix', palette)),
      );
      expect(icon.style.color).toBe(rgbOf(palette.ink));
      expect(chipShell.style.backgroundColor).toBe(palette.chip);
      expect(chip.style.backgroundImage).toContain(
        palette.chipBorderGradientStart,
      );
      expect(chip.style.backgroundImage).toContain(
        palette.chipBorderGradientEnd,
      );
      if (theme === 'light') {
        act(() => root.render(createElement(Consumers, { theme: 'black' })));
        // Same DOM nodes: switching the theme updates consumers in place.
        expect(container.querySelector('[aria-label="Сохранить"]')).toBe(
          button,
        );
        expect(container.querySelector('[data-figma-icon]')).toBe(icon);
        expect(
          [...container.querySelectorAll('div')].find((node) =>
            (node as HTMLElement).style.backgroundImage.includes(
              'linear-gradient',
            ),
          ),
        ).toBe(chip);
      }
    }

    act(() => root.unmount());
    container.remove();
  });

  it('resolves to light outside a provider', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    act(() => root.render(createElement(Probe)));
    expect(captured).toBe(lightColorMap);
    act(() => root.unmount());
    container.remove();
  });
});

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
}));

import { AppText } from '../components/ui/AppText';
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

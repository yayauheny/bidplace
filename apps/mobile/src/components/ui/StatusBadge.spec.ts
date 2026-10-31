/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  blackColorMap,
  lightColorMap,
  type AppThemeName,
  type SemanticColorRole,
} from '@bidplace/design-tokens';

import { ThemeProvider } from '../../providers/theme-provider';
import { StatusBadge } from './StatusBadge';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map((item) => flattenStyle(item)));
  }
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

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
  ThemeProvider: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  View: ({ children, style }: { children?: ReactNode; style?: unknown }) =>
    createElement(
      'div',
      { 'data-style': JSON.stringify(flattenStyle(style)) },
      children,
    ),
  Text: ({ children, style }: { children?: ReactNode; style?: unknown }) =>
    createElement(
      'span',
      { 'data-style': JSON.stringify(flattenStyle(style)) },
      children,
    ),
}));

const toneRole = {
  neutral: 'ink',
  accent: 'accent',
  success: 'success',
  danger: 'danger',
} as const satisfies Record<string, SemanticColorRole>;

describe('StatusBadge', () => {
  let root: Root | undefined;
  const host = document.createElement('div');
  document.body.appendChild(host);

  afterEach(() => {
    act(() => root?.unmount());
    host.replaceChildren();
  });

  function renderBadge(tone: keyof typeof toneRole, theme: AppThemeName) {
    act(() => {
      root = createRoot(host);
      root.render(
        createElement(ThemeProvider, {
          theme,
          children: createElement(StatusBadge, { tone, label: 'Идёт торг' }),
        }),
      );
    });
  }

  it.each(['light', 'black'] as const)(
    'uses %s theme colors for each tone',
    (theme) => {
      const palette = theme === 'light' ? lightColorMap : blackColorMap;
      for (const tone of Object.keys(toneRole) as Array<
        keyof typeof toneRole
      >) {
        renderBadge(tone, theme);
        expect(host.textContent).toBe('Идёт торг');
        const text = host.querySelector('span');
        const style = JSON.parse(text?.getAttribute('data-style') ?? '{}') as {
          color?: string;
        };
        expect(style.color).toBe(palette[toneRole[tone]]);
      }
    },
  );
});

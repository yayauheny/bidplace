/**
 * @vitest-environment jsdom
 */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  blackColorMap,
  lightColorMap,
  type AppThemeName,
} from '@bidplace/design-tokens';

import { ThemeProvider } from '../../providers/theme-provider';
import { SettingsRow } from './SettingsList';

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
  View: ({
    children,
    style,
    testID,
  }: {
    children?: ReactNode;
    style?: unknown;
    testID?: string;
  }) =>
    createElement(
      'div',
      {
        'data-testid': testID,
        'data-style': JSON.stringify(flattenStyle(style)),
      },
      children,
    ),
  Text: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
  Pressable: forwardRef(function Pressable(
    props: {
      accessibilityRole?: string;
      accessibilityLabel?: string;
      accessibilityState?: { checked?: boolean; disabled?: boolean };
      disabled?: boolean;
      onPress?: () => void;
      children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    },
    ref,
  ) {
    const checked = props.accessibilityState?.checked;
    return createElement(
      'button',
      {
        ref,
        type: 'button',
        role: props.accessibilityRole,
        'aria-label': props.accessibilityLabel,
        'aria-checked': checked === undefined ? undefined : String(checked),
        disabled: Boolean(props.disabled || props.accessibilityState?.disabled),
        onClick: () => props.onPress?.(),
      },
      typeof props.children === 'function'
        ? props.children({ pressed: false })
        : props.children,
    );
  }),
}));

vi.mock('./FigmaIcon', () => ({
  FigmaIcon: () => null,
}));

function styleOf(testId: string) {
  const node = document.querySelector(`[data-testid="${testId}"]`);
  return JSON.parse(node?.getAttribute('data-style') ?? '{}') as Record<
    string,
    unknown
  >;
}

describe('SettingsRow', () => {
  let root: Root;
  const host = document.createElement('div');
  document.body.appendChild(host);

  afterEach(() => {
    act(() => root?.unmount());
    host.replaceChildren();
  });

  function renderRow(
    props: Parameters<typeof SettingsRow>[0],
    theme: AppThemeName = 'light',
  ) {
    act(() => {
      root = createRoot(host);
      root.render(
        createElement(ThemeProvider, {
          theme,
          children: createElement(SettingsRow, props),
        }),
      );
    });
  }

  it('keeps a plain row as a button', () => {
    const onPress = vi.fn();
    renderRow({ icon: 'user', label: 'Публичный профиль', onPress });

    const button = document.querySelector('button');
    expect(button?.getAttribute('role')).toBe('button');
    expect(button?.getAttribute('aria-label')).toBe('Публичный профиль');
    expect(
      document.querySelector('[data-testid="settings-switch-track"]'),
    ).toBeNull();

    act(() => button?.click());
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('toggles a switch named by the row label', () => {
    const onChange = vi.fn();
    renderRow({
      icon: 'user',
      label: 'Уведомления',
      toggle: { value: false, onChange },
    });

    const button = document.querySelector('button');
    expect(button?.getAttribute('role')).toBe('switch');
    expect(button?.getAttribute('aria-label')).toBe('Уведомления');
    expect(button?.getAttribute('aria-checked')).toBe('false');

    act(() => button?.click());
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not change a disabled switch', () => {
    const onChange = vi.fn();
    renderRow({
      icon: 'user',
      label: 'Уведомления',
      toggle: { value: true, onChange, disabled: true },
    });

    const button = document.querySelector('button');
    expect(button?.getAttribute('aria-checked')).toBe('true');
    expect(button?.hasAttribute('disabled')).toBe(true);
    act(() => button?.click());
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each(['light', 'black'] as const)(
    'paints the switch from the %s theme',
    (theme) => {
      const palette = theme === 'light' ? lightColorMap : blackColorMap;
      renderRow(
        {
          icon: 'user',
          label: 'Уведомления',
          toggle: { value: true, onChange: () => undefined },
        },
        theme,
      );

      expect(styleOf('settings-switch-track')).toMatchObject({
        width: 36,
        height: 20,
        backgroundColor: palette.inkStrong,
        justifyContent: 'flex-end',
      });
      expect(styleOf('settings-switch-thumb')).toMatchObject({
        width: 16,
        height: 16,
        backgroundColor: palette.canvas,
      });

      renderRow(
        {
          icon: 'user',
          label: 'Уведомления',
          toggle: { value: false, onChange: () => undefined },
        },
        theme,
      );
      expect(styleOf('settings-switch-track').backgroundColor).toBe(
        palette.surfaceStrong,
      );
      expect(styleOf('settings-switch-track').justifyContent).toBe(
        'flex-start',
      );
    },
  );
});

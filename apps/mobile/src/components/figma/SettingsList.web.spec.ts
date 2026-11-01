/**
 * @vitest-environment jsdom
 *
 * Real React Native Web. The sibling SettingsList.spec mocks Pressable as a
 * button and invents aria-checked, so it cannot see the web defects.
 */
import { act, createElement, useState, type ReactNode } from 'react';
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

vi.mock('react-native', () =>
  vi.importActual<typeof import('react-native')>('react-native-web'),
);

vi.mock('./FigmaIcon', () => ({
  FigmaIcon: () => null,
}));

function key(
  target: Element,
  type: 'keydown' | 'keyup',
  keyName: string,
  repeat = false,
) {
  const event = new KeyboardEvent(type, {
    key: keyName,
    bubbles: true,
    cancelable: true,
    repeat,
  });
  target.dispatchEvent(event);
  return event;
}

describe('SettingsRow web', () => {
  let root: Root | undefined;
  const host = document.createElement('div');
  document.body.appendChild(host);

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    host.replaceChildren();
  });

  function renderRow(
    props: Parameters<typeof SettingsRow>[0],
    theme: AppThemeName = 'light',
  ) {
    act(() => {
      root ??= createRoot(host);
      root.render(
        createElement(ThemeProvider, {
          theme,
          children: createElement(SettingsRow, props),
        }),
      );
    });
  }

  function cssColor(value: string) {
    const probe = document.createElement('div');
    probe.style.color = value;
    return probe.style.color;
  }

  function row(role: 'switch' | 'button') {
    const node = host.querySelector(`[role="${role}"]`);
    if (!(node instanceof HTMLElement)) throw new Error(`missing ${role}`);
    return node;
  }

  it('keeps a plain row as a button without aria-checked', () => {
    const onPress = vi.fn();
    renderRow({
      icon: 'user',
      label: 'Публичный профиль',
      trailingArrow: true,
      onPress,
    });

    const button = row('button');
    expect(button.getAttribute('aria-label')).toBe('Публичный профиль');
    expect(button.hasAttribute('aria-checked')).toBe(false);
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('blocks a busy plain row', () => {
    const onPress = vi.fn();
    renderRow({
      icon: 'user',
      label: 'Выйти',
      onPress,
      busy: true,
    });
    const button = row('button');
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      key(button, 'keydown', 'Enter');
      key(button, 'keyup', 'Enter');
      key(button, 'keydown', ' ');
    });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes aria-checked from the parent value', () => {
    const onChange = vi.fn();
    renderRow({
      icon: 'user',
      label: 'Уведомления',
      toggle: { value: false, onChange },
    });
    const control = row('switch');
    expect(control.getAttribute('aria-label')).toBe('Уведомления');
    expect(control.getAttribute('aria-checked')).toBe('false');

    renderRow({
      icon: 'user',
      label: 'Уведомления',
      toggle: { value: true, onChange },
    });
    expect(row('switch').getAttribute('aria-checked')).toBe('true');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles once from click, Space, and Enter without scrolling', () => {
    const calls: boolean[] = [];
    let value = false;
    function paint() {
      renderRow({
        icon: 'user',
        label: 'Уведомления',
        toggle: {
          value,
          onChange: (next) => {
            calls.push(next);
            value = next;
          },
        },
      });
    }
    paint();
    document.documentElement.scrollTop = 40;

    act(() => {
      row('switch').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(calls).toEqual([true]);
    paint();

    const space = key(row('switch'), 'keydown', ' ');
    act(() => undefined);
    expect(space.defaultPrevented).toBe(true);
    expect(document.documentElement.scrollTop).toBe(40);
    expect(calls).toEqual([true, false]);

    paint();
    act(() => {
      const control = row('switch');
      key(control, 'keydown', 'Enter');
      key(control, 'keyup', 'Enter');
    });
    expect(calls).toEqual([true, false, true]);
  });

  it('toggles once when Space repeats, then again after release', () => {
    const calls: boolean[] = [];
    let value = false;
    function paint() {
      renderRow({
        icon: 'user',
        label: 'Уведомления',
        toggle: {
          value,
          onChange: (next) => {
            calls.push(next);
            value = next;
          },
        },
      });
    }
    paint();

    const first = key(row('switch'), 'keydown', ' ', false);
    act(() => undefined);
    expect(first.defaultPrevented).toBe(true);
    expect(calls).toEqual([true]);
    paint();

    const repeats = [0, 1, 2].map(() =>
      key(row('switch'), 'keydown', ' ', true),
    );
    act(() => undefined);
    expect(repeats.every((event) => event.defaultPrevented)).toBe(true);
    expect(calls).toEqual([true]);

    key(row('switch'), 'keyup', ' ');
    const next = key(row('switch'), 'keydown', ' ', false);
    act(() => undefined);
    expect(next.defaultPrevented).toBe(true);
    expect(calls).toEqual([true, false]);
    paint();

    act(() => {
      row('switch').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(calls).toEqual([true, false, true]);
    paint();

    act(() => {
      const control = row('switch');
      key(control, 'keydown', 'Enter');
      key(control, 'keyup', 'Enter');
    });
    expect(calls).toEqual([true, false, true, false]);
  });

  it('blocks mouse and keyboard while disabled or busy, then allows them again', () => {
    const onChange = vi.fn();
    renderRow({
      icon: 'user',
      label: 'Уведомления',
      toggle: { value: true, onChange, disabled: true },
    });
    let control = row('switch');
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => {
      control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      key(control, 'keydown', ' ');
      key(control, 'keydown', 'Enter');
      key(control, 'keyup', 'Enter');
    });
    expect(onChange).not.toHaveBeenCalled();

    renderRow({
      icon: 'user',
      label: 'Уведомления',
      busy: true,
      toggle: { value: false, onChange },
    });
    control = row('switch');
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => {
      control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      key(control, 'keydown', ' ');
      key(control, 'keydown', 'Enter');
      key(control, 'keyup', 'Enter');
    });
    expect(onChange).not.toHaveBeenCalled();

    renderRow({
      icon: 'user',
      label: 'Уведомления',
      toggle: { value: false, onChange },
    });
    control = row('switch');
    expect(control.getAttribute('aria-disabled')).not.toBe('true');
    control.focus();
    expect(document.activeElement).toBe(control);
    act(() => {
      control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it.each(['light', 'black'] as const)(
    'keeps the 36 by 20 track in the %s theme',
    (theme) => {
      const palette = theme === 'light' ? lightColorMap : blackColorMap;
      renderRow(
        {
          icon: 'user',
          label:
            'Очень длинное название настройки, которое не должно сжимать переключатель',
          toggle: { value: true, onChange: () => undefined },
        },
        theme,
      );
      const track = host.querySelector('[data-testid="settings-switch-track"]');
      const thumb = host.querySelector('[data-testid="settings-switch-thumb"]');
      expect(track).not.toBeNull();
      expect(thumb).not.toBeNull();
      const trackStyle = (track as HTMLElement).style;
      const thumbStyle = (thumb as HTMLElement).style;
      expect(trackStyle.width).toBe('36px');
      expect(trackStyle.height).toBe('20px');
      expect(trackStyle.backgroundColor).toBe(cssColor(palette.inkStrong));
      expect(thumbStyle.width).toBe('16px');
      expect(thumbStyle.height).toBe('16px');
      expect(thumbStyle.backgroundColor).toBe(cssColor(palette.canvas));
    },
  );

  it('follows a parent value through a controlled render', () => {
    function Probe() {
      const [value, setValue] = useState(false);
      return createElement(SettingsRow, {
        icon: 'user',
        label: 'Уведомления',
        toggle: { value, onChange: setValue },
      });
    }
    act(() => {
      root = createRoot(host);
      root.render(
        createElement(ThemeProvider, { children: createElement(Probe) }),
      );
    });
    expect(row('switch').getAttribute('aria-checked')).toBe('false');
    act(() => {
      row('switch').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(row('switch').getAttribute('aria-checked')).toBe('true');
  });
});

/**
 * @vitest-environment jsdom
 */
import {
  act,
  createElement,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { figmaTabLabelColor } from './figma-tabs';
import { FigmaTabs } from './FigmaTabs';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const platform = vi.hoisted(() => ({ OS: 'web' }));

vi.mock('expo-router', () => ({
  DefaultTheme: { colors: {} },
  ThemeProvider: ({ children }: { children?: ReactNode }) => children,
}));

// RN-примитивы прокидываем в DOM только с теми стилями, что проверяет спека.
function domStyle(style?: Record<string, unknown> | null) {
  const out: Record<string, string> = {};
  const spec = (Array.isArray(style) ? style[0] : style) as
    | Record<string, string | number>
    | undefined;
  if (!spec) return out;
  if (spec.paddingHorizontal !== undefined) {
    out.paddingLeft = `${spec.paddingHorizontal}px`;
    out.paddingRight = `${spec.paddingHorizontal}px`;
  }
  if (spec.borderBottomWidth !== undefined) {
    out.borderBottom = `${spec.borderBottomWidth}px solid ${spec.borderBottomColor}`;
  }
  if (spec.backgroundColor !== undefined) {
    out.backgroundColor = spec.backgroundColor as string;
  }
  return out;
}

vi.mock('react-native', () => ({
  Platform: platform,
  View: ({
    children,
    style,
  }: {
    children?: ReactNode;
    style?: Record<string, unknown>;
  }) => createElement('div', { style: domStyle(style) }, children),
  ScrollView: ({
    children,
    accessibilityRole,
    contentContainerStyle,
  }: {
    children?: ReactNode;
    accessibilityRole?: string;
    accessibilityState?: { selected: boolean };
    contentContainerStyle?: Record<string, unknown>;
  }) =>
    createElement(
      'div',
      { role: accessibilityRole },
      createElement(
        'div',
        { style: domStyle(contentContainerStyle) },
        children,
      ),
    ),
}));

vi.mock('../ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
  MotionPressable: ({
    children,
    nativeID,
    onPress,
    accessibilityRole,
    accessibilityState,
    'aria-controls': controls,
    'aria-selected': selected,
    'aria-pressed': pressed,
    tabIndex,
    onKeyDown,
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    nativeID?: string;
    onPress?: () => void;
    accessibilityRole?: string;
    accessibilityState?: { selected: boolean };
  }) =>
    createElement(
      'button',
      {
        id: nativeID,
        onClick: onPress,
        role: accessibilityRole,
        'data-native-selected': accessibilityState?.selected,
        'aria-controls': controls,
        'aria-selected': selected,
        'aria-pressed': pressed,
        tabIndex,
        onKeyDown,
      },
      children,
    ),
}));

const mounted: Array<{ unmount: () => void }> = [];

function mountTabs(contentInset?: number, selection = false) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  let unmounted = false;
  const view = {
    container,
    unmount() {
      if (unmounted) return;
      unmounted = true;
      act(() => root.unmount());
      container.remove();
    },
  };
  mounted.push(view);
  act(() => {
    root.render(
      createElement(FigmaTabs, {
        tabs: [
          { value: 'story', label: 'История' },
          { value: 'details', label: 'Детали' },
        ],
        value: 'story',
        onChange: () => undefined,
        label: 'Информация о работе',
        panelId: 'work-panel',
        fill: true,
        selection,
        ...(contentInset === undefined ? {} : { contentInset }),
      }),
    );
  });
  return view;
}

afterEach(() => {
  platform.OS = 'web';
  for (const entry of mounted.splice(0)) entry.unmount();
  document.body.replaceChildren();
});

describe('Figma tabs', () => {
  it.each(['ios', 'android'])('exposes native selected state on %s', (os) => {
    platform.OS = os;
    const view = mountTabs(undefined, true);
    const buttons = view.container.querySelectorAll('[role="button"]');
    expect(buttons[0].getAttribute('data-native-selected')).toBe('true');
    expect(buttons[1].getAttribute('data-native-selected')).toBe('false');
    expect(view.container.querySelector('[aria-pressed]')).toBeNull();
  });

  it('uses pressed selection buttons without references to nonexistent panels', () => {
    const view = mountTabs(undefined, true);
    expect(view.container.querySelector('[role="toolbar"]')).toBeTruthy();
    const buttons = view.container.querySelectorAll('[role="button"]');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(view.container.querySelector('[aria-controls]')).toBeNull();
    expect(view.container.querySelector('[aria-selected]')).toBeNull();
  });

  it('preserves the default tab-panel association and keyboard selection', () => {
    const view = mountTabs();
    const first =
      view.container.querySelector<HTMLButtonElement>('#work-panel-story')!;
    expect(first.getAttribute('role')).toBe('tab');
    expect(first.getAttribute('aria-controls')).toBe('work-panel');
    expect(first.getAttribute('aria-selected')).toBe('true');
    act(() =>
      first.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      ),
    );
    expect(document.activeElement?.id).toBe('work-panel-details');
  });

  it('uses the author-page inactive ink from 621:19524', () => {
    expect(figmaTabLabelColor(true, designTokens.color)).toBe(
      designTokens.color.ink,
    );
    expect(figmaTabLabelColor(false, designTokens.color)).toBe('#565656');
  });

  it('insets the label rail by 24px and keeps the divider on the fill wrapper', () => {
    const view = mountTabs(24);
    const tablist =
      view.container.querySelector<HTMLElement>('[role="tablist"]');
    const rail = tablist?.firstElementChild as HTMLElement | null;
    const wrapper = tablist?.parentElement as HTMLElement | null;
    expect(tablist).toBeTruthy();
    expect(rail).toBeTruthy();
    expect(rail!.style.paddingLeft).toBe('24px');
    expect(rail!.style.paddingRight).toBe('24px');
    expect(tablist!.style.paddingLeft).not.toBe('24px');
    expect(tablist!.style.paddingRight).not.toBe('24px');
    const expectedDivider = document.createElement('div');
    expectedDivider.style.borderBottom = `1px solid ${designTokens.color.divider}`;
    expect(wrapper!.style.borderBottom).toBe(
      expectedDivider.style.borderBottom,
    );
    expect(tablist!.style.borderBottom).toBe('');
    expect(rail!.style.borderBottom).toBe('');
  });

  it('uses a zero label-rail inset when contentInset is omitted', () => {
    const view = mountTabs();
    const tablist =
      view.container.querySelector<HTMLElement>('[role="tablist"]');
    const rail = tablist?.firstElementChild as HTMLElement | null;
    expect(rail!.style.paddingLeft).toBe('0px');
    expect(rail!.style.paddingRight).toBe('0px');
    expect(tablist!.style.paddingLeft).not.toBe('24px');
    expect(tablist!.style.paddingRight).not.toBe('24px');
  });
});

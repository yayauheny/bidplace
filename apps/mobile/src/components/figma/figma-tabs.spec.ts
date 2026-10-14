/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { figmaTabLabelColor } from './figma-tabs';
import { FigmaTabs } from './FigmaTabs';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

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
  Platform: { OS: 'web' },
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
    contentContainerStyle?: Record<string, unknown>;
  }) =>
    createElement(
      'div',
      { role: accessibilityRole },
      createElement('div', { style: domStyle(contentContainerStyle) }, children),
    ),
}));

vi.mock('../ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) =>
    createElement('span', null, children),
  MotionPressable: ({
    children,
    nativeID,
    onPress,
  }: {
    children?: ReactNode;
    nativeID?: string;
    onPress?: () => void;
  }) => createElement('button', { id: nativeID, onClick: onPress }, children),
}));

const mounted: Array<{ unmount: () => void }> = [];

function mountTabs(contentInset?: number) {
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
        ...(contentInset === undefined ? {} : { contentInset }),
      }),
    );
  });
  return view;
}

afterEach(() => {
  for (const entry of mounted.splice(0)) entry.unmount();
  document.body.replaceChildren();
});

describe('Figma tabs', () => {
  it('uses the author-page inactive ink from 621:19524', () => {
    expect(figmaTabLabelColor(true)).toBe(designTokens.color.ink);
    expect(figmaTabLabelColor(false)).toBe('#565656');
  });

  it('insets the label rail by 24px and keeps the divider on the fill wrapper', () => {
    const view = mountTabs(24);
    const tablist = view.container.querySelector<HTMLElement>('[role="tablist"]');
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
    expect(wrapper!.style.borderBottom).toBe(expectedDivider.style.borderBottom);
    expect(tablist!.style.borderBottom).toBe('');
    expect(rail!.style.borderBottom).toBe('');
  });

  it('uses a zero label-rail inset when contentInset is omitted', () => {
    const view = mountTabs();
    const tablist = view.container.querySelector<HTMLElement>('[role="tablist"]');
    const rail = tablist?.firstElementChild as HTMLElement | null;
    expect(rail!.style.paddingLeft).toBe('0px');
    expect(rail!.style.paddingRight).toBe('0px');
    expect(tablist!.style.paddingLeft).not.toBe('24px');
    expect(tablist!.style.paddingRight).not.toBe('24px');
  });
});

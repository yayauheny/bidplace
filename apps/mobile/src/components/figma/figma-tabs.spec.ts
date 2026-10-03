/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { designTokens, figmaTokens } from '@bidplace/design-tokens';

import { figmaTabLabelColor } from './figma-tabs';
import { FigmaTabs } from './FigmaTabs.web';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

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
    expect(figmaTabLabelColor(true)).toBe(figmaTokens.color.ink);
    expect(figmaTabLabelColor(false)).toBe('#565656');
  });

  it('insets the label rail by 24px and keeps the divider on the tablist', () => {
    const view = mountTabs(24);
    const tablist = view.container.querySelector<HTMLElement>('[role="tablist"]');
    const rail = tablist?.firstElementChild as HTMLElement | null;
    expect(tablist).toBeTruthy();
    expect(rail).toBeTruthy();
    expect(rail!.style.paddingLeft).toBe('24px');
    expect(rail!.style.paddingRight).toBe('24px');
    expect(tablist!.style.paddingLeft).not.toBe('24px');
    expect(tablist!.style.paddingRight).not.toBe('24px');
    const expectedDivider = document.createElement('div');
    expectedDivider.style.borderBottom = `1px solid ${designTokens.color.divider}`;
    expect(tablist!.style.borderBottom).toBe(expectedDivider.style.borderBottom);
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
    const expectedDivider = document.createElement('div');
    expectedDivider.style.borderBottom = `1px solid ${designTokens.color.divider}`;
    expect(tablist!.style.borderBottom).toBe(expectedDivider.style.borderBottom);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { cycleOverlayTabFocus, isDisplayedFocusable } from './overlay-focus';

describe('overlay focus helpers', () => {
  it('keeps only visible tabbable nodes', () => {
    expect(
      isDisplayedFocusable({
        tabIndex: 0,
        offsetParent: {},
        focus: vi.fn(),
      }),
    ).toBe(true);
    expect(
      isDisplayedFocusable({
        tabIndex: -1,
        offsetParent: {},
        focus: vi.fn(),
      }),
    ).toBe(false);
    expect(
      isDisplayedFocusable({
        tabIndex: 0,
        offsetParent: null,
        focus: vi.fn(),
      }),
    ).toBe(false);
  });

  it('wraps Tab from the last node to the first and Shift+Tab from the first to the last', () => {
    const first = { tabIndex: 0, offsetParent: {}, focus: vi.fn() };
    const last = { tabIndex: 0, offsetParent: {}, focus: vi.fn() };

    expect(
      cycleOverlayTabFocus({
        shiftKey: false,
        active: last,
        nodes: [first, last],
      }),
    ).toBe(first);
    expect(
      cycleOverlayTabFocus({
        shiftKey: true,
        active: first,
        nodes: [first, last],
      }),
    ).toBe(last);
    expect(
      cycleOverlayTabFocus({
        shiftKey: false,
        active: first,
        nodes: [first, last],
      }),
    ).toBeNull();
  });
});

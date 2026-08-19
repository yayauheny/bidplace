import { describe, expect, it, vi } from 'vitest';

import {
  ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS,
  shouldDismissAccountMenuOnHoverLeave,
  subscribeAccountMenuSurfaceHover,
} from './account-menu-hover';

describe('shouldDismissAccountMenuOnHoverLeave', () => {
  it('does not dismiss while trigger is hovered', () => {
    expect(shouldDismissAccountMenuOnHoverLeave(true, false)).toBe(false);
  });

  it('does not dismiss while dropdown is hovered', () => {
    expect(shouldDismissAccountMenuOnHoverLeave(false, true)).toBe(false);
  });

  it('dismisses only when neither trigger nor dropdown is hovered', () => {
    expect(shouldDismissAccountMenuOnHoverLeave(false, false)).toBe(true);
    expect(shouldDismissAccountMenuOnHoverLeave(true, true)).toBe(false);
  });
});

describe('ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS', () => {
  it('uses a short grace period for portal gap traversal', () => {
    expect(ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS).toBeGreaterThanOrEqual(100);
    expect(ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS).toBeLessThanOrEqual(200);
  });
});

describe('subscribeAccountMenuSurfaceHover', () => {
  it('uses pointerenter/leave so nested item hover is not a surface leave', () => {
    const target = new EventTarget();
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const unsubscribe = subscribeAccountMenuSurfaceHover(target, {
      onEnter,
      onLeave,
    });

    target.dispatchEvent(new Event('pointerenter'));
    expect(onEnter).toHaveBeenCalledTimes(1);
    target.dispatchEvent(new Event('mouseover'));
    target.dispatchEvent(new Event('pointerover'));
    expect(onEnter).toHaveBeenCalledTimes(1);
    target.dispatchEvent(new Event('pointerleave'));
    expect(onLeave).toHaveBeenCalledTimes(1);

    unsubscribe();
    target.dispatchEvent(new Event('pointerenter'));
    target.dispatchEvent(new Event('pointerleave'));
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS,
  shouldDismissAccountMenuOnHoverLeave,
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

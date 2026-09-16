import { describe, expect, it } from 'vitest';

import {
  progressForHeaderState,
  stickyHeaderStateFromScroll,
} from './sticky-header-motion';

describe('sticky header motion helpers', () => {
  it('flips state with collapse/expand hysteresis', () => {
    const thresholds = { collapseAt: 400, expandAt: 380 };
    expect(stickyHeaderStateFromScroll(0, 'expanded', thresholds)).toBe(
      'expanded',
    );
    expect(stickyHeaderStateFromScroll(399, 'expanded', thresholds)).toBe(
      'expanded',
    );
    expect(stickyHeaderStateFromScroll(400, 'expanded', thresholds)).toBe(
      'compact',
    );
    expect(stickyHeaderStateFromScroll(390, 'compact', thresholds)).toBe(
      'compact',
    );
    expect(stickyHeaderStateFromScroll(380, 'compact', thresholds)).toBe(
      'expanded',
    );
    expect(progressForHeaderState('expanded')).toBe(0);
    expect(progressForHeaderState('compact')).toBe(1);
  });
});

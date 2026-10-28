import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  STICKY_HANDOFF_HYSTERESIS,
  stickyHandoffThresholds,
  stickyHeaderStateFromScroll,
} from './sticky-handoff';

describe('sticky header handoff', () => {
  it('parks compact at measured hero height minus the action stack', () => {
    const compactStack = designTokens.stickyDock.actionHeight;
    expect(STICKY_HANDOFF_HYSTERESIS).toBe(20);
    const thresholds = stickyHandoffThresholds(460);
    expect(thresholds.compactStack).toBe(compactStack);
    expect(thresholds.collapseAt).toBe(460 - compactStack);
    expect(thresholds.expandAt).toBe(
      460 - compactStack - STICKY_HANDOFF_HYSTERESIS,
    );
    expect(stickyHeaderStateFromScroll(0, 'expanded', thresholds)).toBe(
      'expanded',
    );
    expect(
      stickyHeaderStateFromScroll(
        thresholds.collapseAt - 1,
        'expanded',
        thresholds,
      ),
    ).toBe('expanded');
    expect(
      stickyHeaderStateFromScroll(thresholds.collapseAt, 'expanded', thresholds),
    ).toBe('compact');
    expect(
      stickyHeaderStateFromScroll(thresholds.expandAt + 1, 'compact', thresholds),
    ).toBe('compact');
    expect(
      stickyHeaderStateFromScroll(thresholds.expandAt, 'compact', thresholds),
    ).toBe('expanded');
    expect(stickyHandoffThresholds(0).collapseAt).toBe(0);
    expect(
      stickyHeaderStateFromScroll(
        120,
        'compact',
        stickyHandoffThresholds(compactStack),
      ),
    ).toBe('expanded');
  });
});

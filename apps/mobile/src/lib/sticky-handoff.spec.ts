import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  STICKY_HANDOFF_HYSTERESIS,
  WEB_COMPACT_STACK,
  stickyHandoffThresholds,
  stickyHeaderStateFromScroll,
  workHandoffThresholds,
} from './sticky-handoff';

describe('sticky header handoff', () => {
  it('parks compact at measured hero height minus the 80px chrome stack', () => {
    expect(STICKY_HANDOFF_HYSTERESIS).toBe(20);
    expect(WEB_COMPACT_STACK).toBe(
      designTokens.space.x3 +
        designTokens.size.header +
        designTokens.space.x5,
    );
    expect(WEB_COMPACT_STACK).toBe(80);
    const thresholds = stickyHandoffThresholds(460);
    expect(thresholds.compactStack).toBe(80);
    expect(thresholds.collapseAt).toBe(380);
    expect(thresholds.expandAt).toBe(360);
    expect(stickyHeaderStateFromScroll(0, 'expanded', thresholds)).toBe(
      'expanded',
    );
    expect(
      stickyHeaderStateFromScroll(379, 'expanded', thresholds),
    ).toBe('expanded');
    expect(
      stickyHeaderStateFromScroll(380, 'expanded', thresholds),
    ).toBe('compact');
    expect(
      stickyHeaderStateFromScroll(361, 'compact', thresholds),
    ).toBe('compact');
    expect(
      stickyHeaderStateFromScroll(360, 'compact', thresholds),
    ).toBe('expanded');
    expect(stickyHandoffThresholds(0).collapseAt).toBe(0);
    expect(
      stickyHeaderStateFromScroll(120, 'compact', stickyHandoffThresholds(80)),
    ).toBe('expanded');
  });

  it('parks Work compact when the tabs reach the viewport top', () => {
    const thresholds = workHandoffThresholds(714);
    expect(thresholds.collapseAt).toBe(714);
    expect(thresholds.expandAt).toBe(694);
    expect(thresholds.compactStack).toBe(0);
    expect(workHandoffThresholds(0).collapseAt).toBe(0);
    expect(
      stickyHeaderStateFromScroll(713, 'expanded', workHandoffThresholds(714)),
    ).toBe('expanded');
    expect(
      stickyHeaderStateFromScroll(714, 'expanded', workHandoffThresholds(714)),
    ).toBe('compact');
    expect(
      stickyHeaderStateFromScroll(695, 'compact', workHandoffThresholds(714)),
    ).toBe('compact');
    expect(
      stickyHeaderStateFromScroll(694, 'compact', workHandoffThresholds(714)),
    ).toBe('expanded');
  });
});

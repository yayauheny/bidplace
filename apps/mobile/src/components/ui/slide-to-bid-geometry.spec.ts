import { describe, expect, it } from 'vitest';

import {
  getSlideToBidGeometry,
  shouldCompleteSlideToBid,
  slideToBidCompletionThreshold,
} from './slide-to-bid-geometry';

describe('SlideToBid geometry', () => {
  it('matches the 488px canonical track with a 360px control', () => {
    expect(getSlideToBidGeometry(488)).toEqual({
      controlWidth: 360,
      maxOffset: 120,
    });
  });

  it('completes only after the deliberate drag threshold', () => {
    const { maxOffset } = getSlideToBidGeometry(488);
    expect(shouldCompleteSlideToBid(maxOffset * 0.9, maxOffset)).toBe(false);
    expect(
      shouldCompleteSlideToBid(
        maxOffset * slideToBidCompletionThreshold,
        maxOffset,
      ),
    ).toBe(true);
  });

  it('keeps the control inside narrow mobile tracks', () => {
    const { controlWidth, maxOffset } = getSlideToBidGeometry(300);
    expect(controlWidth + maxOffset + 8).toBe(300);
    expect(maxOffset).toBeGreaterThan(0);
  });
});

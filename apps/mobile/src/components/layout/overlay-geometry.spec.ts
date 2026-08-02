import { describe, expect, it } from 'vitest';

import { getBottomEndPosition } from './overlay-geometry';

describe('bottom-end overlay geometry', () => {
  it('keeps a 180px menu inside the 390px viewport with an 8px inset', () => {
    expect(
      getBottomEndPosition({
        anchorRight: 382,
        anchorBottom: 64,
        viewportWidth: 390,
        width: 180,
        collisionInset: 8,
        gap: 8,
      }),
    ).toEqual({ left: 202, top: 72 });
  });

  it('clamps a bottom-end menu when the anchor is near the left edge', () => {
    expect(
      getBottomEndPosition({
        anchorRight: 24,
        anchorBottom: 64,
        viewportWidth: 390,
        width: 180,
        collisionInset: 8,
        gap: 8,
      }).left,
    ).toBe(8);
  });
});

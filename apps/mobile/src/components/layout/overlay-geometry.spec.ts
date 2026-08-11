import { describe, expect, it } from 'vitest';

import { getBottomEndPosition, getBottomStartPosition } from './overlay-geometry';

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

  it('keeps a bottom-start menu aligned with the trigger when it fits', () => {
    expect(
      getBottomStartPosition({
        anchorLeft: 120,
        anchorBottom: 64,
        viewportWidth: 1440,
        width: 204,
        collisionInset: 8,
        gap: 8,
      }),
    ).toEqual({ left: 120, top: 72 });
  });

  it('clamps a bottom-start menu to the viewport edge', () => {
    expect(
      getBottomStartPosition({
        anchorLeft: 380,
        anchorBottom: 64,
        viewportWidth: 390,
        width: 204,
        collisionInset: 8,
        gap: 8,
      }).left,
    ).toBe(178);
  });
});

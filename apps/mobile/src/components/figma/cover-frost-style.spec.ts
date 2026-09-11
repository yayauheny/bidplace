import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  coverFrostBlur,
  coverFrostMask,
  coverFrostSpec,
} from './cover-frost-style';

describe('Cover frost', () => {
  it.each([
    ['workBottom', 125, 30, false],
    ['authorBottom', 77, 30, false],
    ['authorTop', 56, 20, true],
  ] as const)(
    'preserves the Figma region for %s independently of text',
    (placement, height, blur, top) => {
      expect(coverFrostSpec(placement)).toMatchObject({
        heightPercent: (height / 352) * 100,
        runtimeBlur: blur,
        top,
        artworkAspectRatio: 0.75,
      });
    },
  );

  it('cross-fades adjacent blur bands instead of stacking them to the edge', () => {
    expect(coverFrostMask(0, false)).toBe(
      'linear-gradient(to bottom, transparent 0%, black 3.125%, transparent 6.25%)',
    );
    expect(coverFrostMask(5, false)).toBe(
      'linear-gradient(to bottom, transparent 50%, black 100%)',
    );
    expect(coverFrostMask(0, true)).toBe(
      'linear-gradient(to top, transparent 0%, black 3.125%, transparent 6.25%)',
    );
  });

  it('keeps the documented runtime blur in px, not a viewport-scaled radius', () => {
    expect(coverFrostBlur(figmaTokens.blur.overlay, 1)).toBe('blur(30px)');
    expect(coverFrostBlur(figmaTokens.blur.authorTopOverlay, 1)).toBe(
      'blur(20px)',
    );
    expect(coverFrostBlur(figmaTokens.blur.overlay, 1 / 32)).toBe(
      'blur(0.9375px)',
    );
  });
});

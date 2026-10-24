import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  coverFrostBlur,
  coverFrostProgressiveMask,
  coverFrostSpec,
} from './cover-frost-style';

describe('Cover frost', () => {
  it.each([
    ['workBottom', 60, false, designTokens.color.overlay],
    ['authorBottom', 60, false, designTokens.color.overlay],
    ['authorTop', 0, true, designTokens.color.overlayScrim],
  ] as const)(
    'fills the text-hugging overlay zone for %s without a fixed height',
    (placement, blur, top, gradientEnd) => {
      const spec = coverFrostSpec(placement, designTokens.color);
      expect(spec).toMatchObject({
        runtimeBlur: blur,
        top,
        gradientEnd,
        artworkAspectRatio: 0.75,
      });
      expect(spec).not.toHaveProperty('heightPercent');
    },
  );

  it('keeps the documented runtime blur in px', () => {
    expect(coverFrostBlur(designTokens.blur.coverProgressive)).toBe(
      'blur(60px)',
    );
    expect(coverFrostBlur(designTokens.blur.authorTopOverlay)).toBe(
      'blur(0px)',
    );
  });

  it('uses a top-to-bottom progressive mask for bottom artwork zones', () => {
    expect(coverFrostProgressiveMask).toBe(
      'linear-gradient(to bottom, transparent 0%, black 100%)',
    );
  });
});

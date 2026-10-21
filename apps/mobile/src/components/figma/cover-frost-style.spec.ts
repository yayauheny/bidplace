import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  coverFrostBlur,
  coverFrostBlurMask,
  coverFrostSpec,
} from './cover-frost-style';

describe('Cover frost', () => {
  it.each([
    ['workBottom', 30, false, designTokens.color.overlay],
    ['authorBottom', 30, false, designTokens.color.overlay],
    ['authorTop', 20, true, designTokens.color.overlayScrim],
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

  it('uses one smooth ramp instead of repeating blur bands', () => {
    expect(coverFrostBlurMask(false)).toBe(
      'linear-gradient(to bottom, transparent, black)',
    );
    expect(coverFrostBlurMask(true)).toBe(
      'linear-gradient(to top, transparent, black)',
    );
  });

  it('keeps the documented runtime blur in px', () => {
    expect(coverFrostBlur(designTokens.blur.overlay)).toBe('blur(30px)');
    expect(coverFrostBlur(designTokens.blur.authorTopOverlay)).toBe(
      'blur(20px)',
    );
  });
});

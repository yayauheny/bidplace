import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  coverFrostBlur,
  coverFrostBlurMask,
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

  it('uses one smooth ramp instead of repeating blur bands', () => {
    expect(coverFrostBlurMask(false)).toBe(
      'linear-gradient(to bottom, transparent, black)',
    );
    expect(coverFrostBlurMask(true)).toBe(
      'linear-gradient(to top, transparent, black)',
    );
  });

  it('keeps the documented runtime blur in px', () => {
    expect(coverFrostBlur(figmaTokens.blur.overlay)).toBe('blur(30px)');
    expect(coverFrostBlur(figmaTokens.blur.authorTopOverlay)).toBe(
      'blur(20px)',
    );
  });
});

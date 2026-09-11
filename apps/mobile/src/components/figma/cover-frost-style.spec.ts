import { describe, expect, it } from 'vitest';

import { coverFrostSpec } from './cover-frost-style';

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
});

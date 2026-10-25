import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  coverFrostBackdropFilter,
  coverFrostMask,
  coverFrostSpec,
} from './cover-frost-style';

describe('Cover frost', () => {
  it.each([
    ['workBottom', false, designTokens.color.overlay],
    ['authorBottom', false, designTokens.color.overlay],
    ['authorTop', true, designTokens.color.overlayScrim],
  ] as const)(
    'fills the text-hugging overlay zone for %s without a fixed height',
    (placement, top, gradientEnd) => {
      const spec = coverFrostSpec(placement, designTokens.color);
      expect(spec).toMatchObject({
        top,
        gradientEnd,
        gradientStart: 'rgba(0, 0, 0, 0)',
      });
      expect(spec).not.toHaveProperty('heightPercent');
    },
  );

  it('uses one moderate backdrop filter shared by work and author bottoms', () => {
    expect(coverFrostBackdropFilter).toBe('blur(16px) saturate(115%)');
  });

  it('reaches full blur at 35% of the content-driven panel', () => {
    expect(coverFrostMask).toBe(
      'linear-gradient(to bottom, transparent 0%, black 35%, black 100%)',
    );
  });
});

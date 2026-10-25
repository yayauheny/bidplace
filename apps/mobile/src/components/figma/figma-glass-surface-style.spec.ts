import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { figmaGlassSurfaceSpec } from './figma-glass-surface-style';

describe('Figma glass surface spec', () => {
  it('matches the 60% navigation glass contract', () => {
    expect(figmaGlassSurfaceSpec('navigation', designTokens.color)).toEqual({
      blur: 6,
      nativeIntensity: 30,
      borderWidth: 0.5,
      borderRadius: 200,
      background: designTokens.color.glass,
      borderStart: designTokens.color.glassBorder,
      borderEnd: designTokens.color.glassBorderEnd,
    });
  });

  it('matches the uniform white capsule from Figma 7245:2520 and 7271:2719', () => {
    expect(figmaGlassSurfaceSpec('filterControl', designTokens.color)).toEqual({
      blur: 50, nativeIntensity: 100, borderWidth: 0.5, borderRadius: 80,
      background: designTokens.color.surface,
      borderStart: designTokens.color.toolbarBorder,
      borderEnd: designTokens.color.toolbarBorder,
    });
  });

  it('uses the captured 80% white fill for profile control groups', () => {
    expect(
      figmaGlassSurfaceSpec('controlGroup', designTokens.color).background,
    ).toBe(designTokens.color.glassStrong);
  });
});

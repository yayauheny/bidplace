import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import { figmaGlassSurfaceSpec } from './figma-glass-surface-style';

describe('Figma glass surface spec', () => {
  it('matches the 60% navigation glass contract', () => {
    expect(figmaGlassSurfaceSpec('navigation')).toEqual({
      blur: 6,
      nativeIntensity: 30,
      borderWidth: 0.5,
      borderRadius: 200,
      background: figmaTokens.color.glass,
      borderStart: figmaTokens.color.glassBorder,
      borderEnd: figmaTokens.color.glassBorderEnd,
    });
  });

  it('uses the captured 80% white fill for profile control groups', () => {
    expect(figmaGlassSurfaceSpec('controlGroup').background).toBe(
      figmaTokens.color.glassStrong,
    );
  });
});

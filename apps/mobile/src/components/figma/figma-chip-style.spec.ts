import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import { figmaChipStyle, figmaChipTextColor } from './figma-chip-style';

describe('Figma chip styles', () => {
  it('uses a muted fill on light surfaces', () => {
    expect(figmaChipStyle('onLight')).toMatchObject({
      backgroundColor: figmaTokens.color.mutedFill,
      borderColor: figmaTokens.color.border,
    });
    expect(figmaChipTextColor('onLight')).toBe(figmaTokens.color.ink);
  });

  it('uses dark glass on cover artwork', () => {
    expect(figmaChipStyle('onDark')).toMatchObject({
      backgroundColor: figmaTokens.color.chip,
      borderColor: figmaTokens.color.chipOutline,
    });
    expect(figmaChipTextColor('onDark')).toBe(figmaTokens.color.white);
  });

  it('uses frosted white glass on author atmosphere', () => {
    expect(figmaChipStyle('onGlass')).toMatchObject({
      backgroundColor: figmaTokens.color.glassChip,
      borderColor: figmaTokens.color.white,
    });
    expect(figmaChipTextColor('onGlass')).toBe(figmaTokens.color.ink);
  });
});

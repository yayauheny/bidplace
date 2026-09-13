import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaChipSizeStyle,
  figmaChipStyle,
  figmaChipTextColor,
  figmaChipTypography,
} from './figma-chip-style';

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

  it('uses 80% white glass with the shared glass border on author atmosphere', () => {
    expect(figmaChipStyle('onGlass')).toMatchObject({
      backgroundColor: figmaTokens.color.glassStrong,
      borderColor: figmaTokens.color.glassBorder,
    });
    expect(figmaChipTextColor('onGlass')).toBe(figmaTokens.color.ink);
  });

  it('renders work chips with subdued text and work paddings', () => {
    expect(figmaChipSizeStyle('work')).toEqual({
      paddingHorizontal: figmaTokens.space.workChipX,
      paddingVertical: figmaTokens.space.workChipY,
    });
    expect(figmaChipTypography('work')).toBe(figmaTokens.typography.workChip);
    expect(figmaChipTextColor('onGlass', 'work')).toBe(
      figmaTokens.color.textSubdued,
    );
    expect(figmaChipTextColor('onGlass', 'profile')).toBe(
      figmaTokens.color.ink,
    );
  });
});

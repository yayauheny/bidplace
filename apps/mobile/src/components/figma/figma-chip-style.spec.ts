import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaChipGradientColors,
  figmaChipGradientPlacement,
  figmaChipLayoutHeight,
  figmaChipOutsideGradientRingStyle,
  figmaChipSizeStyle,
  figmaChipStyle,
  figmaChipTextColor,
  figmaChipTypography,
  figmaChipUsesGradientStroke,
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

  it('tints identity chips like cover chips but keeps ink text', () => {
    expect(figmaChipStyle('tinted')).toEqual(figmaChipStyle('onDark'));
    expect(figmaChipTextColor('tinted')).toBe(figmaTokens.color.ink);
  });

  it('reserves the last Figma padding pixel for the 1px border', () => {
    expect(figmaChipStyle('onDark')).toMatchObject({
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderWidth: 1,
    });
  });

  it('uses 80% white glass with the shared glass border on author atmosphere', () => {
    expect(figmaChipStyle('onGlass')).toMatchObject({
      backgroundColor: figmaTokens.color.glassStrong,
      borderColor: figmaTokens.color.glassBorder,
    });
    expect(figmaChipTextColor('onGlass')).toBe(figmaTokens.color.ink);
    expect(figmaChipUsesGradientStroke('onGlass')).toBe(true);
    expect(figmaChipGradientPlacement('onGlass')).toBe('outside');
    expect(figmaChipGradientColors('onGlass')).toEqual({
      start: figmaTokens.color.glassBorder,
      end: figmaTokens.color.glassBorderEnd,
    });
    expect(figmaChipSizeStyle('profile')).toEqual({
      paddingHorizontal: figmaTokens.space.authorChipX,
      paddingVertical: figmaTokens.space.authorChipY,
    });
    expect(figmaTokens.space.authorChipY).toBe(6);
  });

  it('renders work chips with subdued text and work paddings', () => {
    expect(figmaChipSizeStyle('work')).toEqual({
      paddingHorizontal: 12,
      paddingVertical: 6,
    });
    expect(figmaTokens.space.workChipX).toBe(12);
    expect(figmaTokens.space.workChipY).toBe(6);
    expect(figmaChipLayoutHeight('work')).toBe(29);
    expect(figmaChipTypography('work')).toBe(figmaTokens.typography.workChip);
    expect(figmaChipTextColor('onGlass', 'work')).toBe(
      figmaTokens.color.textSubdued,
    );
    expect(figmaChipTextColor('onGlass', 'profile')).toBe(
      figmaTokens.color.ink,
    );
  });

  it('keeps creator profile chip metrics', () => {
    expect(figmaChipSizeStyle('profile')).toEqual({
      paddingHorizontal: 16,
      paddingVertical: 6,
    });
    expect(figmaChipLayoutHeight('profile')).toBe(35);
    expect(figmaChipTypography('profile')).toBe(
      figmaTokens.typography.profileChip,
    );
    expect(figmaChipTypography('profile')).toMatchObject({
      fontSize: 16,
      lineHeight: 23,
      fontWeight: '500',
    });
  });

  it('paints onGlass as a 1px outside ring that cannot cover the interior', () => {
    const style = figmaChipOutsideGradientRingStyle(
      figmaChipGradientColors('onGlass'),
    );
    expect(figmaChipGradientPlacement('onGlass')).toBe('outside');
    expect(style).toMatchObject({
      top: -1,
      right: -1,
      bottom: -1,
      left: -1,
      padding: 1,
      borderRadius: 29,
      pointerEvents: 'none',
      boxSizing: 'border-box',
      maskComposite: 'exclude',
      WebkitMaskComposite: 'xor',
    });
    expect(style.backgroundImage).toBe(
      `linear-gradient(180deg, ${figmaTokens.color.glassBorder}, ${figmaTokens.color.glassBorderEnd})`,
    );
    expect(style.WebkitMask).toContain('content-box');
    expect(style.mask).toContain('content-box');
    expect(style).not.toHaveProperty('zIndex');
  });
});

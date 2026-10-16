import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  figmaChipGradientColors,
  figmaChipGradientPlacement,
  figmaChipOutsideGradientRingStyle,
  figmaChipSizeStyle,
  figmaChipStyle,
  figmaChipTextColor,
  figmaChipTypography,
  figmaChipUsesGradientStroke,
} from './figma-chip-style';

describe('Figma chip styles', () => {
  it('uses a muted fill on light surfaces', () => {
    expect(figmaChipStyle('onLight', designTokens.color)).toMatchObject({
      backgroundColor: designTokens.color.mutedFill,
      borderColor: designTokens.color.border,
    });
    expect(figmaChipTextColor('onLight', 'compact', designTokens.color)).toBe(
      designTokens.color.ink,
    );
  });

  it('uses dark glass on cover artwork', () => {
    expect(figmaChipStyle('onDark', designTokens.color)).toMatchObject({
      backgroundColor: designTokens.color.chip,
      borderColor: designTokens.color.chipOutline,
    });
    expect(figmaChipTextColor('onDark', 'compact', designTokens.color)).toBe(
      designTokens.color.white,
    );
  });

  it('tints identity chips like cover chips but keeps ink text', () => {
    expect(figmaChipStyle('tinted', designTokens.color)).toEqual(
      figmaChipStyle('onDark', designTokens.color),
    );
    expect(figmaChipTextColor('tinted', 'compact', designTokens.color)).toBe(
      designTokens.color.ink,
    );
  });

  it('reserves the last Figma padding pixel for the 1px border', () => {
    expect(figmaChipStyle('onDark', designTokens.color)).toMatchObject({
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderWidth: 1,
    });
  });

  it('uses 80% white glass with the shared glass border on author atmosphere', () => {
    expect(figmaChipStyle('onGlass', designTokens.color)).toMatchObject({
      backgroundColor: designTokens.color.glassStrong,
      borderColor: designTokens.color.glassBorder,
    });
    expect(figmaChipTextColor('onGlass', 'compact', designTokens.color)).toBe(
      designTokens.color.ink,
    );
    expect(figmaChipUsesGradientStroke('onGlass')).toBe(true);
    expect(figmaChipGradientPlacement('onGlass')).toBe('outside');
    expect(figmaChipGradientColors('onGlass', designTokens.color)).toEqual({
      start: designTokens.color.glassBorder,
      end: designTokens.color.glassBorderEnd,
    });
    expect(figmaChipSizeStyle('profile')).toEqual({
      paddingHorizontal: designTokens.space.authorChipX,
      paddingVertical: designTokens.space.authorChipY,
    });
    expect(designTokens.space.authorChipY).toBe(6);
  });

  it('renders work chips with subdued text and work paddings', () => {
    expect(figmaChipSizeStyle('work')).toEqual({
      paddingHorizontal: 12,
      paddingVertical: 6,
    });
    expect(designTokens.space.workChipX).toBe(12);
    expect(designTokens.space.workChipY).toBe(6);
    expect(figmaChipTypography('work')).toBe(designTokens.typography.workChip);
    expect(figmaChipTextColor('onGlass', 'work', designTokens.color)).toBe(
      designTokens.color.textSubdued,
    );
    expect(figmaChipTextColor('onGlass', 'profile', designTokens.color)).toBe(
      designTokens.color.ink,
    );
  });

  it('keeps creator profile chip metrics', () => {
    expect(figmaChipSizeStyle('profile')).toEqual({
      paddingHorizontal: 16,
      paddingVertical: 6,
    });
    expect(figmaChipTypography('profile')).toBe(
      designTokens.typography.profileChip,
    );
    expect(figmaChipTypography('profile')).toMatchObject({
      fontSize: 16,
      lineHeight: 23,
      fontWeight: '500',
    });
  });

  it('paints onGlass as a 1px outside ring that cannot cover the interior', () => {
    const style = figmaChipOutsideGradientRingStyle(
      figmaChipGradientColors('onGlass', designTokens.color),
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
      `linear-gradient(180deg, ${designTokens.color.glassBorder}, ${designTokens.color.glassBorderEnd})`,
    );
    expect(style.WebkitMask).toContain('content-box');
    expect(style.mask).toContain('content-box');
    expect(style).not.toHaveProperty('zIndex');
  });
});

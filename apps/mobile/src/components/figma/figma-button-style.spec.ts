import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaButtonGradientColors,
  figmaButtonGradientOpacity,
  figmaButtonGradientPlacement,
  figmaButtonUsesOutsidePaintWrapper,
  figmaButtonLabelColor,
  figmaButtonSurfaceFill,
  figmaButtonStyle,
  figmaButtonUsesGradientBorder,
} from './figma-button-style';

describe('Figma button styles', () => {
  it('uses the solid charcoal pill for the primary idle state', () => {
    expect(figmaButtonStyle('solid', 'idle')).toMatchObject({
      backgroundColor: figmaTokens.color.solid,
      borderColor: figmaTokens.color.ink,
      borderRadius: 80,
      minHeight: 44,
    });
    expect(figmaButtonLabelColor('solid')).toBe(figmaTokens.color.white);
  });

  it('darkens a pressed pill without a decorative ring', () => {
    expect(figmaButtonStyle('outline', 'pressed')).toMatchObject({
      backgroundColor: 'transparent',
      borderRadius: 80,
    });
    expect(figmaButtonStyle('outline', 'pressed')).not.toHaveProperty(
      'boxShadow',
    );
    expect(figmaButtonStyle('solid', 'pressed').backgroundColor).toBe(
      figmaTokens.color.solidHover,
    );
    expect(figmaButtonStyle('solid', 'pressed')).not.toHaveProperty(
      'boxShadow',
    );
    expect(figmaButtonSurfaceFill('outline', 'pressed')).toBe(
      figmaTokens.color.ghostHover,
    );
  });

  it('uses the captured gradient border for outline variants', () => {
    expect(figmaButtonUsesGradientBorder('outline')).toBe(true);
    expect(figmaButtonStyle('outline', 'idle')).toMatchObject({
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 1,
    });
    expect(figmaButtonSurfaceFill('outline', 'hover')).toBe(
      figmaTokens.color.ghostHover,
    );
  });

  it('insets borderless pressed surfaces without changing their outer footprint', () => {
    expect(figmaButtonStyle('ghost', 'pressed')).toMatchObject({
      minHeight: 42,
      margin: 1,
      borderWidth: 0,
    });
    expect(figmaButtonStyle('ghost', 'pressed')).not.toHaveProperty(
      'boxShadow',
    );
  });

  it('dims disabled variants instead of inventing a second control size', () => {
    expect(figmaButtonStyle('solid', 'disabled').opacity).toBe(0.5);
    expect(figmaButtonStyle('muted', 'disabled').opacity).toBe(0.5);
  });

  it('hugs the quiet compact pill from padding and type, not 149×34', () => {
    const compact = figmaButtonStyle('quiet', 'idle', 'compact');
    expect(compact).toMatchObject({
      backgroundColor: figmaTokens.color.quietFill,
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: figmaTokens.radius.chip,
      paddingHorizontal: figmaTokens.space.quietButtonX,
      paddingVertical: figmaTokens.space.quietButtonY,
    });
    expect(compact.backgroundColor).toBe('#EFEFEF');
    expect(compact).not.toHaveProperty('minHeight');
    expect(compact).not.toHaveProperty('width');
    expect(compact).not.toHaveProperty('height');
    expect(figmaButtonUsesGradientBorder('quiet')).toBe(true);
    expect(figmaButtonGradientPlacement('quiet')).toBe('outside');
    expect(figmaButtonGradientPlacement('outline')).toBe('inset');
    expect(figmaButtonUsesOutsidePaintWrapper('quiet')).toBe(true);
    expect(figmaButtonUsesOutsidePaintWrapper('outline')).toBe(false);
    for (const variant of ['solid', 'ghost', 'muted', 'danger'] as const) {
      expect(figmaButtonGradientPlacement(variant)).toBe('none');
      expect(figmaButtonUsesOutsidePaintWrapper(variant)).toBe(false);
    }
    expect(figmaButtonGradientColors('quiet')).toEqual([
      figmaTokens.color.quietBorderStart,
      figmaTokens.color.quietBorderEnd,
    ]);
    expect(figmaButtonGradientOpacity('quiet')).toBe(
      figmaTokens.opacity.quietBorder,
    );
    expect(figmaButtonStyle('quiet', 'hover', 'compact').backgroundColor).toBe(
      figmaTokens.color.quietFill,
    );
    expect(figmaButtonSurfaceFill('quiet', 'idle')).toBe(
      figmaTokens.color.quietFill,
    );
    expect(figmaButtonLabelColor('quiet')).toBe(figmaTokens.color.ink);
  });

  it('keeps danger visually distinct from the primary solid pill', () => {
    expect(figmaButtonStyle('danger', 'idle')).toMatchObject({
      backgroundColor: figmaTokens.color.danger,
      borderColor: figmaTokens.color.dangerHover,
    });
    expect(figmaButtonStyle('danger', 'hover').backgroundColor).toBe(
      figmaTokens.color.dangerHover,
    );
    expect(figmaButtonStyle('danger', 'pressed')).toMatchObject({
      backgroundColor: figmaTokens.color.dangerHover,
    });
    expect(figmaButtonStyle('danger', 'pressed')).not.toHaveProperty(
      'boxShadow',
    );
    expect(figmaButtonStyle('danger', 'disabled')).toMatchObject({
      backgroundColor: figmaTokens.color.danger,
      opacity: 0.5,
    });
    expect(figmaButtonLabelColor('danger')).toBe(figmaTokens.color.white);
    expect(figmaButtonStyle('danger', 'idle').backgroundColor).not.toBe(
      figmaButtonStyle('solid', 'idle').backgroundColor,
    );
  });
});

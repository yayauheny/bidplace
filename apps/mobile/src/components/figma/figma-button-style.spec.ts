import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
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

  it('applies the mint press ring without changing the pill radius', () => {
    expect(figmaButtonStyle('outline', 'pressed')).toMatchObject({
      backgroundColor: 'transparent',
      boxShadow: `0px 0px 0px 2px ${figmaTokens.color.pressRing}`,
      borderRadius: 80,
    });
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
      boxShadow: `0px 0px 0px 2px ${figmaTokens.color.pressRing}`,
    });
  });

  it('dims disabled variants instead of inventing a second control size', () => {
    expect(figmaButtonStyle('solid', 'disabled').opacity).toBe(0.5);
    expect(figmaButtonStyle('muted', 'disabled').opacity).toBe(0.5);
  });
});

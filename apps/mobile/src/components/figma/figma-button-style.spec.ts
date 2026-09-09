import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaButtonLabelColor,
  figmaButtonStyle,
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
      backgroundColor: figmaTokens.color.ghostHover,
      boxShadow: `0px 0px 0px 2px ${figmaTokens.color.pressRing}`,
      borderRadius: 80,
    });
  });

  it('dims disabled variants instead of inventing a second control size', () => {
    expect(figmaButtonStyle('solid', 'disabled').opacity).toBe(0.5);
    expect(figmaButtonStyle('muted', 'disabled').opacity).toBe(0.5);
  });
});

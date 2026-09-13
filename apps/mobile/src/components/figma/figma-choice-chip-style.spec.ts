import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaChoiceChipStyle,
  figmaChoiceChipTextColor,
} from './figma-choice-chip-style';

describe('Figma choice chip styles', () => {
  it('matches the selected 38 px charcoal chip', () => {
    expect(figmaChoiceChipStyle(true, 'idle')).toMatchObject({
      minHeight: 38,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderColor: figmaTokens.color.ink,
      backgroundColor: figmaTokens.color.solid,
    });
    expect(figmaChoiceChipTextColor(true)).toBe(figmaTokens.color.white);
  });

  it('matches the unselected gray chip and its hover fill', () => {
    expect(figmaChoiceChipStyle(false, 'idle')).toMatchObject({
      borderColor: figmaTokens.color.white,
      backgroundColor: figmaTokens.color.mutedFill,
    });
    expect(figmaChoiceChipStyle(false, 'hover').backgroundColor).toBe(
      figmaTokens.color.mutedHover,
    );
    expect(figmaChoiceChipTextColor(false)).toBe(figmaTokens.color.ink);
  });

  it('exposes pressed and disabled feedback without changing geometry', () => {
    expect(figmaChoiceChipStyle(false, 'pressed')).toMatchObject({
      minHeight: figmaTokens.size.choiceChip,
      boxShadow: `0px 0px 0px 2px ${figmaTokens.color.pressRing}`,
    });
    expect(figmaChoiceChipStyle(false, 'disabled').opacity).toBe(
      figmaTokens.opacity.disabled,
    );
  });
});

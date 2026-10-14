import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

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
      borderColor: designTokens.color.ink,
      backgroundColor: designTokens.color.solid,
    });
    expect(figmaChoiceChipTextColor(true)).toBe(designTokens.color.white);
  });

  it('matches the unselected gray chip and its hover fill', () => {
    expect(figmaChoiceChipStyle(false, 'idle')).toMatchObject({
      borderColor: designTokens.color.white,
      backgroundColor: designTokens.color.mutedFill,
    });
    expect(figmaChoiceChipStyle(false, 'hover').backgroundColor).toBe(
      designTokens.color.mutedHover,
    );
    expect(figmaChoiceChipTextColor(false)).toBe(designTokens.color.ink);
  });

  it('exposes pressed and disabled feedback without changing geometry', () => {
    expect(figmaChoiceChipStyle(false, 'pressed')).toMatchObject({
      minHeight: designTokens.size.choiceChip,
      backgroundColor: designTokens.color.mutedHover,
    });
    expect(figmaChoiceChipStyle(false, 'pressed')).not.toHaveProperty(
      'boxShadow',
    );
    expect(figmaChoiceChipStyle(true, 'pressed').backgroundColor).toBe(
      designTokens.color.solidHover,
    );
    expect(figmaChoiceChipStyle(false, 'disabled').opacity).toBe(
      designTokens.opacity.disabled,
    );
  });
});

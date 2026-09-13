import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaIconButtonHitSlop,
  figmaIconButtonStyle,
} from './figma-icon-button-style';

describe('Figma icon button styles', () => {
  it('keeps the captured 36 px visual frame with a 44 px hit target', () => {
    expect(figmaIconButtonStyle(false)).toMatchObject({
      width: 36,
      height: 36,
      backgroundColor: 'transparent',
    });
    expect(figmaIconButtonHitSlop).toBe(4);
    expect(36 + figmaIconButtonHitSlop * 2).toBe(figmaTokens.size.touch);
  });

  it('shows feedback without adding a permanent white plate', () => {
    expect(figmaIconButtonStyle(true).backgroundColor).toBe(
      figmaTokens.color.ghostHover,
    );
  });
});

import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

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
    expect(36 + figmaIconButtonHitSlop * 2).toBe(designTokens.size.touch);
  });

  it('provides the captured 42px muted circular control without changing plain buttons', () => {
    expect(figmaIconButtonStyle(false, 'muted')).toMatchObject({
      width: 42,
      height: 42,
      backgroundColor: designTokens.color.headerControl,
    });
  });

  it('shows feedback without adding a permanent white plate', () => {
    expect(figmaIconButtonStyle(true).backgroundColor).toBe(
      designTokens.color.ghostHover,
    );
  });
});

import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  searchOverlayCloseStyle,
  searchOverlayFieldChromeStyle,
  searchOverlayFieldInputStyle,
  searchOverlayFieldRowStyle,
  searchOverlayIconFrameStyle,
} from './search-overlay-header-style';

describe('search overlay header style', () => {
  it('matches Figma 439:4789 / 439:4921 chrome', () => {
    expect(searchOverlayFieldRowStyle()).toMatchObject({
      gap: figmaTokens.space.x3,
    });
    expect(searchOverlayFieldChromeStyle()).toMatchObject({
      height: 52,
      padding: figmaTokens.space.x2,
      gap: figmaTokens.space.x2,
      backgroundColor: figmaTokens.color.canvas,
      borderWidth: 0.5,
      borderColor: figmaTokens.color.border,
      borderRadius: figmaTokens.radius.dock,
    });
    expect(searchOverlayIconFrameStyle()).toMatchObject({
      width: figmaTokens.size.control,
      height: figmaTokens.size.control,
    });
    expect(searchOverlayCloseStyle()).toMatchObject({
      width: 52,
      height: 52,
      backgroundColor: figmaTokens.color.canvas,
      borderWidth: 0.5,
      borderColor: figmaTokens.color.border,
    });
    expect(searchOverlayFieldInputStyle()).toMatchObject({
      backgroundColor: 'transparent',
      height: figmaTokens.size.control,
      padding: 0,
    });
    expect(searchOverlayFieldChromeStyle().backgroundColor).not.toBe(
      figmaTokens.color.searchSurface,
    );
  });
});

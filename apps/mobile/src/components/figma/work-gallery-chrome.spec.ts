import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  workGalleryChromeStyle,
  workGalleryDotColor,
  workGalleryDotStyle,
} from './work-gallery-chrome';

describe('Work gallery chrome', () => {
  it('places Frame 76 12px from the web hero top, not under a status bar', () => {
    expect(workGalleryChromeStyle()).toMatchObject({
      position: 'absolute',
      top: designTokens.space.x3,
      left: designTokens.space.x5,
      right: designTokens.space.x5,
      height: designTokens.size.header,
      flexDirection: 'row',
      justifyContent: 'space-between',
    });
    expect(designTokens.space.x3).toBe(12);
    expect(designTokens.space.x5).toBe(20);
    expect(designTokens.size.header).toBe(48);
  });

  it('uses border #DEDEDE for inactive dots and leaves divider unchanged', () => {
    expect(workGalleryDotColor(false)).toBe(designTokens.color.border);
    expect(workGalleryDotColor(false)).toBe('#DEDEDE');
    expect(workGalleryDotColor(true)).toBe(designTokens.color.ink);
    expect(designTokens.color.divider).toBe('#E2E2E2');
    expect(workGalleryDotStyle(false)).toMatchObject({
      width: designTokens.size.statusDot,
      height: designTokens.size.statusDot,
      backgroundColor: '#DEDEDE',
    });
  });
});

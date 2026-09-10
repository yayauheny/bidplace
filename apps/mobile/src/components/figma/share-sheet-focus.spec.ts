import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import { isTabKey, nextFocusIndex } from './share-sheet-focus';
import { shareSheetPanelStyle } from './share-sheet-style';

describe('share sheet keyboard contract', () => {
  it('cycles tab focus inside the sheet', () => {
    expect(isTabKey({ key: 'Tab' })).toBe(true);
    expect(nextFocusIndex(0, 3, false)).toBe(1);
    expect(nextFocusIndex(2, 3, false)).toBe(0);
    expect(nextFocusIndex(0, 3, true)).toBe(2);
  });

  it('uses the shared sheet radius and page gutter', () => {
    expect(shareSheetPanelStyle()).toMatchObject({
      maxWidth: figmaTokens.size.phoneWidth,
      backgroundColor: figmaTokens.color.canvas,
      borderTopLeftRadius: figmaTokens.radius.sheet,
      borderTopRightRadius: figmaTokens.radius.sheet,
      paddingHorizontal: figmaTokens.space.pageGutter,
    });
  });
});

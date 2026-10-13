import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  filterSheetHeaderStyle,
  filterSheetPanelStyle,
  filterSheetSectionRowStyle,
} from './filter-sheet-style';

describe('FilterSheet catalog layout', () => {
  it('keeps the existing full-screen layout for other consumers', () => {
    expect(filterSheetPanelStyle()).toMatchObject({
      height: '100%',
      maxWidth: figmaTokens.layout.phoneWidth,
    });
    expect(filterSheetHeaderStyle().minHeight).toBe(figmaTokens.size.touch);
    expect(filterSheetSectionRowStyle().minHeight).toBe(
      figmaTokens.size.input,
    );
  });

  it('uses a bounded bottom sheet and compact option rows for catalogs', () => {
    expect(filterSheetPanelStyle(true)).toMatchObject({
      width: '100%',
      maxHeight: '78%',
      borderTopLeftRadius: figmaTokens.radius.cover,
      borderTopRightRadius: figmaTokens.radius.cover,
    });
    expect(filterSheetPanelStyle(true)).not.toHaveProperty('height');
    expect(filterSheetHeaderStyle(true).minHeight).toBe(43);
    expect(filterSheetSectionRowStyle(true).minHeight).toBe(44);
  });
});

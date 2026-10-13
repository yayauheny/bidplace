import { describe, expect, it } from 'vitest';

import { filterSheetPanelStyle } from './filter-sheet-style';

describe('FilterSheet layouts', () => {
  it('keeps the existing fullscreen picker by default', () => {
    expect(filterSheetPanelStyle()).toMatchObject({ height: '100%' });
  });

  it('has rounded top corners and intrinsic height in compact mode', () => {
    const compact = filterSheetPanelStyle(true);
    expect(compact).toMatchObject({
      width: '100%',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: 8,
      paddingHorizontal: 20,
    });
    expect(compact).not.toHaveProperty('height');
  });
});

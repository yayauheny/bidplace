import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  stickyDockActionRowStyle,
  stickyDockTabsStyle,
} from './sticky-dock-action-row';

describe('sticky dock action row', () => {
  it('owns the action zone without a full-width surface', () => {
    const row = stickyDockActionRowStyle();
    expect(row.height).toBe(designTokens.stickyDock.actionHeight);
    expect(row.paddingTop).toBe(designTokens.stickyDock.controlTop);
    expect(row.paddingBottom).toBe(designTokens.space.x5);
    expect(row.paddingHorizontal).toBe(designTokens.stickyDock.controlInset);
    expect(row.backgroundColor).toBe('transparent');
  });

  it('parks the tabs slot under the action zone without overflowing', () => {
    expect(stickyDockTabsStyle()).toMatchObject({
      position: 'sticky',
      top: designTokens.stickyDock.actionHeight,
    });
    expect(stickyDockTabsStyle()).not.toHaveProperty('overflowX');
    expect(stickyDockTabsStyle()).not.toHaveProperty('backgroundColor');
  });
});

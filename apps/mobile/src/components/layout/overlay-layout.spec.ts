import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  overlayMenuItemStyle,
  overlayPanelStyle,
} from './overlay-layout';

describe('overlay-layout', () => {
  it('matches discovery dropdown panel geometry', () => {
    const style = overlayPanelStyle({
      width: designTokens.layout.discoveryMenuWidth,
      borderRadius: designTokens.radius.menu,
      borderColor: designTokens.color.border,
      gap: designTokens.space.x1,
      padding: designTokens.space.x2,
    });

    expect(style.width).toBe(designTokens.layout.discoveryMenuWidth);
    expect(style.borderRadius).toBe(designTokens.radius.menu);
    expect(style.borderColor).toBe(designTokens.color.border);
    expect(style.gap).toBe(designTokens.space.x1);
    expect(style.padding).toBe(designTokens.space.x2);
  });

  it('matches account popover panel chrome defaults', () => {
    const style = overlayPanelStyle({
      width: designTokens.layout.accountPopoverWidth,
      borderRadius: 22,
      borderColor: designTokens.color.border,
      gap: designTokens.space.x2,
      padding: 10,
    });

    expect(style.borderRadius).toBe(22);
    expect(style.borderColor).toBe(designTokens.color.border);
    expect(style.gap).toBe(designTokens.space.x2);
    expect(style.padding).toBe(10);
  });

  it('matches overlay menu item base style', () => {
    const style = overlayMenuItemStyle({
      minHeight: 48,
      borderRadius: 14,
      paddingHorizontal: designTokens.space.x3,
      gap: designTokens.space.x3,
    });

    expect(style.minHeight).toBe(48);
    expect(style.borderRadius).toBe(14);
    expect(style.paddingHorizontal).toBe(designTokens.space.x3);
    expect(style.gap).toBe(designTokens.space.x3);
  });
});


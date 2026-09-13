import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  createWorkActionStyle,
  headerClusterWidth,
  headerInnerLayoutStyle,
  headerSearchContainerStyle,
  discoveryMenuDesktopRadius,
  discoveryMenuDesktopWidth,
  headerSearchInputFontSize,
} from './header-layout';

describe('header-layout', () => {
  it('keeps extracted desktop widths and radii stable', () => {
    expect(headerClusterWidth).toBe(420);
    expect(discoveryMenuDesktopWidth).toBe(142);
    expect(discoveryMenuDesktopRadius).toBe(22);
  });

  it('keeps create work action style stable', () => {
    const style = createWorkActionStyle();
    expect(style.minHeight).toBe(designTokens.size.buttonCompact);
    expect(style.borderRadius).toBe(designTokens.radius.pill);
    expect(style.backgroundColor).toBe(designTokens.color.action);
  });

  it('computes header inner layout gaps and padding by breakpoints', () => {
    const style = headerInnerLayoutStyle({ desktop: true, searchInline: true });
    expect(style.gap).toBe(designTokens.space.x7);
    expect(style.paddingHorizontal).toBe(designTokens.space.x8);
    expect(style.minHeight).toBe(designTokens.size.header);
  });

  it('computes header search container style for inline variant', () => {
    const style = headerSearchContainerStyle({ inline: true });
    expect(style.maxWidth).toBe(480);
    expect(style.minHeight).toBe(designTokens.size.input);
    expect(style.paddingHorizontal).toBe(18);
  });

  it('keeps extracted header search input font size stable', () => {
    expect(headerSearchInputFontSize).toBe(15);
  });
});


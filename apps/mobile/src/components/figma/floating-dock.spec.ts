import { describe, expect, it } from 'vitest';

import {
  dockItemAccessibility,
  figmaDeferredDockItemIds,
  figmaDockItemIds,
  figmaDockItems,
  figmaUnusedDockVariantIds,
  isFigmaDockItemSelected,
} from './floating-dock';

describe('Figma floating dock', () => {
  it('uses Home Search Add Profile and no cart', () => {
    expect(figmaDockItemIds).toEqual(['home', 'search', 'plus', 'profile']);
    expect(figmaDeferredDockItemIds).toEqual(['cart']);
    expect(figmaDockItems.map((item) => item.icon)).toEqual([
      'logo',
      'search-01',
      'plus',
      'user',
    ]);
  });

  it('rejects the split search FAB and five-icon cart pill variants', () => {
    expect(figmaUnusedDockVariantIds).toEqual([
      'split-search-fab',
      'five-icon-cart-pill',
    ]);
    expect(figmaDockItemIds).not.toContain('cart');
    expect(figmaDockItems).toHaveLength(4);
  });

  it('selects search and profile from public routes', () => {
    expect(isFigmaDockItemSelected('home', '/')).toBe(true);
    expect(isFigmaDockItemSelected('search', '/search')).toBe(true);
    expect(isFigmaDockItemSelected('profile', '/login')).toBe(true);
    expect(isFigmaDockItemSelected('plus', '/')).toBe(false);
  });

  it('keeps route items as links and create as a button', () => {
    expect(dockItemAccessibility('home', true)).toEqual({
      role: 'link',
      accessibilityState: { selected: true },
      ariaCurrent: 'page',
    });
    expect(dockItemAccessibility('search', false)).toEqual({
      role: 'button',
      accessibilityState: { selected: false },
    });
    expect(dockItemAccessibility('plus', false)).toEqual({
      role: 'button',
      accessibilityState: {},
    });
  });
});

import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaDeferredDockItemIds,
  figmaDockItemIds,
  figmaDockItems,
  figmaDockSurfaceSize,
  figmaUnusedDockVariantIds,
  isFigmaDockItemSelected,
} from './floating-dock';

describe('Figma floating dock', () => {
  it('uses one 232×64 capsule with Home Search Add Profile and no cart', () => {
    expect(figmaDockItemIds).toEqual(['home', 'search', 'plus', 'profile']);
    expect(figmaDeferredDockItemIds).toEqual(['cart']);
    expect(figmaDockItems.map((item) => item.icon)).toEqual([
      'logo',
      'search-01',
      'plus',
      'user',
    ]);
    expect(figmaDockSurfaceSize()).toEqual({ width: 232, height: 64 });
    expect(figmaDockSurfaceSize().height).toBe(
      figmaTokens.space.dockPad * 2 + figmaTokens.size.control,
    );
  });

  it('rejects the split search FAB and five-icon cart pill variants', () => {
    expect(figmaUnusedDockVariantIds).toEqual([
      'split-search-fab',
      'five-icon-cart-pill',
    ]);
    expect(figmaDockItemIds).not.toContain('cart');
    expect(figmaDockItems).toHaveLength(4);
    expect(figmaDockSurfaceSize(5).width).toBe(288);
  });

  it('selects search and profile from public routes', () => {
    expect(isFigmaDockItemSelected('home', '/')).toBe(true);
    expect(isFigmaDockItemSelected('search', '/search')).toBe(true);
    expect(isFigmaDockItemSelected('profile', '/login')).toBe(true);
    expect(isFigmaDockItemSelected('plus', '/')).toBe(false);
  });
});

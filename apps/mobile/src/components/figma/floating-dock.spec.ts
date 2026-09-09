import { describe, expect, it } from 'vitest';

import {
  figmaDeferredDockItemIds,
  figmaDockItemIds,
  figmaDockItems,
  isFigmaDockItemSelected,
} from './floating-dock';

describe('Figma floating dock', () => {
  it('uses Home Search Add Profile and keeps cart out of MVP', () => {
    expect(figmaDockItemIds).toEqual(['home', 'search', 'plus', 'profile']);
    expect(figmaDeferredDockItemIds).toEqual(['cart']);
    expect(figmaDockItems.map((item) => item.icon)).toEqual([
      'logo',
      'search-01',
      'plus',
      'user',
    ]);
  });

  it('selects search and profile from public routes', () => {
    expect(isFigmaDockItemSelected('home', '/')).toBe(true);
    expect(isFigmaDockItemSelected('search', '/search')).toBe(true);
    expect(isFigmaDockItemSelected('profile', '/login')).toBe(true);
    expect(isFigmaDockItemSelected('plus', '/')).toBe(false);
  });
});

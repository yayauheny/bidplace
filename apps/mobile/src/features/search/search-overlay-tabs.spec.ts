import { describe, expect, it } from 'vitest';

import {
  SEARCH_OVERLAY_DEFAULT_TAB,
  isSearchOverlayTab,
  searchOverlayTabs,
} from './search-overlay-tabs';

describe('search overlay tabs', () => {
  it('defaults to Categories and keeps a shared tab list', () => {
    expect(SEARCH_OVERLAY_DEFAULT_TAB).toBe('categories');
    expect(searchOverlayTabs.map((tab) => tab.label)).toEqual([
      'Категории',
      'Авторы',
      'Работы',
    ]);
    expect(isSearchOverlayTab('works')).toBe(true);
    expect(isSearchOverlayTab('products')).toBe(false);
  });
});

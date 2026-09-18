import { describe, expect, it } from 'vitest';

import {
  SEARCH_OVERLAY_PARAM,
  SEARCH_OVERLAY_QUERY_PARAM,
  SEARCH_OVERLAY_TAB_PARAM,
  SEARCH_OVERLAY_VALUE,
  parseSearchOverlayRoute,
  searchOverlayCloseFallbackHref,
  searchOverlayHref,
} from './search-overlay-route';

describe('search overlay route', () => {
  it('keeps overlay state off the catalog q contract', () => {
    const href = searchOverlayHref(
      '/works',
      { category: '11111111-1111-4111-8111-111111111111', q: 'catalog' },
      { query: 'vex', tab: 'authors' },
    );
    expect(href).toBe(
      '/works?category=11111111-1111-4111-8111-111111111111&q=catalog&overlay=search&oq=vex&otab=authors',
    );
    expect(String(href)).not.toContain('oq=catalog');
  });

  it('opens with one overlay flag and omits the default tab', () => {
    expect(searchOverlayHref('/', {}, { query: '', tab: 'categories' })).toBe(
      '/?overlay=search',
    );
  });

  it('parses compatibility /search?q= without a second implementation', () => {
    expect(parseSearchOverlayRoute('/search', { q: 'dali' })).toEqual({
      open: true,
      query: 'dali',
      tab: 'categories',
      compatibilityRoute: true,
    });
  });

  it('strips overlay params for a normal-page close fallback', () => {
    expect(
      searchOverlayCloseFallbackHref('/works', {
        category: '11111111-1111-4111-8111-111111111111',
        [SEARCH_OVERLAY_PARAM]: SEARCH_OVERLAY_VALUE,
        [SEARCH_OVERLAY_QUERY_PARAM]: 'vex',
        [SEARCH_OVERLAY_TAB_PARAM]: 'works',
      }),
    ).toBe('/works?category=11111111-1111-4111-8111-111111111111');
  });

  it('falls back from a dedicated /search URL to Home', () => {
    expect(searchOverlayCloseFallbackHref('/search', { q: 'vex' })).toBe('/');
  });
});

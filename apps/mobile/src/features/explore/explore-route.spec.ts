import { describe, expect, it } from 'vitest';
import {
  closeExploreSearch,
  exploreHref,
  exploreParams,
  legacyExploreHref,
  parseExploreRoute,
} from './explore-route';
const category = '11111111-1111-4111-8111-111111111111';
describe('Explore route compatibility', () => {
  it.each([
    [
      'works',
      { q: 'glass', category, material: 'Glass', sort: 'oldest' },
      'works',
    ],
    [
      'authors',
      { q: 'maker', tag: 'Ceramics', city: 'Minsk', sort: 'name' },
      'authors',
    ],
    ['search', { q: 'glass', otab: 'works' }, 'works'],
    ['search', { q: 'maker', otab: 'authors' }, 'authors'],
    ['search', {}, 'categories'],
  ] as const)(
    'preserves supported params from /%s',
    (path, params, section) => {
      const href = legacyExploreHref(path, params);
      const parsed = parseExploreRoute(
        Object.fromEntries(new URL(href, 'https://test.local').searchParams),
      );
      expect(parsed.section).toBe(section);
      expect(parsed.searchOpen).toBe(path === 'search' || 'q' in params);
      if ('q' in params) expect(parsed[section].q).toBe(params.q);
      if (section === 'works' && 'category' in params)
        expect(parsed.works).toEqual(params);
      if (section === 'authors' && 'city' in params)
        expect(parsed.authors).toEqual(params);
    },
  );
  it('preserves legacy overlay params through the catalog alias without mixing its query', () => {
    const href = legacyExploreHref('works', {
      q: 'catalog',
      material: 'Clay',
      overlay: 'search',
      oq: 'maker',
      otab: 'authors',
    });
    const params = new URL(href, 'https://test.local').searchParams;
    expect(params.get('q')).toBe('catalog');
    expect(params.get('material')).toBe('Clay');
    expect(params.get('oq')).toBe('maker');
    expect(params.get('otab')).toBe('authors');
  });
  it('validates identifiers, bounds text, sorts and ignores unrelated or commerce params', () => {
    const state = parseExploreRoute({
      section: 'invalid',
      q: '  glass  ',
      category: 'invalid',
      sort: 'price',
      price: '100',
      material: 'x'.repeat(81),
      token: 'unrelated',
    });
    expect(state.section).toBe('works');
    expect(state.works).toEqual({ q: 'glass', sort: 'newest' });
    expect(state.authors).toEqual({ sort: 'added' });
    expect(exploreHref(state)).toBe(
      '/explore?section=works&q=glass&sort=newest',
    );
  });
  it.each(['works', 'authors', 'categories'] as const)(
    'X clears only the %s query and closes search',
    (section) => {
      const state = {
        ...parseExploreRoute({
          section,
          search: '1',
          q: 'glass',
          category,
          material: 'Clay',
          city: 'Minsk',
          tag: 'Art',
          sort: section === 'authors' ? 'name' : 'oldest',
        }),
        authors: { q: 'maker', city: 'Minsk', sort: 'name' as const },
      };
      const closed = closeExploreSearch(state);
      expect(closed.section).toBe(section);
      expect(closed.searchOpen).toBe(false);
      expect(closed[section]).toEqual({ ...state[section], q: undefined });
      if (section !== 'authors') expect(closed.authors).toEqual(state.authors);
      expect(exploreParams(closed).q).toBeUndefined();
      expect(
        parseExploreRoute(exploreParams(closed))[section].q,
      ).toBeUndefined();
    },
  );
});

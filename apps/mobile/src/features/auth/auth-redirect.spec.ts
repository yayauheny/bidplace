import { describe, expect, it } from 'vitest';

import {
  getProtectedRedirect,
  getRouteSearchRedirect,
  getSafeRedirect,
} from './auth-redirect';

describe('auth redirects', () => {
  it('preserves an internal protected destination and its query parameters', () => {
    expect(
      getProtectedRedirect(
        '/seller/work/123/edit',
        { id: '123', step: 'story', tab: 'details' },
        ['id'],
      ),
    ).toBe('/seller/work/123/edit?step=story&tab=details');
  });

  it('keeps the current query for return links without duplicating dynamic segments', () => {
    expect(
      getRouteSearchRedirect('/works', ['(public)', 'works'], {
        tab: 'authors',
        q: 'керамика',
      }),
    ).toBe(
      '/works?tab=authors&q=%D0%BA%D0%B5%D1%80%D0%B0%D0%BC%D0%B8%D0%BA%D0%B0',
    );
    expect(
      getRouteSearchRedirect('/seller/vex', ['(public)', 'seller', '[slug]'], {
        slug: 'vex',
        sort: 'popular',
      }),
    ).toBe('/seller/vex?sort=popular');
    expect(getRouteSearchRedirect('/search', ['(public)', 'search'], {})).toBe(
      '/search',
    );
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    'javascript:alert(1)',
    'data:text/html,test',
    '/login?redirectTo=/seller/work/123/edit',
    '/register',
    '/verify-email?redirectTo=/profile',
  ])('rejects unsafe or auth-loop redirects: %s', (redirectTo) => {
    expect(getSafeRedirect(redirectTo)).toBe('/');
  });
});

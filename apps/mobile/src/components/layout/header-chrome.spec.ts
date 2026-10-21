import { describe, expect, it } from 'vitest';

import {
  getMobileCreateHref,
  getProfileHref,
  hasDesktopNavigation,
} from './header-chrome';

describe('header-chrome', () => {
  it('computes mobile create href (login vs profile)', () => {
    const loginHref = getMobileCreateHref({
      isAuthenticated: false,
      sellerStatus: null,
      returnPath: '/works',
    });
    expect(typeof loginHref).toBe('object');
    if (typeof loginHref === 'object' && loginHref && 'pathname' in loginHref) {
      expect((loginHref as { pathname: string }).pathname).toBe('/login');
      expect(
        (loginHref as { pathname: string; params: { redirectTo: string } })
          .params.redirectTo,
      ).toBe('/works');
    }

    expect(
      getMobileCreateHref({
        isAuthenticated: true,
        sellerStatus: 'APPROVED',
      }),
    ).toBe('/products/new');

    expect(
      getMobileCreateHref({
        isAuthenticated: true,
        sellerStatus: 'REJECTED',
      }),
    ).toBe('/profile');
  });
});

describe('shared public navigation', () => {
  it.each([
    ['web', 1023, true, false],
    ['web', 1024, true, true],
    ['web', 1800, true, true],
    ['ios', 1366, true, false],
    ['web', 1440, false, false],
  ] as const)(
    'selects desktop chrome for %s at %ipx, public=%s',
    (platform, width, publicRoute, expected) => {
      expect(hasDesktopNavigation(platform, width, publicRoute)).toBe(expected);
    },
  );

  it.each([
    [false, false, '/', '/login'],
    [
      false,
      false,
      '/seller/vex',
      { pathname: '/login', params: { redirectTo: '/seller/vex' } },
    ],
    [false, true, '/works', '/account'],
    [true, true, '/works', '/admin'],
  ] as const)(
    'preserves profile destination for admin=%s authenticated=%s',
    (isAdmin, isAuthenticated, returnPath, expected) => {
      expect(getProfileHref({ isAdmin, isAuthenticated, returnPath })).toEqual(
        expected,
      );
    },
  );
});

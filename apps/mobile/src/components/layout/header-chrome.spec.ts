import { describe, expect, it } from 'vitest';

import { getMobileCreateHref } from './header-chrome';

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

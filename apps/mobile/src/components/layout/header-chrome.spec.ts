import { legalDocumentIdSchema } from '@bidplace/contracts';
import { footerLegalLinks, footerSupportLinks } from './footer-links';
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
    { status: null, destination: '/profile' },
    { status: 'PENDING_REVIEW', destination: '/profile' },
    { status: 'APPROVED', destination: '/products/new' },
  ] as const)('keeps author onboarding separate from creation for $status', ({ status, destination }) => {
    expect(getMobileCreateHref({ isAuthenticated: true, sellerStatus: status, returnPath: '/works' })).toBe(destination);
    expect(getMobileCreateHref({ isAuthenticated: true, sellerStatus: null, returnPath: '/profile' })).toBe('/profile');
    expect(getProfileHref({ isAdmin: false, isAuthenticated: true, returnPath: '/works' })).toBe('/account');
  });

  it('preserves the requested destination for guest onboarding and returns admins to their cabinet', () => {
    expect(getMobileCreateHref({ isAuthenticated: false, sellerStatus: null, returnPath: '/profile' })).toEqual({ pathname: '/login', params: { redirectTo: '/profile' } });
    expect(getMobileCreateHref({ isAuthenticated: false, sellerStatus: null, returnPath: '/works' })).toEqual({ pathname: '/login', params: { redirectTo: '/works' } });
    expect(getProfileHref({ isAdmin: true, isAuthenticated: true, returnPath: '/works' })).toBe('/admin');
  });

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

describe('footer legal destinations', () => {
  it('keeps all existing MVP documents reachable without commerce placeholders', () => {
    const ids = [...footerLegalLinks, ...footerSupportLinks].map((item) =>
      item.href.replace('/legal/', ''),
    );
    expect(new Set(ids)).toEqual(new Set(legalDocumentIdSchema.options));
  });
});

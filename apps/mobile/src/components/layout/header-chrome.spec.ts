import { describe, expect, it, vi } from 'vitest';

import {
  canShowDesktopCreateListing,
  getHeaderSearchPlaceholder,
  getMobileCreateHref,
  getDiscoveryLabel,
  isAuthorsRoute,
  logoutAndGoHome,
} from './header-chrome';
import type { SellerStatus } from '@bidplace/contracts';

describe('header-chrome', () => {
  it('detects authors routes', () => {
    expect(isAuthorsRoute('/authors')).toBe(true);
    expect(isAuthorsRoute('/authors/abc')).toBe(true);
    expect(isAuthorsRoute('/works')).toBe(false);
    expect(isAuthorsRoute('/')).toBe(false);
  });

  it('computes discovery label', () => {
    expect(getDiscoveryLabel('/authors')).toBe('Авторы');
    expect(getDiscoveryLabel('/works')).toBe('Работы');
  });

  it('computes search placeholder for header chrome', () => {
    expect(getHeaderSearchPlaceholder('/works')).toBe(
      'Найти работу или автора',
    );
    expect(getHeaderSearchPlaceholder('/authors/some')).toBe(
      'Найти работу или автора',
    );
    expect(getHeaderSearchPlaceholder('/')).toBe('Найти предмет или автора');
  });

  it('controls desktop create button visibility', () => {
    expect(
      canShowDesktopCreateListing({ isAdmin: true, sellerStatus: 'APPROVED' }),
    ).toBe(false);
    expect(
      canShowDesktopCreateListing({
        isAdmin: false,
        sellerStatus: 'APPROVED',
      }),
    ).toBe(true);
    expect(
      canShowDesktopCreateListing({
        isAdmin: false,
        sellerStatus: 'PENDING_REVIEW' as SellerStatus,
      }),
    ).toBe(false);
  });

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
        sellerStatus: 'REJECTED' as SellerStatus,
      }),
    ).toBe('/profile');
  });

  it('logs out then replaces home', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const replace = vi.fn();
    await logoutAndGoHome({ logout }, { replace });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/');
  });
});


import { describe, expect, it } from 'vitest';

import { getProtectedRedirect, getSafeRedirect } from './auth-redirect';

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

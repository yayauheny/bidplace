import { describe, expect, it } from 'vitest';

import { getProtectedRedirect, getSafeRedirect } from './auth-redirect';
import {
  isEmailVerificationCode,
  normalizeEmailVerificationCode,
  resolveProtectedRouteAccess,
  verificationDestination,
} from './author-email-verification';

describe('Author email verification gate', () => {
  it('sends an authenticated unverified seller route to verification with its safe destination', () => {
    const redirectTo = getProtectedRedirect('/profile', { step: '3' }, []);
    expect(
      resolveProtectedRouteAccess({
        isAuthenticated: true,
        emailVerifiedAt: null,
        requireVerifiedEmail: true,
      }),
    ).toBe('verify-email');
    expect(redirectTo).toBe('/profile?step=3');
  });

  it('allows verified seller routes and every public route without the verification requirement', () => {
    expect(
      resolveProtectedRouteAccess({
        isAuthenticated: true,
        emailVerifiedAt: '2026-09-26T10:00:00.000Z',
        requireVerifiedEmail: true,
      }),
    ).toBe('allow');
    expect(
      resolveProtectedRouteAccess({
        isAuthenticated: true,
        emailVerifiedAt: null,
        requireVerifiedEmail: false,
      }),
    ).toBe('allow');
  });

  it('rejects unsafe verification return targets', () => {
    expect(getSafeRedirect('https://evil.example/profile')).toBe('/');
  });
});

describe('email verification destination', () => {
  it('accepts only a six-digit code and returns a destination only after verification', () => {
    expect(normalizeEmailVerificationCode('1a2b34567')).toBe('123456');
    expect(isEmailVerificationCode('12345')).toBe(false);
    expect(isEmailVerificationCode('123456')).toBe(true);
    expect(verificationDestination(true, '/products/new')).toBe('/products/new');
    expect(verificationDestination(false, '/profile')).toBeNull();
  });
});

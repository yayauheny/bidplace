import { describe, expect, it, vi } from 'vitest';

import { getProtectedRedirect, getSafeRedirect } from './auth-redirect';
import {
  emailVerificationRequestErrorMessage,
  isEmailVerificationCode,
  normalizeEmailVerificationCode,
  resolveProtectedRouteAccess,
  verificationDestination,
  verifyEmailAndRefresh,
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

describe('email verification form behavior', () => {
  it('normalizes six-digit code input and refuses an invalid code before calling the API', async () => {
    const verify = vi.fn();
    const refreshSession = vi.fn();
    expect(normalizeEmailVerificationCode('1a2b34567')).toBe('123456');
    expect(isEmailVerificationCode('12345')).toBe(false);
    await expect(
      verifyEmailAndRefresh({ code: '12345', verify, refreshSession }),
    ).resolves.toBe('invalid-code');
    expect(verify).not.toHaveBeenCalled();
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('verifies, refreshes the canonical session, and returns only after refreshed verification', async () => {
    const verify = vi.fn().mockResolvedValue(undefined);
    const refreshSession = vi
      .fn()
      .mockResolvedValue({ emailVerifiedAt: '2026-09-26T10:00:00.000Z' });
    await expect(
      verifyEmailAndRefresh({ code: '123456', verify, refreshSession }),
    ).resolves.toBe('verified');
    expect(verify).toHaveBeenCalledWith('123456');
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(verificationDestination(true, '/products/new')).toBe('/products/new');
  });

  it('does not navigate when the refreshed canonical session remains unverified', async () => {
    await expect(
      verifyEmailAndRefresh({
        code: '123456',
        verify: vi.fn().mockResolvedValue(undefined),
        refreshSession: vi.fn().mockResolvedValue({ emailVerifiedAt: null }),
      }),
    ).resolves.toBe('not-verified');
    expect(verificationDestination(false, '/profile')).toBeNull();
  });

  it('shows resend cooldown as a friendly message', () => {
    expect(emailVerificationRequestErrorMessage(409, 'fallback')).toBe(
      'Код уже отправлен. Попробуйте запросить новый немного позже.',
    );
  });
});

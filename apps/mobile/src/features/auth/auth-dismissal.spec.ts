import { describe, expect, it } from 'vitest';

import {
  authLeaveDestination,
  authNavigationDismissal,
  authNavigationTarget,
  registerSubmission,
} from './auth-dismissal';
import { maskEmail } from './mask-email';
import { confirmedResendDeadline, resendRemainingSeconds } from './resend-deadline';

describe('auth sheet dismissal', () => {
  it('allows movement between auth steps and confirms a dirty exit', () => {
    expect(authNavigationDismissal({
      dirty: true,
      busy: false,
      targetRoute: 'register',
    })).toBe('allow');
    expect(authNavigationDismissal({
      dirty: true,
      busy: true,
      targetRoute: undefined,
    })).toBe('keep');
    expect(authNavigationDismissal({
      dirty: true,
      busy: false,
      targetRoute: undefined,
    })).toBe('confirm');
    expect(authNavigationTarget({ payload: { name: '(auth)', params: { screen: 'login' } } })).toBe('login');
  });

  it('returns only a public page when the saved destination is protected', () => {
    expect(authLeaveDestination('/works/public-work')).toBe('/works/public-work');
    expect(authLeaveDestination('/profile')).toBe('/');
  });
});

describe('masked recovery address', () => {
  it('masks the middle of the entered address, including a short local part', () => {
    expect(maskEmail('author@example.com')).toBe('a***r@example.com');
    expect(maskEmail('ab@example.com')).toBe('a***@example.com');
    expect(maskEmail('not-an-address')).toBe('not-an-address');
  });
});

describe('verification resend deadline', () => {
  it('counts from a confirmed response and reaches zero without sending again', () => {
    const now = 1_000;
    const deadline = confirmedResendDeadline(now);
    expect(resendRemainingSeconds(deadline, now)).toBe(60);
    expect(resendRemainingSeconds(deadline, now + 60_000)).toBe(0);
    expect(resendRemainingSeconds(null, now)).toBe(0);
  });
});

describe('registration request', () => {
  it('drops the repeated password before the API call', () => {
    expect(registerSubmission({
      email: 'author@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      displayName: 'Автор',
      phone: null,
    })).toEqual({
      email: 'author@example.com',
      password: 'password123',
      displayName: 'Автор',
      phone: null,
    });
  });
});

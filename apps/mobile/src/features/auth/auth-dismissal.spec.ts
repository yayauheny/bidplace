import { describe, expect, it } from 'vitest';

import {
  AUTH_BROWSER_BACK_STEPS,
  authHistoryGuardState,
  authLeaveCommit,
  authLeaveDestination,
  authNavigationDismissal,
  authNavigationTarget,
  isAuthHistoryGuard,
  registerSubmission,
} from './auth-dismissal';
import { verificationStatusCopy } from './verify-email-copy';
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
    expect(authNavigationDismissal({
      dirty: true,
      busy: true,
      targetRoute: undefined,
      released: true,
    })).toBe('allow');
    expect(authNavigationTarget({ payload: { name: '(auth)', params: { screen: 'login' } } })).toBe('login');
  });

  it('leaves through one confirmed destination', () => {
    expect(authLeaveCommit({ hasNavigationAction: true, browserBack: true })).toBe('dispatch');
    expect(authLeaveCommit({ hasNavigationAction: false, browserBack: true })).toBe('history');
    expect(authLeaveCommit({ hasNavigationAction: false, browserBack: false })).toBe('replace');
    expect(AUTH_BROWSER_BACK_STEPS).toBe(-2);
    const state = authHistoryGuardState({ id: 'login' }, 'sheet');
    expect(isAuthHistoryGuard(state, 'sheet')).toBe(true);
    expect(isAuthHistoryGuard({ id: 'login' }, 'sheet')).toBe(false);
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

describe('verification status copy', () => {
  it('does not claim the code arrived before a send is accepted', () => {
    expect(verificationStatusCopy({
      email: 'author@example.com',
      sendAccepted: false,
    })).not.toContain('пришел');
    expect(verificationStatusCopy({
      email: 'author@example.com',
      sendAccepted: true,
    })).toContain('принята');
    expect(verificationStatusCopy({
      email: 'author@example.com',
      sendAccepted: true,
    })).not.toContain('пришел');
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

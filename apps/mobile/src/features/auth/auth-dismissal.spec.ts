import { describe, expect, it } from 'vitest';

import {
  authBrowserLeaveTarget,
  authLeaveCommit,
  canDismissAuthToOrigin,
  authNavigationDismissal,
  authNavigationTarget,
  authRouteFromLocation,
  registerSubmission,
} from './auth-dismissal';
import { verificationReasonCopy, verificationSendLabel, verificationStatusCopy } from './verify-email-copy';
import { maskEmail } from './mask-email';

describe('auth sheet dismissal', () => {
  it('confirms only a dirty registration exit and lets other filled forms leave', () => {
    expect(authNavigationDismissal({
      dirty: true,
      busy: false,
      protectEnteredData: true,
      targetRoute: 'login',
    })).toBe('allow');
    expect(authNavigationDismissal({
      dirty: true,
      busy: true,
      protectEnteredData: true,
      targetRoute: undefined,
    })).toBe('keep');
    expect(authNavigationDismissal({
      dirty: true,
      busy: false,
      protectEnteredData: true,
      targetRoute: undefined,
    })).toBe('confirm');
    expect(authNavigationDismissal({
      dirty: false,
      busy: false,
      protectEnteredData: true,
      targetRoute: undefined,
    })).toBe('allow');
    expect(authNavigationDismissal({
      dirty: true,
      busy: false,
      protectEnteredData: false,
      targetRoute: undefined,
    })).toBe('allow');
    expect(authNavigationDismissal({
      dirty: true,
      busy: true,
      protectEnteredData: false,
      targetRoute: undefined,
    })).toBe('keep');
    expect(authNavigationDismissal({
      dirty: true,
      busy: true,
      protectEnteredData: true,
      targetRoute: undefined,
      released: true,
    })).toBe('allow');
    expect(authNavigationTarget({ payload: { name: '(auth)', params: { screen: 'login' } } })).toBe('login');
  });

  it('treats browser back to another auth step as movement and a reset away as an exit', () => {
    expect(authRouteFromLocation('/register?redirectTo=/profile')).toBe('register');
    expect(authRouteFromLocation('/')).toBeUndefined();
    expect(authNavigationTarget({
      type: 'RESET',
      payload: {
        index: 1,
        routes: [
          { name: 'index' },
          { name: '(auth)', state: { index: 0, routes: [{ name: 'login', path: '/login' }] } },
        ],
      },
    })).toBe('login');
    expect(authNavigationDismissal({
      dirty: true,
      busy: false,
      protectEnteredData: true,
      targetRoute: authNavigationTarget({
        type: 'RESET',
        payload: { index: 0, routes: [{ name: 'index', path: '/' }] },
      }),
    })).toBe('confirm');
    expect(authNavigationDismissal({
      dirty: true,
      busy: false,
      protectEnteredData: false,
      targetRoute: authNavigationTarget({
        type: 'RESET',
        payload: { index: 0, routes: [{ name: 'index', path: '/' }] },
      }),
    })).toBe('allow');
    expect(authNavigationDismissal({
      dirty: true,
      busy: true,
      protectEnteredData: true,
      targetRoute: 'register',
    })).toBe('allow');
    expect(authLeaveCommit({ hasNavigationAction: true })).toBe('dispatch');
    expect(authLeaveCommit({ hasNavigationAction: false })).toBe('replace');
    expect(authBrowserLeaveTarget('/works/public-work')).toBe('/works/public-work');
    expect(authBrowserLeaveTarget('/login')).toBe('/');
  });

  it.each(['(public)', 'index'])(
    'dismisses the entire auth flow to the saved %s route without interpreting URL params',
    (origin) => {
      expect(
        canDismissAuthToOrigin({
          index: 1,
          routes: [
            { name: origin },
            {
              name: '(auth)',
              state: {
                index: 2,
                routes: [
                  { name: 'login' },
                  { name: 'forgot-password' },
                  { name: 'register' },
                ],
              },
            },
          ],
        }),
      ).toBe(true);
    },
  );

  it.each([
    '(account)',
    '(seller)',
    '(admin)',
    'verify-email',
    '(auth)',
    undefined,
  ])('uses the safe fallback instead of returning to %s', (origin) => {
    expect(
      canDismissAuthToOrigin({
        index: 1,
        routes: [{ name: origin }, { name: '(auth)' }],
      }),
    ).toBe(false);
  });

  it('uses the safe fallback without an origin or outside the auth group', () => {
    expect(canDismissAuthToOrigin(undefined)).toBe(false);
    expect(canDismissAuthToOrigin({})).toBe(false);
    expect(
      canDismissAuthToOrigin({ index: 0, routes: [{ name: '(auth)' }] }),
    ).toBe(false);
    expect(
      canDismissAuthToOrigin({
        index: 1,
        routes: [{ name: '(public)' }, { name: 'verify-email' }],
      }),
    ).toBe(false);
  });
});

describe('masked recovery address', () => {
  it('masks the middle of the entered address, including a short local part', () => {
    expect(maskEmail('author@example.com')).toBe('a***r@example.com');
    expect(maskEmail('ab@example.com')).toBe('a***@example.com');
    expect(maskEmail('not-an-address')).toBe('not-an-address');
  });
});

describe('verification send label', () => {
  it('uses the server wait and does not invent a 60 second countdown', () => {
    expect(verificationSendLabel({
      sending: false,
      sendStatus: 'accepted',
      resendSeconds: 120,
      quotaSeconds: 0,
    })).toBe('Новый код через 120 сек');
    expect(verificationSendLabel({
      sending: false,
      sendStatus: 'accepted',
      resendSeconds: 0,
      quotaSeconds: 45,
    })).toBe('Новый код через 45 сек');
    expect(verificationSendLabel({
      sending: false,
      sendStatus: 'accepted',
      resendSeconds: 0,
      quotaSeconds: 0,
    })).toBe('Отправить новый код');
    expect(verificationSendLabel({
      sending: false,
      sendStatus: 'none',
      resendSeconds: 0,
      quotaSeconds: 0,
    })).toBe('Отправить код');
    expect(verificationSendLabel({
      sending: true,
      sendStatus: 'none',
      resendSeconds: 0,
      quotaSeconds: 0,
    })).toBe('Отправляем запрос…');
  });
});

describe('verification status copy', () => {
  it('does not treat an accepted request as proof the message was delivered', () => {
    const pending = verificationStatusCopy({
      email: 'author@example.com',
      sendStatus: 'none',
      verified: false,
    });
    const accepted = verificationStatusCopy({
      email: 'author@example.com',
      sendStatus: 'accepted',
      verified: false,
    });
    expect(pending).toBe('Код ещё не отправлен.');
    expect(accepted).toContain('a***r@example.com');
    expect(accepted).toContain('Почтовый сервер принял письмо с кодом');
    expect(accepted).toContain('Доставка в почтовый ящик не подтверждена');
    expect(accepted).not.toContain('попытаемся');
    expect(accepted).not.toContain('Код отправлен');
    expect(accepted).not.toContain('пришел');
    expect(verificationStatusCopy({
      email: 'author@example.com',
      sendStatus: 'unknown',
      verified: false,
    })).toContain('не отправит ещё одно письмо');
    expect(verificationStatusCopy({
      email: 'author@example.com',
      sendStatus: 'rejected',
      verified: false,
    })).toBe('Запрос отклонён. Код не отправлялся.');
    expect(verificationStatusCopy({
      email: 'author@example.com',
      sendStatus: 'accepted',
      verified: true,
    })).toBe('Адрес уже подтверждён.');
    expect(verificationReasonCopy({ kind: 'otp-invalid' }, { resend: 0, pause: 0, quota: 0 }))
      .toBe('Код не подошёл. Измените его, затем повторите проверку.');
    expect(verificationReasonCopy({ kind: 'cooldown' }, { resend: 12, pause: 0, quota: 0 }))
      .toBe('Новый код можно запросить через 12 с.');
    expect(verificationReasonCopy({ kind: 'code-invalidated' }, { resend: 0, pause: 0, quota: 0 }))
      .toBe('Прежний код больше не действует. Письмо не отправлено.');
  });
});

describe('registration request', () => {
  it('drops the repeated password before the API call', () => {
    expect(registerSubmission({
      email: 'author@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      slug: 'author',
      agreementAccepted: true,
      privacyAcknowledged: true,
      dataConsentGiven: true,
      age18Confirmed: true,
    })).toEqual({
      email: 'author@example.com',
      password: 'password123',
      slug: 'author',
      legal: {
        agreement: { confirmed: true },
        privacy: { confirmed: true },
        dataConsent: { confirmed: true },
        age18Confirmed: true,
      },
    });
  });
});

import { describe, expect, it } from 'vitest';

import { newAccountSlugSchema, registerRequestSchema } from '@bidplace/contracts';

import { registerSubmission } from './auth-dismissal';
import { loginFormSchema, registerFormSchema, resetPasswordFormSchema } from './schemas';
import {
  nicknameSuggestionGenerator,
  nicknameSuggestionSpaceSize,
} from './unique-names-generator-adapter';

describe('login form validation', () => {
  it('uses Russian validation copy for an invalid email', () => {
    const result = loginFormSchema.safeParse({ email: 'invalid', password: 'secret' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toEqual(['Введите корректный email']);
    }
  });

  it('requires a password with Russian validation copy', () => {
    const result = loginFormSchema.safeParse({ email: 'user@example.com', password: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toEqual(['Введите пароль']);
    }
  });
});

describe('registration form validation', () => {
  it('generates and refreshes exactly three distinct valid neutral nicknames', () => {
    const initial = nicknameSuggestionGenerator.generate();
    const refreshed = nicknameSuggestionGenerator.generate(initial);

    for (const suggestions of [initial, refreshed]) {
      expect(suggestions).toHaveLength(3);
      expect(new Set(suggestions).size).toBe(3);
      expect(
        suggestions.every((suggestion) =>
          newAccountSlugSchema.safeParse(suggestion).success,
        ),
      ).toBe(true);
      expect(
        suggestions.every((suggestion) =>
          /^[a-z]+\d{3}$/.test(suggestion),
        ),
      ).toBe(true);
    }
    expect(refreshed.every((suggestion) => !initial.includes(suggestion))).toBe(
      true,
    );
    expect(nicknameSuggestionSpaceSize).toBe(49_500);
  });

  it.each([2, 3, 20, 21])('uses the shared new-nickname limit for %i characters', (length) => {
    const values = {
      email: 'author@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      slug: 'a'.repeat(length),
      agreementAccepted: true,
      privacyAcknowledged: true,
      dataConsentGiven: true,
      age18Confirmed: true,
    };
    const valid = length >= 3 && length <= 20;
    const result = registerFormSchema.safeParse(values);
    expect(result.success).toBe(valid);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.slug).toEqual(['Никнейм должен содержать от 3 до 20 символов']);
    }
  });

  it.each([
    [undefined, undefined],
    [null, null],
    ['', null],
    [' \t\n ', null],
    ['  +375291234567  ', '+375291234567'],
  ])('normalizes optional phone %j to %j before the API request', (phone, expected) => {
    const registration = registerFormSchema.parse({
      email: 'author@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      slug: 'author',
      agreementAccepted: true,
      privacyAcknowledged: true,
      dataConsentGiven: true,
      age18Confirmed: true,
      phone,
    });

    expect(registration.phone).toBe(expected);
    const submission = registerSubmission(registration, 'portfolio-legal-2026-10-12');
    expect(submission).not.toHaveProperty('confirmPassword');
    expect(submission).not.toHaveProperty('turnstileToken');
    expect(registerRequestSchema.safeParse(submission).success).toBe(false);
    expect(
      registerRequestSchema.safeParse({
        ...submission,
        turnstileToken: 'synthetic-turnstile-proof',
      }).success,
    ).toBe(true);
  });

  it.each(['agreementAccepted', 'privacyAcknowledged', 'dataConsentGiven', 'age18Confirmed'] as const)(
    'requires independent confirmation %s',
    (field) => {
      const result = registerFormSchema.safeParse({
        email: 'author@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        slug: 'author',
        agreementAccepted: true,
        privacyAcknowledged: true,
        dataConsentGiven: true,
        age18Confirmed: true,
        [field]: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.flatten().fieldErrors[field]).toBeTruthy();
    },
  );

  it('keeps a repeated password in the form and out of the request', () => {
    const mismatch = registerFormSchema.safeParse({
      email: 'author@example.com',
      password: 'password123',
      confirmPassword: 'password1234',
      slug: 'author',
      agreementAccepted: true,
      privacyAcknowledged: true,
      dataConsentGiven: true,
      age18Confirmed: true,
    });
    expect(mismatch.success).toBe(false);
  });
});

describe('reset password form validation', () => {
  it('requires a password confirmation match', () => {
    const result = resetPasswordFormSchema.safeParse({
      password: 'password123',
      confirmPassword: 'different',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toEqual([
        'Пароли не совпадают',
      ]);
    }
  });
});

import { describe, expect, it } from 'vitest';

import { registerRequestSchema } from '@bidplace/contracts';

import { registerSubmission } from './auth-dismissal';
import { loginFormSchema, registerFormSchema, resetPasswordFormSchema } from './schemas';

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
  it.each([2, 3, 20, 21])('uses the shared new-nickname limit for %i characters', (length) => {
    const values = {
      email: 'author@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      slug: 'a'.repeat(length),
      rulesAccepted: true,
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
      rulesAccepted: true,
      phone,
    });

    expect(registration.phone).toBe(expected);
    expect(registerRequestSchema.safeParse(registerSubmission(registration)).success).toBe(true);
    expect(registerSubmission(registration)).not.toHaveProperty('confirmPassword');
  });

  it('keeps a repeated password in the form and out of the request', () => {
    const mismatch = registerFormSchema.safeParse({
      email: 'author@example.com',
      password: 'password123',
      confirmPassword: 'password1234',
      slug: 'author',
      rulesAccepted: true,
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

import { describe, expect, it } from 'vitest';

import { registerRequestSchema } from '@bidplace/contracts';

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
      displayName: 'Автор',
      phone,
    });

    expect(registration.phone).toBe(expected);
    expect(registerRequestSchema.safeParse(registration).success).toBe(true);
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

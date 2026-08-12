import { describe, expect, it } from 'vitest';

import {
  getHandoffContactError,
  getPublicLinkError,
} from './profile-validation';

describe('seller profile field validation', () => {
  it.each([
    ['https://example.com/creator', undefined],
    ['https://t.me/creator_name', undefined],
    ['not a url', 'Введите корректный URL'],
    ['example.com/creator', 'Введите корректный URL'],
  ])('validates public URL values: %s', (value, expected) => {
    expect(getPublicLinkError(value)).toBe(expected);
  });

  it.each([
    ['TELEGRAM', '@creator_name', undefined],
    ['TELEGRAM', 'https://t.me/creator_name', undefined],
    [
      'TELEGRAM',
      'creator',
      'Введите Telegram @username или https://t.me/username',
    ],
    ['PHONE', '+375291234567', undefined],
    [
      'PHONE',
      '80291234567',
      'Введите телефон в международном формате, например +375291234567',
    ],
    ['INSTAGRAM', '@creator.name', undefined],
    ['INSTAGRAM', 'https://instagram.com/creator.name', undefined],
    [
      'INSTAGRAM',
      'creator.name',
      'Введите Instagram @username или https://instagram.com/username',
    ],
  ] as const)('validates %s handoff values: %s', (type, value, expected) => {
    expect(getHandoffContactError(type, value)).toBe(expected);
  });
});

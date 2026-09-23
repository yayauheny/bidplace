import { describe, expect, it } from 'vitest';

import { getProfileFieldErrors, getPublicLinkError } from './profile-validation';

describe('seller profile field validation', () => {
  it.each([
    ['https://example.com/creator', undefined],
    ['https://t.me/creator_name', undefined],
    ['http://example.com/creator', 'Введите HTTPS-ссылку, начиная с https://'],
    ['javascript:alert(1)', 'Введите HTTPS-ссылку, начиная с https://'],
    ['data:text/html,hi', 'Введите HTTPS-ссылку, начиная с https://'],
    ['file:///etc/passwd', 'Введите HTTPS-ссылку, начиная с https://'],
    ['not a url', 'Введите HTTPS-ссылку, начиная с https://'],
    ['example.com/creator', 'Введите HTTPS-ссылку, начиная с https://'],
  ])('validates public URL values: %s', (value, expected) => {
    expect(getPublicLinkError(value)).toBe(expected);
  });

  it('requires a non-blank city', () => {
    const valid = {
      city: 'Минск',
      socialLink: '',
      telegramUrl: '',
      instagramUrl: '',
      websiteUrl: '',
    };
    expect(getProfileFieldErrors(valid).city).toBeUndefined();
    expect(getProfileFieldErrors({ ...valid, city: '   ' }).city).toBe(
      'Укажите город',
    );
  });
});

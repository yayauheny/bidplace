import { describe, expect, it } from 'vitest';

import {
  getProfileFieldErrors,
  getPublicLinkError,
  profileDraftAllowsSave,
  profileDraftSchema,
} from './profile-validation';

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

  it('accepts empty public contacts and rejects invalid ones', () => {
    const valid = {
      city: 'Минск',
      socialLink: '',
      telegramUrl: '',
      instagramUrl: '',
      websiteUrl: '',
      publicEmail: '',
    };
    expect(getProfileFieldErrors(valid)).toEqual({});
    expect(getProfileFieldErrors({ ...valid, telegramUrl: '@abc' }).telegramUrl).toBe(
      'Введите Telegram username или HTTPS-ссылку',
    );
    expect(getProfileFieldErrors({ ...valid, telegramUrl: '@maker_art' }).telegramUrl).toBeUndefined();
    expect(getProfileFieldErrors({ ...valid, instagramUrl: 'bad handle' }).instagramUrl).toBe(
      'Введите Instagram username или HTTPS-ссылку',
    );
    expect(getProfileFieldErrors({ ...valid, instagramUrl: '@maker.art' }).instagramUrl).toBeUndefined();
    expect(getProfileFieldErrors({ ...valid, websiteUrl: 'example.com' }).websiteUrl).toBe(
      'Введите HTTPS-ссылку, начиная с https://',
    );
    expect(getProfileFieldErrors({ ...valid, publicEmail: 'not-an-email' }).publicEmail).toBe(
      'Введите корректный email',
    );
    expect(getProfileFieldErrors({ ...valid, publicEmail: 'hello@example.com' }).publicEmail).toBeUndefined();
  });

  it('keeps raw draft text when the draft schema accepts it', () => {
    const parsed = profileDraftSchema.parse({
      slug: 'maker',
      fullName: 'Maker',
      discipline: 'Керамика',
      country: 'BY',
      city: 'Минск',
      practice: '',
      socialLink: '',
      telegramUrl: '@maker_art',
      instagramUrl: 'maker.art',
      websiteUrl: 'https://example.com/studio',
      publicEmail: 'Hello@Example.com',
      shortDescription: 'Практика',
    });
    expect(parsed.telegramUrl).toBe('@maker_art');
    expect(parsed.instagramUrl).toBe('maker.art');
    expect(parsed.publicEmail).toBe('Hello@Example.com');
  });

  it('accepts the raw snapshot that can be saved and rejects an invalid contact', () => {
    const draft = {
      slug: 'maker',
      fullName: 'Maker',
      discipline: '',
      country: 'BY',
      city: 'Минск',
      practice: '',
      socialLink: '',
      telegramUrl: '',
      instagramUrl: '',
      websiteUrl: '',
      publicEmail: '',
      shortDescription: '',
    };
    expect(profileDraftAllowsSave(draft)).toBe(true);
    expect(profileDraftAllowsSave({ ...draft, discipline: ' ', shortDescription: ' ' })).toBe(true);
    expect(profileDraftAllowsSave({ ...draft, telegramUrl: 'bad handle' })).toBe(false);
    expect(profileDraftAllowsSave({ ...draft, telegramUrl: '@maker_art' })).toBe(true);
    expect(profileDraftAllowsSave({ ...draft, city: '   ' })).toBe(false);
  });

  it('rejects a nickname outside the slug contract and keeps the typed text', () => {
    const draft = {
      slug: 'maker',
      fullName: 'Maker',
      discipline: '',
      country: 'BY',
      city: 'Минск',
      practice: '',
      socialLink: '',
      telegramUrl: '',
      instagramUrl: '',
      websiteUrl: '',
      publicEmail: '',
      shortDescription: '',
    };
    const message =
      'Используйте маленькие латинские буквы и цифры. Между ними можно поставить дефис или подчёркивание.';
    for (const slug of ['БЕ', 'BE', 'my--store']) {
      const parsed = profileDraftSchema.safeParse({ ...draft, slug });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toBe(message);
      }
      expect(profileDraftAllowsSave({ ...draft, slug })).toBe(false);
    }
    const cyrillic = profileDraftSchema.safeParse({ ...draft, slug: 'БЕ' });
    expect(cyrillic.success).toBe(false);
    expect(profileDraftAllowsSave({ ...draft, slug: 'my-store' })).toBe(true);
    expect(profileDraftAllowsSave({ ...draft, slug: 'my_store' })).toBe(true);
    const kept = profileDraftSchema.parse({ ...draft, slug: 'my-store' });
    expect(kept.slug).toBe('my-store');
  });
});

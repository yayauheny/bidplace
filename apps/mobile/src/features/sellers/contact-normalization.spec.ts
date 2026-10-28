import { describe, expect, it } from 'vitest';

import { normalizeInstagram, normalizeTelegram } from './contact-normalization';

describe('author contact normalization', () => {
  it.each([
    ['@maker.art', 'https://instagram.com/maker.art'],
    ['maker.art', 'https://instagram.com/maker.art'],
    ['https://www.instagram.com/maker.art/', 'https://instagram.com/maker.art'],
  ])('normalizes Instagram %s', (input, expected) => {
    expect(normalizeInstagram(input)).toBe(expected);
  });

  it.each([
    ['@maker_art', 'https://t.me/maker_art'],
    ['maker_art', 'https://t.me/maker_art'],
    ['https://t.me/maker_art/', 'https://t.me/maker_art'],
  ])('normalizes Telegram %s', (input, expected) => {
    expect(normalizeTelegram(input)).toBe(expected);
  });

  it('rejects noncanonical or invalid contact values', () => {
    expect(normalizeInstagram('http://instagram.com/maker')).toBeUndefined();
    expect(normalizeTelegram('@abc')).toBeUndefined();
    expect(normalizeTelegram('')).toBeNull();
  });
});

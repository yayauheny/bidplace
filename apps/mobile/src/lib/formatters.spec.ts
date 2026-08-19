import { describe, expect, it } from 'vitest';

import {
  formatCountdownHms,
  formatCurrencyAmount,
  formatDisplayPrice,
} from './formatters';

describe('currency formatters', () => {
  it.each([
    [10, '10\u00a0BYN'],
    [11.5, '11,5\u00a0BYN'],
    [11.55, '11,55\u00a0BYN'],
  ])('preserves the meaningful precision of %s', (value, expected) => {
    expect(formatDisplayPrice(value)).toBe(expected);
  });

  it('keeps two fractional digits in accounting-style amounts', () => {
    expect(formatCurrencyAmount(10)).toBe('10,00\u00a0BYN');
  });

  it('formats countdown into HH:MM:SS with leading zeros', () => {
    const now = 1_000_000;
    const endsAt = new Date(now + 3_661_000).toISOString(); // 3661s
    expect(formatCountdownHms(endsAt, now)).toBe('01:01:01');
  });

  it('clamps countdown at zero when endsAt is in the past', () => {
    const now = 1_000_000;
    const endsAt = new Date(now - 10_000).toISOString();
    expect(formatCountdownHms(endsAt, now)).toBe('00:00:00');
  });
});

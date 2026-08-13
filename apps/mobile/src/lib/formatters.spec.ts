import { describe, expect, it } from 'vitest';

import { formatCurrencyAmount, formatDisplayPrice } from './formatters';

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
});

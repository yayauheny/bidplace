import { describe, expect, it } from 'vitest';

import { bidIncrementForAmount, validateBidAmount } from './bid-validation';

describe('bid increment validation', () => {
  it.each([[0, 0.5], [24.5, 0.5], [25, 1], [100, 5], [500, 10], [1_000, 25]])('uses the documented increment for %s BYN', (amount, expected) => {
    expect(bidIncrementForAmount(amount)).toBe(expected);
  });

  it('accepts the current server minimum and valid multiples above it', () => {
    expect(validateBidAmount('25', 25)).toBeNull();
    expect(validateBidAmount('27', 25)).toBeNull();
  });

  it('rejects a malformed, stale or invalid-increment amount without claiming server authority', () => {
    expect(validateBidAmount('', 25)).toContain('Введите');
    expect(validateBidAmount('24.5', 25)).toContain('Минимальная');
    expect(validateBidAmount('25.5', 25)).toContain('увеличиваться');
    expect(validateBidAmount('30', null)).toContain('недоступна');
  });
});

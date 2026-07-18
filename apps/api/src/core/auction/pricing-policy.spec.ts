import { describe, expect, it } from 'vitest';

import { calculateBidStep, resolveSoftCloseEndsAt } from './pricing-policy';

describe('MVP BYN pricing', () => {
  it.each([[24.99, '0.5'], [25, '1'], [99.99, '1'], [100, '5'], [499.99, '5'], [500, '10'], [999.99, '10'], [1000, '25']])('selects the increment at %s', (price, expected) => expect(calculateBidStep(price).toString()).toBe(expected));
  it('extends at the inclusive 60-second boundary but caps extensions', () => {
    const original = new Date('2026-07-20T10:00:00.000Z');
    const endsAt = new Date('2026-07-20T10:09:00.000Z');
    const now = new Date('2026-07-20T10:08:00.000Z');
    expect(resolveSoftCloseEndsAt(endsAt, original, now, 60, 60, 600).toISOString()).toBe('2026-07-20T10:10:00.000Z');
  });
});

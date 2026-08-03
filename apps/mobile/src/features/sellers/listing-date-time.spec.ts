import { describe, expect, it } from 'vitest';

import { parseListingDateTime } from './listing-date-time';

describe('listing date-time parser', () => {
  it.each([
    '31.02.2026, 12:00',
    '31.04.2026, 12:00',
    '28.02.2026, 24:00',
    '28.02.2026, 12:60',
    'February 31, 2026 12:00',
  ])('rejects invalid calendar or time input: %s', (value) => {
    expect(parseListingDateTime(value)).toBeNull();
  });

  it('serializes a valid local date-time without changing its components', () => {
    expect(parseListingDateTime('28.02.2026, 12:00')).toBe(
      new Date(2026, 1, 28, 12, 0).toISOString(),
    );
  });

  it.each([
    '2026-02-31T12:00',
    '2026-02-31T12:00:00Z',
    '2026-02-31T12:00:00.000Z',
    '2026-02-31T12:00:00.000+03:00',
  ])('rejects impossible full ISO date-time: %s', (value) => {
    expect(parseListingDateTime(value)).toBeNull();
  });

  it('preserves valid ISO seconds, milliseconds and UTC offset', () => {
    expect(parseListingDateTime('2026-02-28T12:00:01.123Z')).toBe(
      '2026-02-28T12:00:01.123Z',
    );
  });
});

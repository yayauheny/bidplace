import { describe, expect, it } from 'vitest';

import { parseListingDateTime } from './listing-date-time';

describe('listing date-time parser', () => {
  it.each([
    '31.02.2026, 12:00',
    '31.04.2026, 12:00',
    '28.02.2026, 24:00',
    '28.02.2026, 12:60',
  ])('rejects invalid calendar or time input: %s', (value) => {
    expect(parseListingDateTime(value)).toBeNull();
  });

  it('serializes a valid local date-time without changing its components', () => {
    expect(parseListingDateTime('28.02.2026, 12:00')).toBe(
      new Date(2026, 1, 28, 12, 0).toISOString(),
    );
  });

  it('rejects an impossible ISO local date-time as well', () => {
    expect(parseListingDateTime('2026-02-31T12:00')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import { formatAchievementDate } from './achievement-date';

describe('formatAchievementDate', () => {
  it.each([
    ['2026-08-01T00:00:00.000Z', 'Август, 2026'],
    ['2016-12-31T23:00:00.000Z', 'Декабрь, 2016'],
  ])('formats %s without shifting its UTC month', (value, expected) => {
    expect(formatAchievementDate(value)).toBe(expected);
  });
});

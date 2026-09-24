import { describe, expect, it } from 'vitest';

import {
  formatAchievementDate,
  formatAuthorAchievementLabel,
} from './achievement-date';

describe('formatAchievementDate', () => {
  it.each([
    [{ year: 2026, month: 8, day: null }, 'Август, 2026'],
    [{ year: 2016, month: 12, day: null }, 'Декабрь, 2016'],
  ])('formats %o without fabricating a day', (value, expected) => {
    expect(formatAchievementDate(value)).toBe(expected);
  });

  it('keeps an author-provided day in the owner format', () => {
    expect(formatAchievementDate({ year: 2025, month: 3, day: 17 })).toContain('17');
  });
});

describe('formatAuthorAchievementLabel', () => {
  it.each([
    [{ year: 2026, month: 4, day: null }, '04.2026'],
    [{ year: 2016, month: 12, day: 31 }, '31.12.2016'],
  ])('uses a day only when the author provided one', (value, expected) => {
    expect(formatAuthorAchievementLabel(value)).toBe(expected);
  });
});

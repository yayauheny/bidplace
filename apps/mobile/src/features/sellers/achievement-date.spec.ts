import { describe, expect, it } from 'vitest';

import {
  formatAchievementDate,
  formatAuthorAchievementLabel,
} from './achievement-date';

describe('formatAchievementDate', () => {
  it.each([
    ['2026-08-01T00:00:00.000Z', 'Август, 2026'],
    ['2016-12-31T23:00:00.000Z', 'Декабрь, 2016'],
  ])('formats %s without shifting its UTC month', (value, expected) => {
    expect(formatAchievementDate(value)).toBe(expected);
  });
});

describe('formatAuthorAchievementLabel', () => {
  it.each([
    ['2026-04-01T00:00:00.000Z', '04.2026'],
    ['2016-12-31T23:00:00.000Z', '12.2016'],
  ])('uses the public MM.YYYY label from 621:19580', (value, expected) => {
    expect(formatAuthorAchievementLabel(value)).toBe(expected);
  });
});

import { describe, expect, it } from 'vitest';

import {
  achievementDateFieldErrors,
  formatAchievementDate,
  formatAuthorAchievementLabel,
  presentAchievementDateGroup,
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

describe('achievementDateFieldErrors', () => {
  it('maps text and fractional years onto the year control', () => {
    expect(achievementDateFieldErrors({ year: 'текст', month: '3', day: '' })).toEqual({
      year: 'Укажите год числом',
    });
    expect(achievementDateFieldErrors({ year: '2024.5', month: '3', day: '' })).toEqual({
      year: 'Укажите год целым числом',
    });
  });

  it('keeps month, impossible day, and leap-day results on their own controls', () => {
    expect(achievementDateFieldErrors({ year: '2024', month: '13', day: '' })).toEqual({
      month: 'Укажите месяц от 1 до 12',
    });
    expect(achievementDateFieldErrors({ year: '2023', month: '2', day: '29' })).toEqual({
      day: 'Укажите существующую дату',
    });
    expect(achievementDateFieldErrors({ year: '2024', month: '2', day: '29' })).toBeNull();
    expect(achievementDateFieldErrors({ year: '2024', month: '2', day: '' })).toBeNull();
  });

  it('reports every invalid date part together', () => {
    expect(achievementDateFieldErrors({ year: '1.5', month: '0', day: '32' })).toEqual({
      year: 'Укажите год целым числом',
      month: 'Укажите месяц от 1 до 12',
      day: 'Укажите день от 1 до 31',
    });
  });

  it('replaces a diagnostic server message for the date group', () => {
    expect(presentAchievementDateGroup('Expected number, received nan')).toBe(
      'Укажите существующую дату',
    );
    expect(presentAchievementDateGroup('Укажите существующую дату')).toBe(
      'Укажите существующую дату',
    );
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

import { describe, expect, it } from 'vitest';

import {
  parseAchievementDateInput,
  formatAchievementDate,
  formatAuthorAchievementLabel,
  presentAchievementDateGroup,
} from './achievement-date';

describe('formatAchievementDate', () => {
  it.each([
    [{ year: 2026, month: 8, day: null }, 'Август, 2026'],
    [{ year: 2016, month: 12, day: null }, 'Декабрь, 2016'],
    [{ year: 4, month: 2, day: null }, 'Февраль, 0004'],
  ])('formats %o without fabricating a day', (value, expected) => {
    expect(formatAchievementDate(value)).toBe(expected);
  });

  it('keeps an author-provided day in the owner format', () => {
    expect(formatAchievementDate({ year: 2025, month: 3, day: 17 })).toContain(
      '17',
    );
    expect(formatAchievementDate({ year: 4, month: 2, day: 29 })).toBe(
      '29 февраля 0004 г.',
    );
  });
});

it('renders undated historical achievements without crashing', () => {
  expect(formatAchievementDate(null)).toBe('Дата не указана');
  expect(formatAuthorAchievementLabel(null)).toBe('Дата не указана');
});

describe('parseAchievementDateInput', () => {
  it.each([
    ['03.2025', { year: 2025, month: 3, day: null }],
    [' 3.2025 ', { year: 2025, month: 3, day: null }],
    ['29.02.2024', { year: 2024, month: 2, day: 29 }],
    ['29.02.0004', { year: 4, month: 2, day: 29 }],
  ])('accepts %s without inventing date precision', (input, date) => {
    expect(parseAchievementDateInput(input)).toEqual({ date, error: null });
  });

  it.each(['', 'текст', '2024.5', '13.2024', '29.02.2023', '32.03.2024'])(
    'rejects malformed or impossible date %s',
    (input) => {
      expect(parseAchievementDateInput(input)).toEqual({
        date: null,
        error: expect.any(String),
      });
    },
  );

  it('presents diagnostic server messages as date errors', () => {
    expect(presentAchievementDateGroup('Expected number, received nan')).toBe(
      'Укажите существующую дату',
    );
  });
});

describe('formatAuthorAchievementLabel', () => {
  it.each([
    [{ year: 2026, month: 4, day: null }, '04.2026'],
    [{ year: 2016, month: 12, day: 31 }, '31.12.2016'],
    [{ year: 4, month: 2, day: 29 }, '29.02.0004'],
  ])('uses a day only when the author provided one', (value, expected) => {
    expect(formatAuthorAchievementLabel(value)).toBe(expected);
  });
});

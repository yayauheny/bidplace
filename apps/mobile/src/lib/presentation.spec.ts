import { describe, expect, it } from 'vitest';

import {
  handoffContactTypeLabels,
  handoffInitiatorLabels,
  productStatusLabels,
  parseDateTimeInputValue,
  presentEnum,
  sellerStatusLabels,
  sellerTypeLabels,
  toDateTimeInputValue,
} from './presentation';

describe('presentation adapters', () => {
  it('localizes known enum values without changing their API values', () => {
    expect(
      presentEnum('TELEGRAM', handoffContactTypeLabels, 'Неизвестный тип контакта'),
    ).toBe('Telegram');
    expect('TELEGRAM').toBe('TELEGRAM');
  });

  it('uses explicit copy for an unknown enum instead of leaking raw values', () => {
    expect(
      presentEnum(
        'FUTURE_STATUS',
        sellerStatusLabels,
        'Неизвестный статус продавца',
      ),
    ).toBe('Неизвестный статус продавца');
  });

  it.each([
    [sellerStatusLabels, 'Неизвестный статус продавца'],
    [productStatusLabels, 'Неизвестный статус предмета'],
    [sellerTypeLabels, 'Неизвестный тип продавца'],
    [handoffContactTypeLabels, 'Неизвестный тип контакта'],
    [handoffInitiatorLabels, 'Неизвестный режим контакта'],
  ] as const)('uses the explicit fallback for each presentation group', (labels, fallback) => {
    expect(presentEnum('FUTURE_VALUE', labels, fallback)).toBe(fallback);
  });

  it('round-trips a date-time input through ISO serialization', () => {
    const input = '2026-08-02T10:15';
    const serialized = parseDateTimeInputValue(input);
    expect(serialized).not.toBeNull();
    expect(toDateTimeInputValue(serialized!)).toBe(input);
  });

  it('returns null for invalid date-time input', () => {
    expect(parseDateTimeInputValue('not-a-date')).toBeNull();
    expect(toDateTimeInputValue('not-a-date')).toBe('');
  });
});

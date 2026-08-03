import { describe, expect, it } from 'vitest';

import {
  cancellationReasonLabels,
  handoffContactTypeLabels,
  handoffInitiatorLabels,
  orderStatusLabels,
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
      presentEnum(
        'BUYER_DECLINED',
        cancellationReasonLabels,
        'Неизвестная причина отмены',
      ),
    ).toBe('Покупатель отказался');
    expect('BUYER_DECLINED').toBe('BUYER_DECLINED');
  });

  it('uses explicit copy for an unknown enum instead of leaking raw values', () => {
    expect(
      presentEnum(
        'FUTURE_STATUS',
        cancellationReasonLabels,
        'Неизвестная причина отмены',
      ),
    ).toBe(
      'Неизвестная причина отмены',
    );
  });

  it.each([
    [sellerStatusLabels, 'Неизвестный статус продавца'],
    [productStatusLabels, 'Неизвестный статус предмета'],
    [orderStatusLabels, 'Неизвестный статус заказа'],
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

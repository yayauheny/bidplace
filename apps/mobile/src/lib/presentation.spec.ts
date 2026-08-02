import { describe, expect, it } from 'vitest';

import {
  cancellationReasonLabels,
  parseDateTimeInputValue,
  presentEnum,
  toDateTimeInputValue,
} from './presentation';

describe('presentation adapters', () => {
  it('localizes known enum values without changing their API values', () => {
    expect(presentEnum('BUYER_DECLINED', cancellationReasonLabels, 'Причина')).toBe(
      'Покупатель отказался',
    );
    expect('BUYER_DECLINED').toBe('BUYER_DECLINED');
  });

  it('uses explicit copy for an unknown enum instead of leaking raw values', () => {
    expect(presentEnum('FUTURE_STATUS', cancellationReasonLabels, 'Причина')).toBe(
      'Причина недоступен',
    );
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

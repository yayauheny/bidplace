import { describe, expect, it } from 'vitest';
import { analyticsRange, analyticsRate } from './admin-analytics-state';

const now = new Date('2026-10-24T12:30:00.000Z');
describe('analytics UTC periods', () => {
  it.each([
    ['today', '2026-10-24'],
    ['7d', '2026-10-18'],
    ['30d', '2026-09-25'],
    ['90d', '2026-07-27'],
  ] as const)('uses calendar days including today for %s', (period, from) => {
    expect(analyticsRange(period, now, '', '')).toEqual({
      from: `${from}T00:00:00.000Z`,
      to: now.toISOString(),
      includeActivity: true,
    });
  });
  it('includes the full last selected day and accepts the 93 day limit', () => {
    expect(analyticsRange('custom', now, '2026-01-01', '2026-04-03')).toEqual({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-04-04T00:00:00.000Z',
      includeActivity: true,
    });
  });
  it.each([
    ['', ''],
    ['2026-02-30', '2026-03-01'],
    ['2026-03-02', '2026-03-01'],
    ['2026-01-01', '2026-04-04'],
    ['2026-1-1', '2026-01-01'],
  ])('rejects invalid or oversized custom period %s / %s', (start, end) => {
    expect(analyticsRange('custom', now, start, end)).toBeNull();
  });
  it('distinguishes an unknown denominator from a measured zero conversion', () => {
    expect(analyticsRate(null)).toBe('—');
    expect(analyticsRate(0)).toBe('0%');
    expect(analyticsRate(0.125)).toBe('12,5%');
  });
});

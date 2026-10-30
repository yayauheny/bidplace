import { describe, expect, it } from 'vitest';

import {
  bidStepMinor,
  minimumBidMinor,
  resolveSoftCloseEndsAt,
} from './auction-pricing';

const original = new Date('2026-10-30T10:00:00.000Z');

function at(offsetMs: number): Date {
  return new Date(original.getTime() + offsetMs);
}

describe('bid steps', () => {
  it.each([
    ['BYN', 2_499, 50],
    ['BYN', 2_500, 100],
    ['BYN', 9_999, 100],
    ['BYN', 10_000, 500],
    ['BYN', 49_999, 500],
    ['BYN', 50_000, 1_000],
    ['BYN', 99_999, 1_000],
    ['BYN', 100_000, 2_500],
    ['RUB', 49_999, 1_000],
    ['RUB', 50_000, 2_500],
    ['RUB', 249_999, 2_500],
    ['RUB', 250_000, 10_000],
    ['RUB', 999_999, 10_000],
    ['RUB', 1_000_000, 25_000],
    ['RUB', 2_499_999, 25_000],
    ['RUB', 2_500_000, 50_000],
  ] as const)(
    '%s price %i minor uses step %i',
    (currency, currentMinor, step) => {
      expect(bidStepMinor(currency, currentMinor)).toBe(step);
    },
  );
});

describe('minimum bid', () => {
  it.each([
    {
      label: 'first BYN bid is the start price',
      currency: 'BYN' as const,
      startPriceMinor: 2_500,
      currentPriceMinor: null,
      bidCount: 0,
      expected: 2_500,
    },
    {
      label: 'first bid ignores a stored current price',
      currency: 'BYN' as const,
      startPriceMinor: 5_000,
      currentPriceMinor: 9_000,
      bidCount: 0,
      expected: 5_000,
    },
    {
      label: 'first RUB bid is the start price',
      currency: 'RUB' as const,
      startPriceMinor: 50_000,
      currentPriceMinor: null,
      bidCount: 0,
      expected: 50_000,
    },
    {
      label: 'BYN just under 25 adds 0.50',
      currency: 'BYN' as const,
      startPriceMinor: 2_499,
      currentPriceMinor: 2_499,
      bidCount: 1,
      expected: 2_549,
    },
    {
      label: 'BYN at 25 adds 1',
      currency: 'BYN' as const,
      startPriceMinor: 2_500,
      currentPriceMinor: 2_500,
      bidCount: 1,
      expected: 2_600,
    },
    {
      label: 'BYN at 100 adds 5',
      currency: 'BYN' as const,
      startPriceMinor: 10_000,
      currentPriceMinor: 10_000,
      bidCount: 2,
      expected: 10_500,
    },
    {
      label: 'BYN at 1000 adds 25',
      currency: 'BYN' as const,
      startPriceMinor: 100_000,
      currentPriceMinor: 100_000,
      bidCount: 1,
      expected: 102_500,
    },
    {
      label: 'RUB just under 500 adds 10',
      currency: 'RUB' as const,
      startPriceMinor: 49_999,
      currentPriceMinor: 49_999,
      bidCount: 1,
      expected: 50_999,
    },
    {
      label: 'RUB at 500 adds 25',
      currency: 'RUB' as const,
      startPriceMinor: 50_000,
      currentPriceMinor: 50_000,
      bidCount: 1,
      expected: 52_500,
    },
    {
      label: 'RUB at 25000 adds 500',
      currency: 'RUB' as const,
      startPriceMinor: 2_500_000,
      currentPriceMinor: 2_500_000,
      bidCount: 1,
      expected: 2_550_000,
    },
  ])('$label', (input) => {
    expect(minimumBidMinor(input)).toBe(input.expected);
  });

  it('requires a current price after the first bid', () => {
    expect(() =>
      minimumBidMinor({
        currency: 'BYN',
        startPriceMinor: 2_500,
        currentPriceMinor: null,
        bidCount: 1,
      }),
    ).toThrow('current price is required after the first bid');
  });
});

describe('soft close', () => {
  it.each([
    {
      label: '61 seconds before the end leaves endsAt',
      endsAt: 300_000,
      now: 300_000 - 61_000,
      expected: 300_000,
    },
    {
      label: '60 seconds plus 1 ms leaves endsAt',
      endsAt: 300_000,
      now: 300_000 - 60_001,
      expected: 300_000,
    },
    {
      label:
        'exactly 60 seconds with a longer extension becomes now plus extension',
      endsAt: 300_000,
      now: 240_000,
      extensionSeconds: 120,
      maxTotalSeconds: 600,
      expected: 360_000,
    },
    {
      label: 'inside the window extends from now, not from endsAt',
      endsAt: 300_000,
      now: 270_000,
      expected: 330_000,
    },
    {
      label: 'extension length comes from extensionSeconds',
      endsAt: 300_000,
      now: 270_000,
      extensionSeconds: 90,
      expected: 360_000,
    },
    {
      label: 'a 30 second window extends at 30 seconds',
      endsAt: 300_000,
      now: 280_000,
      windowSeconds: 30,
      extensionSeconds: 30,
      expected: 310_000,
    },
    {
      label: 'a 30 second window ignores 30 seconds plus 1 ms',
      endsAt: 300_000,
      now: 300_000 - 30_001,
      windowSeconds: 30,
      extensionSeconds: 30,
      expected: 300_000,
    },
    {
      label: 'now plus extension equal to the cap stays on the cap',
      endsAt: 570_000,
      now: 540_000,
      expected: 600_000,
    },
    {
      label: 'now plus extension past the cap stops at original plus 600',
      endsAt: 590_000,
      now: 560_000,
      expected: 600_000,
    },
    {
      label: 'an end already on the cap does not move later',
      endsAt: 600_000,
      now: 570_000,
      expected: 600_000,
    },
    {
      label: 'a wider window does not move the end earlier than endsAt',
      endsAt: 300_000,
      now: 220_000,
      windowSeconds: 90,
      extensionSeconds: 60,
      maxTotalSeconds: 600,
      expected: 300_000,
    },
    {
      label: 'a wider window ignores a cap below endsAt',
      endsAt: 300_000,
      now: 220_000,
      windowSeconds: 90,
      extensionSeconds: 60,
      maxTotalSeconds: 100,
      expected: 300_000,
    },
    {
      label: 'a wider window extends once now plus extension passes endsAt',
      endsAt: 300_000,
      now: 270_000,
      windowSeconds: 90,
      extensionSeconds: 60,
      maxTotalSeconds: 900,
      expected: 330_000,
    },
    {
      label: 'a cap between endsAt and now plus extension is the result',
      endsAt: 300_000,
      now: 270_000,
      windowSeconds: 60,
      extensionSeconds: 60,
      maxTotalSeconds: 320,
      expected: 320_000,
    },
    {
      label: 'a cap already behind endsAt leaves endsAt',
      endsAt: 300_000,
      now: 270_000,
      windowSeconds: 60,
      extensionSeconds: 60,
      maxTotalSeconds: 240,
      expected: 300_000,
    },
    {
      label: 'an end already past the cap stays at endsAt',
      endsAt: 660_000,
      now: 630_000,
      maxTotalSeconds: 600,
      expected: 660_000,
    },
    {
      label: 'the exact end does not move',
      endsAt: 300_000,
      now: 300_000,
      expected: 300_000,
    },
    {
      label: 'after the end does not move',
      endsAt: 300_000,
      now: 300_001,
      expected: 300_000,
    },
  ])('$label', (row) => {
    expect(
      resolveSoftCloseEndsAt({
        endsAt: at(row.endsAt),
        originalEndsAt: original,
        now: at(row.now),
        windowSeconds: row.windowSeconds ?? 60,
        extensionSeconds: row.extensionSeconds ?? 60,
        maxTotalSeconds: row.maxTotalSeconds ?? 600,
      }).toISOString(),
    ).toBe(at(row.expected).toISOString());
  });
});

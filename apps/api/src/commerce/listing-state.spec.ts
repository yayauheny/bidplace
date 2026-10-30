import {
  LISTING_STATUSES,
  LISTING_TYPES,
  type ListingStatus,
  type ListingType,
} from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import {
  canAuthorCancel,
  effectiveListingState,
  type EffectiveListingState,
} from './listing-state';

const now = new Date('2026-10-30T12:00:00.000Z');
const before = new Date(now.getTime() - 1);
const after = new Date(now.getTime() + 1);

const starts = [
  ['before the start', after],
  ['at the start', now],
  ['after the start', before],
] as const;

const ends = [
  ['with no end', null],
  ['before the end', after],
  ['at the end', now],
  ['after the end', before],
] as const;

function expectedState(
  status: ListingStatus,
  startsAt: Date,
  endsAt: Date | null,
): EffectiveListingState {
  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'ENDED') return 'ENDED';
  const started = startsAt.getTime() <= now.getTime();
  const due = endsAt !== null && endsAt.getTime() <= now.getTime();
  if (started && due) return 'AWAITING_CLOSE';
  if (started) return 'LIVE';
  return 'SCHEDULED';
}

const listingCases = LISTING_STATUSES.flatMap((status) =>
  starts.flatMap(([startLabel, startsAt]) =>
    ends.map(([endLabel, endsAt]) => ({
      label: `${status} ${startLabel} ${endLabel}`,
      status,
      startsAt,
      endsAt,
      expected: expectedState(status, startsAt, endsAt),
    })),
  ),
);

describe('effective listing state', () => {
  it.each([
    ['SCHEDULED', after, after, 'SCHEDULED'],
    ['SCHEDULED', now, after, 'LIVE'],
    ['SCHEDULED', before, before, 'AWAITING_CLOSE'],
    ['SCHEDULED', before, null, 'LIVE'],
    ['LIVE', after, after, 'SCHEDULED'],
    ['LIVE', before, after, 'LIVE'],
    ['LIVE', before, now, 'AWAITING_CLOSE'],
    ['LIVE', before, null, 'LIVE'],
    ['ENDED', before, after, 'ENDED'],
    ['CANCELLED', before, null, 'CANCELLED'],
  ] as const)(
    '%s from %s to %s is %s',
    (status, startsAt, endsAt, expected) => {
      expect(effectiveListingState({ status, startsAt, endsAt }, now)).toBe(
        expected,
      );
    },
  );

  it.each(listingCases)('$label is $expected', (row) => {
    expect(
      effectiveListingState(
        { status: row.status, startsAt: row.startsAt, endsAt: row.endsAt },
        now,
      ),
    ).toBe(row.expected);
  });
});

const clocks = [now, new Date('2026-11-01T00:00:00.000Z')] as const;
const bidCounts = [0, 1] as const;

function authorMayCancel(
  type: ListingType,
  status: ListingStatus,
  bidCount: number,
): boolean {
  if (status !== 'SCHEDULED' && status !== 'LIVE') return false;
  if (type === 'AUCTION' && bidCount > 0) return false;
  return true;
}

const cancelCases = LISTING_TYPES.flatMap((type) =>
  LISTING_STATUSES.flatMap((status) =>
    bidCounts.flatMap((bidCount) =>
      clocks.map((clock) => ({
        label: `${type} ${status} with ${bidCount} bids`,
        type,
        status,
        bidCount,
        now: clock,
        expected: authorMayCancel(type, status, bidCount),
      })),
    ),
  ),
);

describe('author cancellation', () => {
  it.each(cancelCases)('$label at $now', (row) => {
    expect(
      canAuthorCancel(
        { type: row.type, status: row.status, bidCount: row.bidCount },
        row.now,
      ),
    ).toBe(row.expected);
  });

  it('refuses cancellation when the clock is invalid', () => {
    expect(
      canAuthorCancel(
        { type: 'FIXED', status: 'LIVE', bidCount: 0 },
        new Date(Number.NaN),
      ),
    ).toBe(false);
  });
});

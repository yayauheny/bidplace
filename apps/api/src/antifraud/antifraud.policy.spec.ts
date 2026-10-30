import { describe, expect, it } from 'vitest';
import {
  detectBidBurst,
  shouldHold,
  type SignalKind,
} from './antifraud.policy';

describe('fraud signal policies', () => {
  it.each<{ kinds: SignalKind[]; held: boolean }>([
    { kinds: [], held: false },
    { kinds: ['BID_BURST'], held: false },
    { kinds: ['BID_BURST', 'BID_BURST', 'BID_BURST'], held: false },
    { kinds: ['BID_BURST', 'TURNSTILE_FAILED'], held: true },
    { kinds: ['SHARED_BROWSER_WITH_SELLER', 'NEW_ACCOUNT_BURST'], held: true },
  ])('holds only for distinct kinds: $kinds', ({ kinds, held }) => {
    expect(shouldHold(kinds)).toBe(held);
  });

  const now = new Date('2026-10-29T12:00:00Z');
  it.each([
    { count: 4, listings: 3, oldest: 10_000, want: false },
    { count: 5, listings: 2, oldest: 10_000, want: false },
    { count: 5, listings: 3, oldest: 10_000, want: true },
    { count: 5, listings: 3, oldest: 10_001, want: false },
    { count: 5, listings: 3, oldest: -1, want: false },
    { count: 6, listings: 3, oldest: -1, want: true },
  ])(
    'checks count, diversity and inclusive window: $count/$listings/$oldest',
    ({ count, listings, oldest, want }) => {
      const bids = Array.from({ length: count }, (_, i) => ({
        listingId: String(i % listings),
        at: new Date(now.getTime() - (i === 0 ? oldest : 0)),
      }));
      expect(detectBidBurst(bids, now)).toBe(want);
    },
  );
});

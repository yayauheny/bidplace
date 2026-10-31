import { describe, expect, it } from 'vitest';
import {
  buyerReservationLimitReached,
  buyerStrikesBlock,
  detectBidBurst,
  hasBuyerContact,
  isActiveBuyerStrike,
  isNewAccount,
  NEW_ACCOUNT_MAX_AGE_MS,
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

  it('pins the new-account burst window at 24 hours', () => {
    expect(NEW_ACCOUNT_MAX_AGE_MS).toBe(24 * 60 * 60 * 1_000);
  });

  const bidAt = new Date('2026-10-29T12:00:00.000Z');
  it.each([
    { ageMs: NEW_ACCOUNT_MAX_AGE_MS - 1, fresh: true },
    { ageMs: NEW_ACCOUNT_MAX_AGE_MS, fresh: false },
    { ageMs: NEW_ACCOUNT_MAX_AGE_MS + 1, fresh: false },
  ])('treats an account of age $ageMs as new=$fresh', ({ ageMs, fresh }) => {
    expect(isNewAccount(new Date(bidAt.getTime() - ageMs), bidAt)).toBe(fresh);
  });

  it('requires a non-blank deal contact', () => {
    expect(hasBuyerContact([null, '  ', undefined])).toBe(false);
    expect(hasBuyerContact([null, '+375291112233'])).toBe(true);
  });

  it('blocks at two strikes and at three reservations', () => {
    expect(buyerStrikesBlock(1)).toBe(false);
    expect(buyerStrikesBlock(2)).toBe(true);
    expect(buyerReservationLimitReached(2)).toBe(false);
    expect(buyerReservationLimitReached(3)).toBe(true);
  });

  it('counts a buyer refusal immediately and a seller mark only after the delay without an open report', () => {
    const recent = new Date(now.getTime() - 60 * 60 * 1000);
    const aged = new Date(now.getTime() - 73 * 60 * 60 * 1000);
    expect(
      isActiveBuyerStrike(
        { failReason: 'BUYER_REFUSED', failedAt: recent, buyerReportOpen: true },
        now,
      ),
    ).toBe(true);
    expect(
      isActiveBuyerStrike(
        { failReason: 'BUYER_NO_CONTACT', failedAt: recent, buyerReportOpen: false },
        now,
      ),
    ).toBe(false);
    expect(
      isActiveBuyerStrike(
        { failReason: 'BUYER_NO_CONTACT', failedAt: aged, buyerReportOpen: true },
        now,
      ),
    ).toBe(false);
    expect(
      isActiveBuyerStrike(
        { failReason: 'BUYER_NO_CONTACT', failedAt: aged, buyerReportOpen: false },
        now,
      ),
    ).toBe(true);
    expect(
      isActiveBuyerStrike(
        {
          failReason: 'BUYER_REFUSED',
          failedAt: recent,
          buyerReportOpen: false,
          markedBy: 'seller',
        },
        now,
      ),
    ).toBe(false);
    expect(
      isActiveBuyerStrike(
        {
          failReason: 'BUYER_REFUSED',
          failedAt: aged,
          buyerReportOpen: false,
          markedBy: 'seller',
        },
        now,
      ),
    ).toBe(true);
    expect(
      isActiveBuyerStrike(
        {
          failReason: 'BUYER_REFUSED',
          failedAt: aged,
          buyerReportOpen: true,
          markedBy: 'seller',
        },
        now,
      ),
    ).toBe(false);
    expect(
      isActiveBuyerStrike(
        {
          failReason: 'BUYER_NO_CONTACT',
          failedAt: recent,
          buyerReportOpen: false,
          markedBy: 'admin',
        },
        now,
      ),
    ).toBe(true);
  });
});

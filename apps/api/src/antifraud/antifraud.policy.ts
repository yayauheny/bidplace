import { COMMERCE_LIMITS } from '@bidplace/contracts';

export const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1_000;

export const FRAUD_SIGNAL_WINDOW_MS = 24 * 60 * 60 * 1_000;
export const BID_BURST_WINDOW_MS = 10_000;
export const BID_BURST_MIN_BIDS = 5;
export const BID_BURST_MIN_LISTINGS = 3;
export const NEW_ACCOUNT_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
export type SignalKind =
  | 'TURNSTILE_FAILED'
  | 'BID_BURST'
  | 'SHARED_BROWSER_WITH_SELLER'
  | 'NEW_ACCOUNT_BURST';
export type ActorAction = 'bid' | 'purchase' | 'accept-offer';

export function shouldHold(kindsInWindow: SignalKind[]): boolean {
  return new Set(kindsInWindow).size >= 2;
}

const IMMEDIATE_BUYER_STRIKES = new Set(['BUYER_REFUSED']);
const DELAYED_BUYER_STRIKES = new Set([
  'BUYER_NO_CONTACT',
  'BUYER_INVALID_CONTACTS',
]);
const BUYER_FAULT_REASONS = new Set([
  ...IMMEDIATE_BUYER_STRIKES,
  ...DELAYED_BUYER_STRIKES,
]);

export type StrikeMark = 'buyer' | 'seller' | 'admin' | 'system';

export function strikeMark(value: string | null | undefined): StrikeMark | null {
  if (
    value === 'buyer' ||
    value === 'seller' ||
    value === 'admin' ||
    value === 'system'
  ) {
    return value;
  }
  return null;
}

export function hasBuyerContact(
  values: Array<string | null | undefined>,
): boolean {
  return values.some(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
}

export function buyerStrikesBlock(strikes: number): boolean {
  return strikes >= COMMERCE_LIMITS.buyerStrikesToBlock;
}

export function buyerReservationLimitReached(reservations: number): boolean {
  return reservations >= COMMERCE_LIMITS.buyerActiveOrders;
}

/**
 * The buyer's own refusal counts at once. A seller mark counts after the
 * delay, and not while that buyer's report on the order is still open.
 * A row with no marker keeps the older split: refusal immediate, the other
 * buyer-fault reasons delayed.
 */
export function isActiveBuyerStrike(
  order: {
    failReason: string | null;
    failedAt: Date | null;
    buyerReportOpen: boolean;
    markedBy?: StrikeMark | null;
  },
  now: Date,
): boolean {
  if (!order.failReason || !BUYER_FAULT_REASONS.has(order.failReason)) return false;
  const delayed =
    order.markedBy === 'seller' ||
    (order.markedBy == null && DELAYED_BUYER_STRIKES.has(order.failReason));
  if (!delayed) return true;
  if (order.buyerReportOpen || order.failedAt === null) return false;
  const delay = COMMERCE_LIMITS.strikeDelayHours * 60 * 60 * 1000;
  return order.failedAt.getTime() <= now.getTime() - delay;
}

export function isNewAccount(createdAt: Date, at: Date): boolean {
  return at.getTime() - createdAt.getTime() < NEW_ACCOUNT_MAX_AGE_MS;
}

export function detectBidBurst(
  bids: { listingId: string; at: Date }[],
  now: Date,
): boolean {
  const recent = bids.filter(
    (bid) =>
      bid.at.getTime() <= now.getTime() &&
      bid.at.getTime() >= now.getTime() - BID_BURST_WINDOW_MS,
  );
  return (
    recent.length >= BID_BURST_MIN_BIDS &&
    new Set(recent.map((bid) => bid.listingId)).size >= BID_BURST_MIN_LISTINGS
  );
}

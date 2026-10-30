import { COMMERCE_LIMITS } from '@bidplace/contracts';

export const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1_000;

export const FRAUD_SIGNAL_WINDOW_MS = 24 * 60 * 60 * 1_000;
export const BID_BURST_WINDOW_MS = 10_000;
export const BID_BURST_MIN_BIDS = 5;
export const BID_BURST_MIN_LISTINGS = 3;
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

/** Buyer refusal counts at once. A seller-marked failure counts after the delay, unless the buyer's report on that order is still open. */
export function isActiveBuyerStrike(
  order: {
    failReason: string | null;
    failedAt: Date | null;
    buyerReportOpen: boolean;
  },
  now: Date,
): boolean {
  if (!order.failReason) return false;
  if (IMMEDIATE_BUYER_STRIKES.has(order.failReason)) return true;
  if (!DELAYED_BUYER_STRIKES.has(order.failReason)) return false;
  if (order.buyerReportOpen || order.failedAt === null) return false;
  const delay = COMMERCE_LIMITS.strikeDelayHours * 60 * 60 * 1000;
  return order.failedAt.getTime() <= now.getTime() - delay;
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

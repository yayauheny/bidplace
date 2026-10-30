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

export const MAX_SECOND_CHANCE_OFFERS = 2;

export type OfferBid = {
  id: string;
  bidderUserId: string;
  amountMinor: number;
  createdAt: Date;
  voidedAt: Date | null;
};

export type RankedBidder = {
  userId: string;
  amountMinor: number;
  bidId: string;
};

export function rankBidders(
  bids: readonly OfferBid[],
  excludedUserIds: ReadonlySet<string>,
): RankedBidder[] {
  const best = new Map<string, OfferBid>();
  for (const bid of bids) {
    if (bid.voidedAt) continue;
    const current = best.get(bid.bidderUserId);
    if (
      !current ||
      bid.amountMinor > current.amountMinor ||
      (bid.amountMinor === current.amountMinor &&
        bid.createdAt.getTime() < current.createdAt.getTime())
    ) {
      best.set(bid.bidderUserId, bid);
    }
  }
  return [...best.values()]
    .filter((bid) => !excludedUserIds.has(bid.bidderUserId))
    .sort(
      (left, right) =>
        right.amountMinor - left.amountMinor ||
        left.createdAt.getTime() - right.createdAt.getTime(),
    )
    .map((bid) => ({
      userId: bid.bidderUserId,
      amountMinor: bid.amountMinor,
      bidId: bid.id,
    }));
}

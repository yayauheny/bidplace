import {
  type Auction,
  type AuctionEndedEventPayload,
  type AuctionUpdatedEventPayload,
  type BidPlacedEventPayload,
  type PublicBid,
} from '@bidplace/contracts';

export function mapAuctionUpdatedEventPayload(
  auction: Pick<
    Auction,
    'id' | 'currentPrice' | 'bidCount' | 'status' | 'endsAt' | 'winnerBidId'
  >,
  reserveReached: boolean,
): AuctionUpdatedEventPayload {
  return {
    auctionId: auction.id,
    currentPrice: auction.currentPrice,
    bidCount: auction.bidCount,
    status: auction.status,
    endsAt: auction.endsAt,
    winnerBidId: auction.winnerBidId,
    reserveReached,
  };
}

export function mapBidPlacedEventPayload(
  auctionId: string,
  bid: PublicBid,
  currentPrice: number,
  bidCount: number,
): BidPlacedEventPayload {
  return {
    auctionId,
    bid,
    currentPrice,
    bidCount,
  };
}

export function mapAuctionEndedEventPayload(
  payload: AuctionEndedEventPayload,
): AuctionEndedEventPayload {
  return payload;
}

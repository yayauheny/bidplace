import {
  type Auction,
  type AuctionListItem,
  type PublicBid,
} from '@bidplace/contracts';

import { parseAuctionStatus } from '../core/contracts';
import { type DecimalLike, toNumber } from '../core/mapping/decimal-like';
import {
  type RawBidRecord,
  toContractBid,
  toPublicBid,
} from '../bids/bid.mapper';
import { type RawLotRecord, toContractLot } from '../lots/lot.mapper';
import {
  type RawSellerProfileRecord,
  toContractSellerProfile,
} from '../sellers/seller-profile.mapper';

export type RawAuctionRecord = {
  id: string;
  lotId: string;
  sellerProfileId: string;
  slug: string;
  startPrice: DecimalLike;
  reservePrice: DecimalLike;
  currentPrice: DecimalLike;
  currency: string;
  bidStep: DecimalLike;
  startsAt: Date;
  endsAt: Date;
  status: string;
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: DecimalLike | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RawAuctionLifecycleRecord = {
  id: string;
  reservePrice: DecimalLike;
  currentPrice: DecimalLike;
  bidCount: number;
  winnerBidId: string | null;
  status: string;
  startsAt: Date;
  endsAt: Date;
};

export type RawAuctionListItemRecord = RawAuctionRecord & {
  lot: RawLotRecord;
  sellerProfile: RawSellerProfileRecord;
};

export type RawAuctionDetailRecord = RawAuctionListItemRecord & {
  bids: RawBidRecord[];
};

export function toContractAuction(auction: RawAuctionRecord): Auction {
  return {
    id: auction.id,
    lotId: auction.lotId,
    sellerProfileId: auction.sellerProfileId,
    slug: auction.slug,
    startPrice: toNumber(auction.startPrice),
    reservePrice: toNumber(auction.reservePrice),
    currentPrice: toNumber(auction.currentPrice),
    currency: auction.currency,
    bidStep: toNumber(auction.bidStep),
    startsAt: auction.startsAt.toISOString(),
    endsAt: auction.endsAt.toISOString(),
    status: parseAuctionStatus(auction.status, auction.id),
    bidCount: auction.bidCount,
    winnerBidId: auction.winnerBidId,
    buyNowPrice:
      auction.buyNowPrice === null ? null : toNumber(auction.buyNowPrice),
    createdAt: auction.createdAt.toISOString(),
    updatedAt: auction.updatedAt.toISOString(),
  };
}

export function toAuctionListItem(
  auction: RawAuctionListItemRecord,
): AuctionListItem {
  return {
    auction: toContractAuction(auction),
    lot: toContractLot(auction.lot),
    sellerProfile: toContractSellerProfile(auction.sellerProfile),
  };
}

export function toAuctionDetailItem(
  auction: RawAuctionDetailRecord,
): {
  auction: Auction;
  lot: ReturnType<typeof toContractLot>;
  sellerProfile: ReturnType<typeof toContractSellerProfile>;
  bids: PublicBid[];
} {
  const contractAuction = toContractAuction(auction);

  return {
    auction: contractAuction,
    lot: toContractLot(auction.lot),
    sellerProfile: toContractSellerProfile(auction.sellerProfile),
    bids: auction.bids.map((bid) => toPublicBid(toContractBid(bid))),
  };
}

export function toAuctionLifecycleSnapshot(
  auction: RawAuctionLifecycleRecord,
): Pick<
  Auction,
  'id' | 'currentPrice' | 'bidCount' | 'status' | 'endsAt' | 'winnerBidId'
> {
  return {
    id: auction.id,
    currentPrice: toNumber(auction.currentPrice),
    bidCount: auction.bidCount,
    status: parseAuctionStatus(auction.status, auction.id),
    endsAt: auction.endsAt.toISOString(),
    winnerBidId: auction.winnerBidId,
  };
}

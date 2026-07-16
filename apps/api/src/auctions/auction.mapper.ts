import {
  type Auction,
  type AuctionListItem,
  type PublicBid,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { parseAuctionStatus } from '../core/contracts';
import {
  bidContractSelect,
  toContractBid,
  toPublicBid,
} from '../bids/bid.mapper';
import {
  lotContractSelect,
  toContractLot,
} from '../lots/lot.mapper';
import {
  sellerProfileContractSelect,
  toContractSellerProfile,
} from '../sellers/seller-profile.mapper';

export const auctionContractSelect = {
  id: true,
  lotId: true,
  sellerProfileId: true,
  slug: true,
  startPrice: true,
  reservePrice: true,
  currentPrice: true,
  currency: true,
  bidStep: true,
  startsAt: true,
  endsAt: true,
  status: true,
  bidCount: true,
  winnerBidId: true,
  buyNowPrice: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AuctionSelect;

export type AuctionContractRecord = Prisma.AuctionGetPayload<{
  select: typeof auctionContractSelect;
}>;

export const auctionLifecycleSelect = {
  id: true,
  reservePrice: true,
  currentPrice: true,
  bidCount: true,
  winnerBidId: true,
  status: true,
  startsAt: true,
  endsAt: true,
} satisfies Prisma.AuctionSelect;

export type AuctionLifecycleRecord = Prisma.AuctionGetPayload<{
  select: typeof auctionLifecycleSelect;
}>;

export const publicAuctionListSelect = {
  ...auctionContractSelect,
  lot: {
    select: lotContractSelect,
  },
  sellerProfile: {
    select: sellerProfileContractSelect,
  },
} satisfies Prisma.AuctionSelect;

export type PublicAuctionListRecord = Prisma.AuctionGetPayload<{
  select: typeof publicAuctionListSelect;
}>;

export const publicAuctionDetailSelect = {
  ...publicAuctionListSelect,
  bids: {
    select: bidContractSelect,
  },
} satisfies Prisma.AuctionSelect;

export type PublicAuctionDetailRecord = Prisma.AuctionGetPayload<{
  select: typeof publicAuctionDetailSelect;
}>;

export function toContractAuction(auction: AuctionContractRecord): Auction {
  return {
    id: auction.id,
    lotId: auction.lotId,
    sellerProfileId: auction.sellerProfileId,
    slug: auction.slug,
    startPrice: auction.startPrice.toNumber(),
    reservePrice: auction.reservePrice.toNumber(),
    currentPrice: auction.currentPrice.toNumber(),
    currency: auction.currency,
    bidStep: auction.bidStep.toNumber(),
    startsAt: auction.startsAt.toISOString(),
    endsAt: auction.endsAt.toISOString(),
    status: parseAuctionStatus(auction.status, auction.id),
    bidCount: auction.bidCount,
    winnerBidId: auction.winnerBidId,
    buyNowPrice:
      auction.buyNowPrice === null ? null : auction.buyNowPrice.toNumber(),
    createdAt: auction.createdAt.toISOString(),
    updatedAt: auction.updatedAt.toISOString(),
  };
}

export function toAuctionListItem(
  auction: PublicAuctionListRecord,
): AuctionListItem {
  return {
    auction: toContractAuction(auction),
    lot: toContractLot(auction.lot),
    sellerProfile: toContractSellerProfile(auction.sellerProfile),
  };
}

export function toAuctionDetailItem(
  auction: PublicAuctionDetailRecord,
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
  auction: AuctionLifecycleRecord,
): Pick<
  Auction,
  'id' | 'currentPrice' | 'bidCount' | 'status' | 'endsAt' | 'winnerBidId'
> {
  return {
    id: auction.id,
    currentPrice: auction.currentPrice.toNumber(),
    bidCount: auction.bidCount,
    status: parseAuctionStatus(auction.status, auction.id),
    endsAt: auction.endsAt.toISOString(),
    winnerBidId: auction.winnerBidId,
  };
}

import { type Bid, type PublicBid } from '@bidplace/contracts';

import { parseBidStatus } from '../core/contracts';
import { type DecimalLike, toNumber } from '../core/mapping/decimal-like';

export type RawBidRecord = {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amount: DecimalLike;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RawBidLifecycleRecord = {
  id: string;
  amount: DecimalLike;
  status: string;
  createdAt: Date;
};

export function toContractBid(bid: RawBidRecord): Bid {
  return {
    id: bid.id,
    auctionId: bid.auctionId,
    bidderUserId: bid.bidderUserId,
    amount: toNumber(bid.amount),
    status: parseBidStatus(bid.status, bid.id),
    createdAt: bid.createdAt.toISOString(),
    updatedAt: bid.updatedAt.toISOString(),
  };
}

export function toPublicBid(bid: Bid): PublicBid {
  return {
    id: bid.id,
    auctionId: bid.auctionId,
    amount: bid.amount,
    status: bid.status,
    createdAt: bid.createdAt,
    updatedAt: bid.updatedAt,
  };
}

export function toBidLifecycleEntry(bid: RawBidLifecycleRecord): {
  id: string;
  amount: number;
  status: Bid['status'];
  createdAt: Date;
} {
  return {
    id: bid.id,
    amount: toNumber(bid.amount),
    status: parseBidStatus(bid.status, bid.id),
    createdAt: bid.createdAt,
  };
}

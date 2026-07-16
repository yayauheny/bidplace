import { type Bid, type PublicBid } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { parseBidStatus } from '../core/contracts';

export const bidContractSelect = {
  id: true,
  auctionId: true,
  bidderUserId: true,
  amount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BidSelect;

export type BidContractRecord = Prisma.BidGetPayload<{
  select: typeof bidContractSelect;
}>;

export const bidLifecycleSelect = {
  id: true,
  amount: true,
  status: true,
  createdAt: true,
} satisfies Prisma.BidSelect;

type BidLifecycleRecord = Prisma.BidGetPayload<{
  select: typeof bidLifecycleSelect;
}>;

export function toContractBid(bid: BidContractRecord): Bid {
  return {
    id: bid.id,
    auctionId: bid.auctionId,
    bidderUserId: bid.bidderUserId,
    amount: bid.amount.toNumber(),
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

export function toBidLifecycleEntry(bid: BidLifecycleRecord): {
  id: string;
  amount: number;
  status: Bid['status'];
  createdAt: Date;
} {
  return {
    id: bid.id,
    amount: bid.amount.toNumber(),
    status: parseBidStatus(bid.status, bid.id),
    createdAt: bid.createdAt,
  };
}

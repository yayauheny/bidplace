import {
  type Auction,
  type BidCreateRequest,
  type PaginationQuery,
  bidHistoryResponseSchema,
  bidPlacementResponseSchema,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { parseAuctionStatus, parseLotStatus } from '../core/contracts';
import {
  calculateBidStep,
  eligibleBidStatuses,
  resolveMinimumNextBid,
  reserveReached,
  toDecimalAmount,
} from '../core/auction';
import {
  PrismaService,
  isPrismaUniqueConstraintError,
  runSerializableTransaction,
} from '../core/database';
import { Clock } from '../core/time';
import {
  mapAuctionUpdatedEventPayload,
  mapBidPlacedEventPayload,
  RealtimeEventsService,
} from '../core/realtime';
import {
  auctionContractSelect,
  toContractAuction,
} from '../auctions/auction.mapper';
import {
  bidContractSelect,
  toContractBid,
  toPublicBid,
} from './bid.mapper';

const auctionBidSelect = {
  ...auctionContractSelect,
  sellerProfile: {
    select: {
      userId: true,
    },
  },
  lot: {
    select: {
      status: true,
    },
  },
} satisfies Prisma.AuctionSelect;

type AuctionBidRecord = Prisma.AuctionGetPayload<{
  select: typeof auctionBidSelect;
}>;

const sellerAuctionOwnerSelect = {
  id: true,
  sellerProfile: {
    select: {
      userId: true,
    },
  },
} satisfies Prisma.AuctionSelect;

type SellerAuctionOwnerRecord = Prisma.AuctionGetPayload<{
  select: typeof sellerAuctionOwnerSelect;
}>;

type AuctionBiddingState = {
  status: Auction['status'];
  startsAt: Date;
  endsAt: Date;
};

export interface BidsRepository {
  auction: {
    findUnique: PrismaService['auction']['findUnique'];
    updateMany: PrismaService['auction']['updateMany'];
  };
  bid: {
    updateMany: PrismaService['bid']['updateMany'];
    create: PrismaService['bid']['create'];
    findMany: PrismaService['bid']['findMany'];
  };
  $transaction: PrismaService['$transaction'];
}

export interface BidsRealtimePublisher {
  publishBidPlaced: RealtimeEventsService['publishBidPlaced'];
  publishAuctionUpdated: RealtimeEventsService['publishAuctionUpdated'];
}

function toAuctionBiddingState(
  auction: AuctionBidRecord,
): AuctionBiddingState {
  return {
    status: parseAuctionStatus(auction.status, auction.id),
    startsAt: auction.startsAt,
    endsAt: auction.endsAt,
  };
}

function isAuctionOpenForBidding(
  auction: AuctionBiddingState,
  now: Date,
): boolean {
  return (
    auction.status === 'active' &&
    auction.startsAt <= now &&
    auction.endsAt > now
  );
}

@Injectable()
export class BidsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: BidsRepository,
    @Inject(RealtimeEventsService)
    private readonly realtimeEventsService: BidsRealtimePublisher,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  async placeBid(
    userId: string,
    auctionId: string,
    input: BidCreateRequest,
  ) {
    const now = this.clock.now();
    const amount = toDecimalAmount(input.amount);

    try {
      const result = await runSerializableTransaction(this.prisma, async (tx) => {
        const auction = await tx.auction.findUnique({
          where: {
            id: auctionId,
          },
          select: auctionBidSelect,
        });

        if (!auction) {
          throw new NotFoundException('Auction not found');
        }

        const biddingState = toAuctionBiddingState(auction);

        if (auction.sellerProfile.userId === userId) {
          throw new ForbiddenException('Cannot bid on your own auction');
        }

        if (!isAuctionOpenForBidding(biddingState, now)) {
          throw new ConflictException('Auction is not active');
        }

        if (parseLotStatus(auction.lot.status, auction.id) !== 'published') {
          throw new ConflictException('Auction is not open for bidding');
        }

        const minimumBid = resolveMinimumNextBid(auction.currentPrice);

        if (amount.lt(minimumBid)) {
          throw new BadRequestException(
            `Bid must be at least ${minimumBid.toFixed(2)}`,
          );
        }

        const updatedAuction = await tx.auction.updateMany({
          where: {
            id: auctionId,
            status: 'active',
            currentPrice: toDecimalAmount(auction.currentPrice),
            endsAt: {
              gt: now,
            },
          },
          data: {
            currentPrice: amount,
            bidCount: {
              increment: 1,
            },
            bidStep: calculateBidStep(amount),
          },
        });

        if (updatedAuction.count !== 1) {
          throw new ConflictException('Auction changed while placing bid');
        }

        await tx.bid.updateMany({
          where: {
            auctionId,
            status: {
              in: [...eligibleBidStatuses],
            },
          },
          data: {
            status: 'outbid',
          },
        });

        const bid = await tx.bid.create({
          data: {
            auctionId,
            bidderUserId: userId,
            amount,
            status: 'winning',
          },
          select: bidContractSelect,
        });

        const latestAuction = await tx.auction.findUnique({
          where: {
            id: auctionId,
          },
          select: auctionBidSelect,
        });

        if (!latestAuction) {
          throw new NotFoundException('Auction not found');
        }

        return {
          bid,
          auction: latestAuction,
        };
      });

      const response = bidPlacementResponseSchema.parse({
        bid: toContractBid(result.bid),
        auction: toContractAuction(result.auction),
      });

      const reserveMet = reserveReached(
        result.auction.currentPrice,
        result.auction.reservePrice,
      );

      this.realtimeEventsService.publishBidPlaced(
        mapBidPlacedEventPayload(
          response.auction.id,
          toPublicBid(response.bid),
          response.auction.currentPrice,
          response.auction.bidCount,
        ),
      );

      this.realtimeEventsService.publishAuctionUpdated(
        mapAuctionUpdatedEventPayload(response.auction, reserveMet),
      );

      return response;
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Bid could not be placed');
      }

      throw error;
    }
  }

  async listAuctionBids(
    userId: string,
    auctionId: string,
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ) {
    const auction: SellerAuctionOwnerRecord | null =
      await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: sellerAuctionOwnerSelect,
    });

    if (!auction || auction.sellerProfile.userId !== userId) {
      throw new NotFoundException('Auction not found');
    }

    const bids = await this.prisma.bid.findMany({
      where: {
        auctionId,
      },
      select: bidContractSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return bidHistoryResponseSchema.parse({
      bids: bids.map((bid) => toContractBid(bid)),
    });
  }
}

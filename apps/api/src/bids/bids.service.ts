import {
  type Auction,
  type Bid,
  type BidCreateRequest,
  type Lot,
  type PaginationQuery,
  type PublicBid,
  bidHistoryResponseSchema,
  bidPlacementResponseSchema,
} from '@bidplace/contracts';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import {
  calculateBidStep,
  eligibleBidStatuses,
  resolveMinimumNextBid,
  reserveReached,
  toDecimalAmount,
} from '../core/auction';
import { PrismaService, runSerializableTransaction } from '../core/database';
import { Clock } from '../core/time';
import {
  mapAuctionUpdatedEventPayload,
  mapBidPlacedEventPayload,
  RealtimeEventsService,
} from '../core/realtime';

const auctionBidSelect = {
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
};

type AuctionForBidRecord = {
  id: string;
  lotId: string;
  sellerProfileId: string;
  slug: string;
  startPrice: Decimal;
  reservePrice: Decimal;
  currentPrice: Decimal;
  currency: string;
  bidStep: Decimal;
  startsAt: Date;
  endsAt: Date;
  status: Auction['status'];
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  sellerProfile: {
    userId: string;
  };
  lot: {
    status: Lot['status'];
  };
};

const bidContractSelect = {
  id: true,
  auctionId: true,
  bidderUserId: true,
  amount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

type BidContractRecord = {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amount: Decimal;
  status: Bid['status'];
  createdAt: Date;
  updatedAt: Date;
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

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

function isAuctionOpenForBidding(
  auction: AuctionForBidRecord,
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

        if (auction.sellerProfile.userId === userId) {
          throw new ForbiddenException('Cannot bid on your own auction');
        }

        if (!isAuctionOpenForBidding(auction, now)) {
          throw new ConflictException('Auction is not active');
        }

        if (auction.lot.status !== 'published') {
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
            currentPrice: auction.currentPrice,
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
              in: eligibleBidStatuses,
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
        bid: this.toContractBid(result.bid),
        auction: this.toContractAuction(result.auction),
      });

      const reserveMet = reserveReached(
        result.auction.currentPrice,
        result.auction.reservePrice,
      );

      this.realtimeEventsService.publishBidPlaced(
        mapBidPlacedEventPayload(
          response.auction.id,
          this.toPublicBid(response.bid),
          response.auction.currentPrice,
          response.auction.bidCount,
        ),
      );

      this.realtimeEventsService.publishAuctionUpdated(
        mapAuctionUpdatedEventPayload(
          response.auction,
          reserveMet,
        ),
      );

      return response;
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
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
    const auction = await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: {
        id: true,
        sellerProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!auction || auction.sellerProfile.userId !== userId) {
      throw new NotFoundException('Auction not found');
    }

    const bids: BidContractRecord[] = await this.prisma.bid.findMany({
      where: {
        auctionId,
      },
      select: bidContractSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return bidHistoryResponseSchema.parse({
      bids: bids.map((bid) => this.toContractBid(bid)),
    });
  }

  private toContractBid(bid: BidContractRecord): Bid {
    return {
      id: bid.id,
      auctionId: bid.auctionId,
      bidderUserId: bid.bidderUserId,
      amount: bid.amount.toNumber(),
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
      updatedAt: bid.updatedAt.toISOString(),
    };
  }

  private toPublicBid(bid: Bid): PublicBid {
    return {
      id: bid.id,
      auctionId: bid.auctionId,
      amount: bid.amount,
      status: bid.status,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
    };
  }

  private toContractAuction(auction: AuctionForBidRecord) {
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
      status: auction.status,
      bidCount: auction.bidCount,
      winnerBidId: auction.winnerBidId,
      buyNowPrice:
        auction.buyNowPrice === null ? null : auction.buyNowPrice.toNumber(),
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
    };
  }
}

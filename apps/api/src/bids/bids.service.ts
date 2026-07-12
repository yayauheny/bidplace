import {
  type Bid,
  type BidCreateRequest,
  bidHistoryResponseSchema,
  bidPlacementResponseSchema,
} from '@bidplace/contracts';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { calculateBidStep } from '../core/auction';
import { PrismaService } from '../core/database';
import { RealtimeEventsService } from '../core/realtime';

type NumericLike = number | { toNumber(): number };

type AuctionForBidRecord = {
  id: string;
  lotId: string;
  sellerProfileId: string;
  slug: string;
  startPrice: NumericLike;
  reservePrice: NumericLike;
  currentPrice: NumericLike;
  currency: string;
  bidStep: NumericLike;
  startsAt: Date;
  endsAt: Date;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: NumericLike | null;
  createdAt: Date;
  updatedAt: Date;
  sellerProfile: {
    userId: string;
  };
  lot: {
    status: 'draft' | 'published' | 'sold' | 'hidden' | 'archived';
  };
};

type BidRecord = {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amount: NumericLike;
  status: Bid['status'];
  createdAt: Date;
  updatedAt: Date;
};

function toNumber(value: NumericLike): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class BidsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

  async placeBid(
    userId: string,
    auctionId: string,
    input: BidCreateRequest,
  ) {
    const now = new Date();
    const auction = await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: {
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
      },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.sellerProfile.userId === userId) {
      throw new ForbiddenException('Cannot bid on your own auction');
    }

    if (
      auction.status !== 'active' ||
      auction.startsAt > now ||
      auction.endsAt <= now
    ) {
      throw new ConflictException('Auction is not active');
    }

    if (auction.lot.status !== 'published') {
      throw new ConflictException('Auction is not open for bidding');
    }

    const currentPrice = toNumber(auction.currentPrice);
    const minimumBid = currentPrice + calculateBidStep(currentPrice);

    if (input.amount < minimumBid) {
      throw new BadRequestException(
        `Bid must be at least ${minimumBid.toFixed(2)}`,
      );
    }

    try {
      const result = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
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
              currentPrice: input.amount,
              bidCount: {
                increment: 1,
              },
              bidStep: calculateBidStep(input.amount),
            },
          });

          if (updatedAuction.count !== 1) {
            throw new ConflictException('Auction changed while placing bid');
          }

          await tx.bid.updateMany({
            where: {
              auctionId,
              status: {
                in: ['active', 'winning'],
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
              amount: input.amount,
              status: 'winning',
            },
          });

          const latestAuction = await tx.auction.findUnique({
            where: {
              id: auctionId,
            },
            select: {
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
            },
          });

          if (!latestAuction) {
            throw new NotFoundException('Auction not found');
          }

          return {
            bid,
            auction: latestAuction,
          };
        },
      );

      const response = bidPlacementResponseSchema.parse({
        bid: this.toContractBid(result.bid),
        auction: this.toContractAuction(result.auction),
      });

      this.realtimeEventsService.publishBidPlaced({
        auctionId: response.auction.id,
        bid: response.bid,
        currentPrice: response.auction.currentPrice,
        bidCount: response.auction.bidCount,
      });

      this.realtimeEventsService.publishAuctionUpdated({
        auctionId: response.auction.id,
        currentPrice: response.auction.currentPrice,
        bidCount: response.auction.bidCount,
        status: response.auction.status,
        endsAt: response.auction.endsAt,
        winnerBidId: response.auction.winnerBidId,
        reserveReached:
          response.auction.currentPrice >= response.auction.reservePrice,
      });

      return response;
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Bid could not be placed');
      }

      throw error;
    }
  }

  async listAuctionBids(userId: string, auctionId: string) {
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

    const bids = (await this.prisma.bid.findMany({
      where: {
        auctionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })) as BidRecord[];

    return bidHistoryResponseSchema.parse({
      bids: bids.map((bid) => this.toContractBid(bid)),
    });
  }

  private toContractBid(bid: BidRecord): Bid {
    return {
      id: bid.id,
      auctionId: bid.auctionId,
      bidderUserId: bid.bidderUserId,
      amount: toNumber(bid.amount),
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
      updatedAt: bid.updatedAt.toISOString(),
    };
  }

  private toContractAuction(auction: AuctionForBidRecord) {
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
      status: auction.status,
      bidCount: auction.bidCount,
      winnerBidId: auction.winnerBidId,
      buyNowPrice:
        auction.buyNowPrice === null ? null : toNumber(auction.buyNowPrice),
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
    };
  }
}

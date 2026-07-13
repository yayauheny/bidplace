import {
  type AuctionEndedEventPayload,
  auctionEndedEventPayloadSchema,
} from '@bidplace/contracts';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../core/database';
import { RealtimeEventsService } from '../core/realtime';

type NumericLike = number | { toNumber(): number };

type AuctionClosingRecord = {
  id: string;
  reservePrice: NumericLike;
  currentPrice: NumericLike;
  bidCount: number;
  winnerBidId: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';
  startsAt: Date;
  endsAt: Date;
};

type ClosingBidRecord = {
  id: string;
  amount: NumericLike;
};

function toNumber(value: NumericLike): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function toMinorUnits(value: number): number {
  return Math.round(value * 100);
}

type AuctionRealtimePublication = {
  auctionId: string;
  currentPrice: number;
  bidCount: number;
  status: 'active' | 'sold' | 'failed';
  endsAt: string;
  winnerBidId: string | null;
  reserveReached: boolean;
};

@Injectable()
export class AuctionClosingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

  async activateScheduledAuctions(now = new Date()): Promise<string[]> {
    const auctions = await this.prisma.auction.findMany({
      where: {
        status: 'scheduled',
        startsAt: {
          lte: now,
        },
      },
      select: {
        id: true,
      },
    });

    const activatedAuctionIds: string[] = [];

    for (const auction of auctions) {
      const activatedAuctionId = await this.activateAuctionById(auction.id, now);

      if (activatedAuctionId) {
        activatedAuctionIds.push(activatedAuctionId);
      }
    }

    return activatedAuctionIds;
  }

  async closeExpiredAuctions(now = new Date()): Promise<AuctionEndedEventPayload[]> {
    const auctions = await this.prisma.auction.findMany({
      where: {
        status: 'active',
        endsAt: {
          lte: now,
        },
      },
      select: {
        id: true,
      },
    });

    const endedAuctions: AuctionEndedEventPayload[] = [];

    for (const auction of auctions) {
      const endedAuction = await this.closeAuctionById(auction.id, now);

      if (endedAuction) {
        endedAuctions.push(endedAuction);
      }
    }

    return endedAuctions;
  }

  async closeAuctionById(
    auctionId: string,
    now = new Date(),
  ): Promise<AuctionEndedEventPayload | null> {
    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const auction = (await tx.auction.findUnique({
          where: {
            id: auctionId,
          },
          select: {
            id: true,
            reservePrice: true,
            currentPrice: true,
            bidCount: true,
            winnerBidId: true,
            status: true,
            endsAt: true,
          },
        })) as AuctionClosingRecord | null;

        if (!auction || auction.status !== 'active' || auction.endsAt > now) {
          return null;
        }

        const winningBid = (await tx.bid.findFirst({
          where: {
            auctionId,
          },
          orderBy: [{ amount: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            amount: true,
          },
        })) as ClosingBidRecord | null;

        const reserveReached =
          winningBid !== null &&
          toMinorUnits(toNumber(winningBid.amount)) >=
            toMinorUnits(toNumber(auction.reservePrice));

        if (reserveReached && winningBid) {
          const updatedAuction = await tx.auction.updateMany({
            where: {
              id: auctionId,
              status: 'active',
              endsAt: {
                lte: now,
              },
            },
            data: {
              status: 'sold',
              winnerBidId: winningBid.id,
            },
          });

          if (updatedAuction.count !== 1) {
            return null;
          }

          await tx.bid.updateMany({
            where: {
              auctionId,
              id: {
                not: winningBid.id,
              },
            },
            data: {
              status: 'lost',
            },
          });

          await tx.bid.update({
            where: {
              id: winningBid.id,
            },
            data: {
              status: 'won',
            },
          });

          return {
            endedPayload: auctionEndedEventPayloadSchema.parse({
              auctionId,
              status: 'sold',
              winnerBidId: winningBid.id,
              reserveReached: true,
            }),
            auctionUpdate: {
              auctionId,
              currentPrice: toNumber(winningBid.amount),
              bidCount: auction.bidCount,
              status: 'sold',
              endsAt: auction.endsAt.toISOString(),
              winnerBidId: winningBid.id,
              reserveReached: true,
            } satisfies AuctionRealtimePublication,
          };
        }

        const updatedAuction = await tx.auction.updateMany({
          where: {
            id: auctionId,
            status: 'active',
            endsAt: {
              lte: now,
            },
          },
          data: {
            status: 'failed',
            winnerBidId: null,
          },
        });

        if (updatedAuction.count !== 1) {
          return null;
        }

        await tx.bid.updateMany({
          where: {
            auctionId,
          },
          data: {
            status: 'lost',
          },
        });

        return {
          endedPayload: auctionEndedEventPayloadSchema.parse({
            auctionId,
            status: 'failed',
            winnerBidId: null,
            reserveReached: false,
          }),
          auctionUpdate: {
            auctionId,
            currentPrice: toNumber(auction.currentPrice),
            bidCount: auction.bidCount,
            status: 'failed',
            endsAt: auction.endsAt.toISOString(),
            winnerBidId: null,
            reserveReached: false,
          } satisfies AuctionRealtimePublication,
        };
      },
    );

    if (!result) {
      return null;
    }

    this.realtimeEventsService.publishAuctionUpdated(result.auctionUpdate);
    this.realtimeEventsService.publishAuctionEnded(result.endedPayload);

    return result.endedPayload;
  }

  private async activateAuctionById(
    auctionId: string,
    now = new Date(),
  ): Promise<string | null> {
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const auction = (await tx.auction.findUnique({
        where: {
          id: auctionId,
        },
        select: {
          id: true,
          reservePrice: true,
          currentPrice: true,
          bidCount: true,
          winnerBidId: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
      })) as AuctionClosingRecord | null;

      if (!auction || auction.status !== 'scheduled' || auction.startsAt > now) {
        return null;
      }

      const updatedAuction = await tx.auction.updateMany({
        where: {
          id: auctionId,
          status: 'scheduled',
          startsAt: {
            lte: now,
          },
        },
        data: {
          status: 'active',
        },
      });

      if (updatedAuction.count !== 1) {
        return null;
      }

      return {
        auctionId,
        auctionUpdate: {
          auctionId,
          currentPrice: toNumber(auction.currentPrice),
          bidCount: auction.bidCount,
          status: 'active',
          endsAt: auction.endsAt.toISOString(),
          winnerBidId: auction.winnerBidId,
          reserveReached:
            toMinorUnits(toNumber(auction.currentPrice)) >=
            toMinorUnits(toNumber(auction.reservePrice)),
        } satisfies AuctionRealtimePublication,
      };
    });

    if (!result) {
      return null;
    }

    this.realtimeEventsService.publishAuctionUpdated(result.auctionUpdate);

    return result.auctionId;
  }
}

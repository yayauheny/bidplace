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
  endsAt: Date;
};

type ClosingBidRecord = {
  id: string;
  amount: NumericLike;
};

function toNumber(value: NumericLike): number {
  return typeof value === 'number' ? value : value.toNumber();
}

@Injectable()
export class AuctionClosingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

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
    return this.prisma.$transaction(
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
          toNumber(winningBid.amount) >= toNumber(auction.reservePrice);

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

          const payload = auctionEndedEventPayloadSchema.parse({
            auctionId,
            status: 'sold',
            winnerBidId: winningBid.id,
            reserveReached: true,
          });

          this.realtimeEventsService.publishAuctionUpdated({
            auctionId,
            currentPrice: toNumber(winningBid.amount),
            bidCount: auction.bidCount,
            status: 'sold',
            endsAt: auction.endsAt.toISOString(),
            winnerBidId: winningBid.id,
            reserveReached: true,
          });

          this.realtimeEventsService.publishAuctionEnded(payload);

          return payload;
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

        const payload = auctionEndedEventPayloadSchema.parse({
          auctionId,
          status: 'failed',
          winnerBidId: null,
          reserveReached: false,
        });

        this.realtimeEventsService.publishAuctionUpdated({
          auctionId,
          currentPrice: toNumber(auction.currentPrice),
          bidCount: auction.bidCount,
          status: 'failed',
          endsAt: auction.endsAt.toISOString(),
          winnerBidId: null,
          reserveReached: false,
        });

        this.realtimeEventsService.publishAuctionEnded(payload);

        return payload;
      },
    );
  }
}

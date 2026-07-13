import {
  type Auction,
  type AuctionEndedEventPayload,
  type Bid,
  auctionEndedEventPayloadSchema,
} from '@bidplace/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import {
  canActivateAuction,
  canCloseAuction,
  eligibleBidStatuses,
  findHighestEligibleBid,
  reserveReached,
} from '../core/auction';
import { PrismaService, runSerializableTransaction } from '../core/database';
import { Clock } from '../core/time';
import {
  mapAuctionEndedEventPayload,
  mapAuctionUpdatedEventPayload,
  RealtimeEventsService,
} from '../core/realtime';

const lifecycleAuctionSelect = {
  id: true,
  reservePrice: true,
  currentPrice: true,
  bidCount: true,
  winnerBidId: true,
  status: true,
  startsAt: true,
  endsAt: true,
};

type LifecycleAuctionRecord = {
  id: string;
  reservePrice: Decimal;
  currentPrice: Decimal;
  bidCount: number;
  winnerBidId: string | null;
  status: Auction['status'];
  startsAt: Date;
  endsAt: Date;
};

const lifecycleBidSelect = {
  id: true,
  amount: true,
  status: true,
  createdAt: true,
};

type LifecycleBidRecord = {
  id: string;
  amount: Decimal;
  status: Bid['status'];
  createdAt: Date;
};

const LIFECYCLE_BATCH_SIZE = 100;

@Injectable()
export class AuctionLifecycleService {
  private readonly logger = new Logger(AuctionLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeEventsService: RealtimeEventsService,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  async runLifecycleCycle(now = this.clock.now()): Promise<void> {
    await this.closeExpiredAuctions(now);
    await this.activateScheduledAuctions(now);
  }

  async activateScheduledAuctions(now = this.clock.now()): Promise<string[]> {
    const activatedAuctionIds: string[] = [];
    let hasMore = true;

    while (hasMore) {
      const auctions = await this.prisma.auction.findMany({
        where: {
          status: 'scheduled',
          startsAt: {
            lte: now,
          },
          endsAt: {
            gt: now,
          },
        },
        select: {
          id: true,
        },
        take: LIFECYCLE_BATCH_SIZE,
        orderBy: [{ startsAt: 'asc' }, { endsAt: 'asc' }, { id: 'asc' }],
      });

      if (auctions.length === 0) {
        break;
      }

      for (const auction of auctions) {
        try {
          const activatedAuctionId = await this.activateAuctionById(
            auction.id,
            now,
          );

          if (activatedAuctionId) {
            activatedAuctionIds.push(activatedAuctionId);
          }
        } catch (error) {
          this.logAuctionError('activate', auction.id, error);
        }
      }

      if (auctions.length < LIFECYCLE_BATCH_SIZE) {
        hasMore = false;
      }
    }

    return activatedAuctionIds;
  }

  async closeExpiredAuctions(now = this.clock.now()): Promise<AuctionEndedEventPayload[]> {
    const endedAuctions: AuctionEndedEventPayload[] = [];
    let hasMore = true;

    while (hasMore) {
      const auctions = await this.prisma.auction.findMany({
        where: {
          status: {
            in: ['scheduled', 'active'],
          },
          endsAt: {
            lte: now,
          },
        },
        select: {
          id: true,
        },
        take: LIFECYCLE_BATCH_SIZE,
        orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
      });

      if (auctions.length === 0) {
        break;
      }

      for (const auction of auctions) {
        try {
          const endedAuction = await this.closeAuctionById(auction.id, now);

          if (endedAuction) {
            endedAuctions.push(endedAuction);
          }
        } catch (error) {
          this.logAuctionError('close', auction.id, error);
        }
      }

      if (auctions.length < LIFECYCLE_BATCH_SIZE) {
        hasMore = false;
      }
    }

    return endedAuctions;
  }

  async closeAuctionById(
    auctionId: string,
    now = this.clock.now(),
  ): Promise<AuctionEndedEventPayload | null> {
    const result = await runSerializableTransaction(this.prisma, async (tx) => {
      const auction: LifecycleAuctionRecord | null = await tx.auction.findUnique({
        where: {
          id: auctionId,
        },
        select: lifecycleAuctionSelect,
      });

      if (!auction || !canCloseAuction(auction.status, auction.endsAt, now)) {
        return null;
      }

      const eligibleBids: LifecycleBidRecord[] = await tx.bid.findMany({
        where: {
          auctionId,
          status: {
            in: eligibleBidStatuses,
          },
        },
        select: lifecycleBidSelect,
        orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });

      const winningBid = findHighestEligibleBid(eligibleBids);
      const closingPrice = winningBid?.amount ?? auction.currentPrice;
      const reserveMet = reserveReached(closingPrice, auction.reservePrice);
      const sold = reserveMet && winningBid !== null;

      const updatedAuction = await tx.auction.updateMany({
        where: {
          id: auctionId,
          status: {
            in: ['scheduled', 'active'],
          },
          endsAt: {
            lte: now,
          },
        },
        data: {
          status: sold ? 'sold' : 'failed',
          winnerBidId: sold && winningBid ? winningBid.id : null,
        },
      });

      if (updatedAuction.count !== 1) {
        return null;
      }

      if (sold && winningBid) {
        await tx.bid.updateMany({
          where: {
            auctionId,
            status: {
              in: eligibleBidStatuses,
            },
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
      } else {
        await tx.bid.updateMany({
          where: {
            auctionId,
            status: {
              in: eligibleBidStatuses,
            },
          },
          data: {
            status: 'lost',
          },
        });
      }

      return {
        endedPayload: auctionEndedEventPayloadSchema.parse(
          mapAuctionEndedEventPayload({
            auctionId,
            status: sold ? 'sold' : 'failed',
            winnerBidId: sold && winningBid ? winningBid.id : null,
            reserveReached: reserveMet,
          }),
        ),
        auctionUpdate: mapAuctionUpdatedEventPayload(
          {
            id: auctionId,
            currentPrice: sold && winningBid ? winningBid.amount.toNumber() : auction.currentPrice.toNumber(),
            bidCount: auction.bidCount,
            status: sold ? 'sold' : 'failed',
            endsAt: auction.endsAt.toISOString(),
            winnerBidId: sold && winningBid ? winningBid.id : null,
          },
          reserveMet,
        ),
      };
    });

    if (!result) {
      return null;
    }

    this.realtimeEventsService.publishAuctionUpdated(result.auctionUpdate);
    this.realtimeEventsService.publishAuctionEnded(result.endedPayload);

    return result.endedPayload;
  }

  private async activateAuctionById(
    auctionId: string,
    now = this.clock.now(),
  ): Promise<string | null> {
    const result = await runSerializableTransaction(this.prisma, async (tx) => {
      const auction: LifecycleAuctionRecord | null = await tx.auction.findUnique({
        where: {
          id: auctionId,
        },
        select: lifecycleAuctionSelect,
      });

      if (
        !auction ||
        !canActivateAuction(auction.status, auction.startsAt, auction.endsAt, now)
      ) {
        return null;
      }

      const updatedAuction = await tx.auction.updateMany({
        where: {
          id: auctionId,
          status: 'scheduled',
          startsAt: {
            lte: now,
          },
          endsAt: {
            gt: now,
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
        auctionUpdate: mapAuctionUpdatedEventPayload(
          {
            id: auctionId,
            currentPrice: auction.currentPrice.toNumber(),
            bidCount: auction.bidCount,
            status: 'active',
            endsAt: auction.endsAt.toISOString(),
            winnerBidId: auction.winnerBidId,
          },
          reserveReached(auction.currentPrice, auction.reservePrice),
        ),
      };
    });

    if (!result) {
      return null;
    }

    this.realtimeEventsService.publishAuctionUpdated(result.auctionUpdate);

    return result.auctionId;
  }

  private logAuctionError(
    action: 'activate' | 'close',
    auctionId: string,
    error: unknown,
  ): void {
    const message =
      error instanceof Error ? error.message : 'Unknown lifecycle error';
    const stack = error instanceof Error ? error.stack : undefined;

    this.logger.error(
      `Failed to ${action} auction ${auctionId}: ${message}`,
      stack,
    );
  }
}

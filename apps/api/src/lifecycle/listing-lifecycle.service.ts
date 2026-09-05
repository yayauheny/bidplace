import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService, runSerializableTransaction } from '../core/database';
import { PublicIdService } from '../core/public-id';
import {
  createWinnerOrder,
  WINNER_BID_ORDER_BY,
} from '../orders/create-winner-order';
import { computeOrderContactDueAt } from '../orders/order-contact-deadline';
import { RealtimeService } from '../realtime/realtime.service';
import { Clock } from '../core/time';

@Injectable()
export class ListingLifecycleService {
  private readonly logger = new Logger(ListingLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly publicIds: PublicIdService,
    private readonly realtime: RealtimeService,
  ) {}

  @Cron('*/30 * * * * *', { waitForCompletion: true })
  async run(): Promise<void> {
    const now = this.clock.now();

    const scheduled = await this.prisma.listing.findMany({
      where: {
        status: 'SCHEDULED',
        startsAt: { lte: now },
        endsAt: { gt: now },
        product: {
          status: 'APPROVED',
          sellerProfile: {
            status: 'APPROVED',
            handoffContactType: { not: null },
            handoffContactValue: { not: null },
          },
        },
      },
      select: { id: true, currentPrice: true, bidCount: true, endsAt: true },
    });

    for (const listing of scheduled) {
      try {
        const activated = await this.prisma.listing.updateMany({
          where: {
            id: listing.id,
            status: 'SCHEDULED',
            product: {
              status: 'APPROVED',
              sellerProfile: {
                status: 'APPROVED',
                handoffContactType: { not: null },
                handoffContactValue: { not: null },
              },
            },
          },
          data: { status: 'LIVE' },
        });

        if (activated.count === 1) {
          this.realtime.emit(listing.id, 'listing.updated', {
            listingId: listing.id,
            currentPrice: listing.currentPrice.toNumber(),
            bidCount: listing.bidCount,
            status: 'LIVE',
            endsAt: listing.endsAt.toISOString(),
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to activate SCHEDULED Listing ${listing.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    const expired = await this.prisma.listing.findMany({
      where: { status: 'LIVE', endsAt: { lte: now } },
      select: { id: true },
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
    });

    for (const listing of expired) {
      try {
        await this.close(listing.id, now);
      } catch (error) {
        this.logger.error(
          `Failed to close expired Listing ${listing.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  async close(listingId: string, now = this.clock.now()): Promise<boolean> {
    const closed = await runSerializableTransaction(this.prisma, async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          status: true,
          endsAt: true,
          currentPrice: true,
          bidCount: true,
        },
      });

      if (!listing || listing.status !== 'LIVE' || listing.endsAt > now) {
        return null;
      }

      const update = await tx.listing.updateMany({
        where: { id: listingId, status: 'LIVE', endsAt: { lte: now } },
        data: { status: 'ENDED', closedAt: now },
      });

      if (update.count !== 1) {
        return null;
      }

      return {
        listingId,
        currentPrice: listing.currentPrice.toNumber(),
        bidCount: listing.bidCount,
        status: 'ENDED' as const,
        endsAt: listing.endsAt.toISOString(),
      };
    });

    if (!closed) {
      return false;
    }

    this.realtime.emit(listingId, 'listing.ended', closed);

    try {
      await this.ensureWinnerOrder(listingId, now);
    } catch (error) {
      this.logger.error(
        `Listing ${listingId} ended without Order: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return true;
  }

  private async ensureWinnerOrder(
    listingId: string,
    now: Date,
  ): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        product: {
          include: {
            sellerProfile: true,
          },
        },
      },
    });

    if (!listing || listing.status !== 'ENDED') {
      return;
    }

    const winner = await this.prisma.bid.findFirst({
      where: { listingId },
      orderBy: WINNER_BID_ORDER_BY,
    });

    if (!winner) {
      return;
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: winner.bidderUserId },
      select: { email: true },
    });

    if (!buyer) {
      this.logger.error(
        `Listing ${listing.id} ended without Order: winning buyer ${winner.bidderUserId} is missing`,
      );
      return;
    }

    const sellerProfile = listing.product.sellerProfile;
    if (
      !sellerProfile.handoffContactType ||
      !sellerProfile.handoffContactValue
    ) {
      this.logger.error(
        `Listing ${listing.id} ended without Order: seller handoff contact is missing`,
      );
      return;
    }

    await createWinnerOrder(this.prisma, {
      listingId: listing.id,
      sellerId: sellerProfile.userId,
      buyerId: winner.bidderUserId,
      sourceBidId: winner.id,
      finalAmount: winner.amount,
      contactDueAt: computeOrderContactDueAt(now),
      sellerHandoffType: sellerProfile.handoffContactType,
      sellerHandoffValue: sellerProfile.handoffContactValue,
      buyerEmailAtClose: buyer.email,
      handoffInitiator: sellerProfile.handoffInitiator,
      generatePublicId: () => this.publicIds.generate(),
    });
  }
}

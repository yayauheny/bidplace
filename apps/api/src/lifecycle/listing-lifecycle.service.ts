import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { canCancelExpiredScheduledListing } from '../core/auction';
import { CommerceCapability } from '../core/commerce';
import { PrismaService, runSerializableTransaction } from '../core/database';
import { PublicIdService } from '../core/public-id';
import { Clock } from '../core/time';
import {
  createWinnerOrder,
  WINNER_BID_ORDER_BY,
} from '../orders/create-winner-order';
import { RealtimeService } from '../realtime/realtime.service';
import { sellerProfileHandoffSelect } from '../sellers/seller-profile.mapper';

export const EXPIRED_SCHEDULED_AUDIT_REASON = 'EXPIRED_SCHEDULED_WINDOW';
export const LIFECYCLE_TICK_BATCH_SIZE = 50;

const lifecycleTickOrderBy = [
  { endsAt: 'asc' as const },
  { id: 'asc' as const },
];

@Injectable()
export class ListingLifecycleService {
  private readonly logger = new Logger(ListingLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly publicIds: PublicIdService,
    private readonly realtime: RealtimeService,
    private readonly commerce: CommerceCapability,
  ) {}

  @Cron('*/30 * * * * *', { waitForCompletion: true })
  async run(): Promise<void> {
    if (!this.commerce.isEnabled()) {
      return;
    }

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
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take: LIFECYCLE_TICK_BATCH_SIZE,
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

    const expiredScheduled = await this.prisma.listing.findMany({
      where: {
        status: 'SCHEDULED',
        endsAt: { lte: now },
      },
      select: { id: true },
      orderBy: lifecycleTickOrderBy,
      take: LIFECYCLE_TICK_BATCH_SIZE,
    });

    for (const listing of expiredScheduled) {
      try {
        await this.cancelExpiredScheduled(listing.id, now);
      } catch (error) {
        this.logger.error(
          `Failed to cancel expired SCHEDULED Listing ${listing.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    const expired = await this.prisma.listing.findMany({
      where: { status: 'LIVE', endsAt: { lte: now } },
      select: { id: true },
      orderBy: lifecycleTickOrderBy,
      take: LIFECYCLE_TICK_BATCH_SIZE,
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
    if (!this.commerce.isEnabled()) {
      return false;
    }

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

  private async cancelExpiredScheduled(
    listingId: string,
    now: Date,
  ): Promise<boolean> {
    const cancelled = await runSerializableTransaction(
      this.prisma,
      async (tx) => {
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

        if (
          !listing ||
          !canCancelExpiredScheduledListing(
            listing.status,
            listing.endsAt,
            now,
          )
        ) {
          return null;
        }

        const update = await tx.listing.updateMany({
          where: {
            id: listingId,
            status: 'SCHEDULED',
            endsAt: { lte: now },
          },
          data: { status: 'CANCELLED', closedAt: now },
        });

        if (update.count !== 1) {
          return null;
        }

        await tx.auditEvent.create({
          data: {
            actorUserId: null,
            targetType: 'LISTING',
            targetId: listing.id,
            oldStatus: 'SCHEDULED',
            newStatus: 'CANCELLED',
            reason: EXPIRED_SCHEDULED_AUDIT_REASON,
          },
        });

        return {
          listingId: listing.id,
          currentPrice: listing.currentPrice.toNumber(),
          bidCount: listing.bidCount,
          status: 'CANCELLED' as const,
          endsAt: listing.endsAt.toISOString(),
        };
      },
    );

    if (!cancelled) {
      return false;
    }

    this.realtime.emit(listingId, 'listing.updated', cancelled);
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
            sellerProfile: { select: sellerProfileHandoffSelect },
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
      now,
      sellerHandoffType: sellerProfile.handoffContactType,
      sellerHandoffValue: sellerProfile.handoffContactValue,
      buyerEmailAtClose: buyer.email,
      handoffInitiator: sellerProfile.handoffInitiator,
      generatePublicId: () => this.publicIds.generate(),
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { type Prisma } from '@bidplace/database';

import { PrismaService, runSerializableTransaction } from '../core/database';
import { PublicIdService } from '../core/public-id';
import { RealtimeService } from '../realtime/realtime.service';
import { Clock } from '../core/time';

type CloseListing = Prisma.ListingGetPayload<{
  include: {
    product: {
      include: {
        sellerProfile: true;
      };
    };
  };
}>;

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
    }

    const expired = await this.prisma.listing.findMany({
      where: { status: 'LIVE', endsAt: { lte: now } },
      select: { id: true },
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
    });

    for (const listing of expired) {
      await this.close(listing.id, now);
    }
  }

  async close(listingId: string, now = this.clock.now()): Promise<boolean> {
    const closed = await runSerializableTransaction(this.prisma, async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        include: {
          product: {
            include: {
              sellerProfile: true,
            },
          },
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

      const winner = await tx.bid.findFirst({
        where: { listingId },
        orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });

      if (winner) {
        await this.tryCreateWinnerOrder(tx, listing, winner, now);
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
    return true;
  }

  private async tryCreateWinnerOrder(
    tx: Prisma.TransactionClient,
    listing: CloseListing,
    winner: { id: string; bidderUserId: string; amount: Prisma.Decimal },
    now: Date,
  ): Promise<void> {
    const buyer = await tx.user.findUnique({
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

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await tx.order.create({
          data: {
            publicId: this.publicIds.generate(),
            listingId: listing.id,
            sellerId: sellerProfile.userId,
            buyerId: winner.bidderUserId,
            sourceBidId: winner.id,
            finalAmount: winner.amount,
            contactDueAt: new Date(now.getTime() + 86_400_000),
            sellerHandoffType: sellerProfile.handoffContactType,
            sellerHandoffValue: sellerProfile.handoffContactValue,
            buyerEmailAtClose: buyer.email,
            handoffInitiator: sellerProfile.handoffInitiator,
          },
        });
        return;
      } catch (error) {
        if (
          !(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
          )
        ) {
          throw error;
        }

        if (attempt === 4) {
          this.logger.error(
            `Listing ${listing.id} ended without Order: could not assign Order public identifier`,
          );
        }
      }
    }
  }
}

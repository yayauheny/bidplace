import { type BidCreateRequest, type PaginationQuery } from '@bidplace/contracts';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Clock } from '../core/time';
import { resolveMinimumNextBid, resolveSoftCloseEndsAt, toDecimalAmount } from '../core/auction';
import { PrismaService, runSerializableTransaction } from '../core/database';
import { RealtimeService } from '../realtime/realtime.service';
import {
  assertBidEligibility,
  bidEligibilityUserSelect,
} from './bid-eligibility';

@Injectable()
export class BidsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly realtime: RealtimeService,
  ) {}

  async place(
    userId: string,
    listingId: string,
    idempotencyKey: string,
    input: BidCreateRequest,
  ) {
    if (!idempotencyKey || idempotencyKey.length > 80) {
      throw new BadRequestException('Idempotency-Key is required');
    }

    const amount = toDecimalAmount(input.amount);

    const result = await runSerializableTransaction(this.prisma, async (tx) => {
      const replay = await tx.bid.findUnique({
        where: {
          bidderUserId_idempotencyKey: { bidderUserId: userId, idempotencyKey },
        },
      });

      if (replay) {
        if (replay.listingId !== listingId || !replay.amount.equals(amount)) {
          throw new ConflictException('Idempotency key does not match request');
        }

        return { bid: replay, replay: true };
      }

      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        include: {
          auctionRules: true,
          product: { include: { sellerProfile: true } },
        },
      });

      if (!listing || !listing.auctionRules) {
        throw new NotFoundException('Listing not found');
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: bidEligibilityUserSelect,
      });

      assertBidEligibility(user);

      const now = this.clock.now();

      if (listing.product.sellerProfile.userId === userId) {
        throw new ForbiddenException('Cannot bid on your own Listing');
      }

      if (listing.status !== 'LIVE' || listing.startsAt > now || listing.endsAt <= now) {
        throw new ConflictException('Listing is not open for bids');
      }

      const minimum = resolveMinimumNextBid(listing.currentPrice);

      if (amount.lessThan(minimum)) {
        throw new BadRequestException(`Bid must be at least ${minimum.toFixed(2)}`);
      }

      const endsAt = resolveSoftCloseEndsAt(
        listing.endsAt,
        listing.originalEndsAt,
        now,
        listing.auctionRules.softCloseWindowSeconds,
        listing.auctionRules.softCloseExtensionSeconds,
        listing.auctionRules.softCloseMaxTotalSeconds,
      );

      const updated = await tx.listing.updateMany({
        where: {
          id: listingId,
          status: 'LIVE',
          currentPrice: listing.currentPrice,
          endsAt: listing.endsAt,
        },
        data: {
          currentPrice: amount,
          bidCount: { increment: 1 },
          endsAt,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('Listing changed while placing bid');
      }

      const bid = await tx.bid.create({
        data: { listingId, bidderUserId: userId, idempotencyKey, amount },
      });

      return { bid, replay: false };
    });

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { auctionRules: true },
    });

    if (!listing?.auctionRules) {
      throw new NotFoundException('Listing not found');
    }

    const response = {
      bid: {
        id: result.bid.id,
        listingId: result.bid.listingId,
        amount: result.bid.amount.toNumber(),
        createdAt: result.bid.createdAt.toISOString(),
        bidderAlias: `Bidder ${result.bid.bidderUserId.slice(0, 6)}`,
      },
      listing: {
        id: listing.id,
        productId: listing.productId,
        type: 'AUCTION' as const,
        status: listing.status,
        currency: 'BYN' as const,
        startsAt: listing.startsAt.toISOString(),
        originalEndsAt: listing.originalEndsAt.toISOString(),
        endsAt: listing.endsAt.toISOString(),
        currentPrice: listing.currentPrice.toNumber(),
        bidCount: listing.bidCount,
        closedAt: listing.closedAt?.toISOString() ?? null,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        auctionRules: {
          startPrice: listing.auctionRules.startPrice.toNumber(),
          incrementPolicyCode: 'MVP_BYN_V1' as const,
          softCloseWindowSeconds: 60 as const,
          softCloseExtensionSeconds: 60 as const,
          softCloseMaxTotalSeconds: 600 as const,
        },
      },
      minimumNextBid: resolveMinimumNextBid(listing.currentPrice).toNumber(),
    };

    if (!result.replay) {
      this.realtime.emit(listingId, 'bid.placed', {
        listingId,
        currentPrice: response.listing.currentPrice,
        bidCount: response.listing.bidCount,
        status: response.listing.status,
        endsAt: response.listing.endsAt,
        bid: response.bid,
      });
    }

    return response;
  }

  async list(listingId: string, query: PaginationQuery) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const where = { listingId };
    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where,
        select: {
          id: true,
          listingId: true,
          amount: true,
          createdAt: true,
          bidderUserId: true,
        },
        orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.bid.count({ where }),
    ]);

    return {
      bids: bids.map((bid) => ({
        id: bid.id,
        listingId: bid.listingId,
        amount: bid.amount.toNumber(),
        createdAt: bid.createdAt.toISOString(),
        bidderAlias: `Bidder ${bid.bidderUserId.slice(0, 6)}`,
      })),
      pagination: { ...query, total },
    };
  }
}

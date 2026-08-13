import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../core/database';
@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}
  async get(userId: string) {
    const bids = await this.prisma.bid.findMany({
      where: { bidderUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            auctionRules: true,
            product: true,
            orders: true,
            bids: {
              orderBy: [
                { amount: 'desc' },
                { createdAt: 'asc' },
                { id: 'asc' },
              ],
              take: 1,
            },
          },
        },
      },
    });
    const seen = new Set<string>();
    return {
      activity: bids
        .filter((bid) => {
          if (seen.has(bid.listingId)) return false;
          seen.add(bid.listingId);
          return true;
        })
        .map((bid) => {
          const { listing } = bid;
          const order =
            listing.orders.find((candidate) => candidate.buyerId === userId) ??
            null;
          const leading = listing.bids[0]?.id === bid.id;
          const status =
            order?.status === 'PENDING_CONTACT'
              ? 'AWAITING_SELLER_CONTACT'
              : order?.status === 'COMPLETED'
                ? 'COMPLETED'
                : order?.status === 'CANCELLED'
                  ? 'WIN_CANCELLED'
                  : listing.status === 'LIVE'
                    ? leading
                      ? 'LEADING'
                      : 'OUTBID'
                    : listing.status === 'ENDED'
                      ? leading
                        ? 'WON'
                        : 'LOST'
                      : 'OUTBID';
          if (!listing.auctionRules)
            throw new InternalServerErrorException('Listing rules are missing');
          if (!listing.product.title)
            throw new InternalServerErrorException(
              'Public listing product is missing a title',
            );
          return {
            status,
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
            product: {
              publicId: listing.product.publicId,
              title: listing.product.title,
            },
            orderPublicId: order?.publicId ?? null,
          };
        }),
    };
  }
}

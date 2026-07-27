import { type ListingCreateRequest, type SellerStatus } from '@bidplace/contracts';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@bidplace/database';

import { canCancelListing, canScheduleListing } from '../core/auction';
import { PrismaService } from '../core/database';
import { assertApprovedSeller } from '../sellers/seller-capability';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, productId: string, input: ListingCreateRequest) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        status: true,
        sellerProfile: { select: { userId: true, status: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Product is not owned by user');
    }

    assertApprovedSeller(product.sellerProfile.status as SellerStatus);

    if (product.status !== 'APPROVED') {
      throw new ConflictException('Product must be approved before scheduling');
    }

    const listing = await this.prisma.listing.create({
      data: {
        productId,
        startsAt: new Date(input.startsAt),
        originalEndsAt: new Date(input.endsAt),
        endsAt: new Date(input.endsAt),
        currentPrice: new Decimal(input.startPrice),
        auctionRules: {
          create: { startPrice: new Decimal(input.startPrice) },
        },
      },
      include: { auctionRules: true },
    });

    return this.response(listing);
  }

  async get(userId: string, role: string, id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        auctionRules: true,
        product: { include: { sellerProfile: true } },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (role !== 'admin' && listing.product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Listing is not available');
    }

    return this.response(listing);
  }

  async transition(
    userId: string,
    listingId: string,
    action: 'SCHEDULE' | 'CANCEL',
    now = new Date(),
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        product: { include: { sellerProfile: true } },
        auctionRules: true,
      },
    });

    if (!listing || !listing.auctionRules) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Listing is not owned by user');
    }

    assertApprovedSeller(listing.product.sellerProfile.status as SellerStatus);

    if (action === 'CANCEL') {
      if (!canCancelListing(listing.status)) {
        throw new ConflictException('Listing cannot be cancelled');
      }

      return this.response(
        await this.prisma.listing.update({
          where: { id: listingId },
          data: { status: 'CANCELLED' },
          include: { auctionRules: true },
        }),
      );
    }

    if (!canScheduleListing(listing.status)) {
      throw new ConflictException('Listing cannot be scheduled');
    }

    if (listing.product.status !== 'APPROVED') {
      throw new ConflictException('Product must be approved');
    }

    if (listing.startsAt <= now || listing.originalEndsAt <= listing.startsAt) {
      throw new ConflictException('Listing dates are invalid');
    }

    const active = await this.prisma.listing.findFirst({
      where: { productId: listing.productId, status: { in: ['SCHEDULED', 'LIVE'] } },
      select: { id: true },
    });

    if (active) {
      throw new ConflictException('Product already has an active Listing');
    }

    const [updatedListing] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id: listingId },
        data: { status: 'SCHEDULED', endsAt: listing.originalEndsAt },
        include: { auctionRules: true },
      }),
      ...(listing.product.publishedAt
        ? []
        : [
            this.prisma.product.update({
              where: { id: listing.productId },
              data: { publishedAt: now },
            }),
          ]),
    ]);

    return this.response(updatedListing);
  }

  private response(listing: {
    id: string;
    productId: string;
    type: 'AUCTION';
    status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
    currency: string;
    startsAt: Date;
    originalEndsAt: Date;
    endsAt: Date;
    currentPrice: Decimal;
    bidCount: number;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    auctionRules: {
      startPrice: Decimal;
      incrementPolicyCode: string;
      softCloseWindowSeconds: number;
      softCloseExtensionSeconds: number;
      softCloseMaxTotalSeconds: number;
    } | null;
  }) {
    if (!listing.auctionRules) {
      throw new ConflictException('Auction rules are missing');
    }

    const { auctionRules, ...record } = listing;
    const {
      id: _auctionRulesId,
      listingId: _auctionRulesListingId,
      createdAt: _auctionRulesCreatedAt,
      updatedAt: _auctionRulesUpdatedAt,
      ...auctionRulesRecord
    } = auctionRules as typeof auctionRules & {
      id?: string;
      listingId?: string;
      createdAt?: Date;
      updatedAt?: Date;
    };
    void _auctionRulesId;
    void _auctionRulesListingId;
    void _auctionRulesCreatedAt;
    void _auctionRulesUpdatedAt;
    return {
      listing: {
        ...record,
        currency: 'BYN' as const,
        currentPrice: record.currentPrice.toNumber(),
        startsAt: record.startsAt.toISOString(),
        originalEndsAt: record.originalEndsAt.toISOString(),
        endsAt: record.endsAt.toISOString(),
        closedAt: record.closedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        auctionRules: {
          ...auctionRulesRecord,
          startPrice: auctionRules.startPrice.toNumber(),
          incrementPolicyCode: 'MVP_BYN_V1' as const,
          softCloseWindowSeconds: 60 as const,
          softCloseExtensionSeconds: 60 as const,
          softCloseMaxTotalSeconds: 600 as const,
        },
      },
    };
  }
}

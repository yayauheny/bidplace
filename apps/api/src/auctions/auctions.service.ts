import {
  type Auction,
  type AuctionCreateRequest,
  type Bid,
  type Lot,
  type PaginationQuery,
  type PublicBid,
  type AuctionResponse,
  type SellerProfile,
  auctionListResponseSchema,
  auctionResponseSchema,
  publicAuctionDetailResponseSchema,
} from '@bidplace/contracts';
import {
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

type AuctionRecord = {
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
  status: Auction['status'];
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: NumericLike | null;
  createdAt: Date;
  updatedAt: Date;
};

type LotRecord = {
  id: string;
  sellerProfileId: string;
  categoryId: string;
  title: string;
  description: string;
  condition: string;
  images: string[];
  status: Lot['status'];
  createdAt: Date;
  updatedAt: Date;
};

type SellerProfileRecord = {
  id: string;
  userId: string;
  slug: string;
  sellerType: SellerProfile['sellerType'];
  storeName: string;
  country: string;
  contactPreference: string;
  socialLink: string | null;
  shortDescription: string | null;
  status: SellerProfile['status'];
  createdAt: Date;
  updatedAt: Date;
};

type PublicAuctionListRecord = AuctionRecord & {
  lot: LotRecord;
  sellerProfile: SellerProfileRecord;
};

type PublicAuctionDetailRecord = PublicAuctionListRecord & {
  bids: Array<{
    id: string;
    auctionId: string;
    bidderUserId: string;
    amount: NumericLike;
    status: Bid['status'];
    createdAt: Date;
    updatedAt: Date;
  }>;
};

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

function toNumber(value: NumericLike): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function toMinorUnits(value: number): number {
  return Math.round(value * 100);
}

function resolveAuctionStatus(startsAt: Date, now: Date): Auction['status'] {
  return startsAt <= now ? 'active' : 'scheduled';
}

@Injectable()
export class AuctionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

  async listPublicAuctions(
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ) {
    const auctions = (await this.prisma.auction.findMany({
      where: {
        status: {
          in: ['scheduled', 'active'],
        },
        lot: {
          status: 'published',
        },
        sellerProfile: {
          status: 'active',
        },
      },
      include: {
        lot: true,
        sellerProfile: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
    })) as PublicAuctionListRecord[];

    return auctionListResponseSchema.parse({
      auctions: auctions.map((auction) => ({
        auction: this.toContractAuction(auction),
        lot: this.toContractLot(auction.lot),
        sellerProfile: this.toContractSellerProfile(auction.sellerProfile),
      })),
    });
  }

  async getPublicAuction(
    slug: string,
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ) {
    const auction = (await this.prisma.auction.findFirst({
      where: {
        slug,
        status: {
          in: ['scheduled', 'active', 'ended', 'sold', 'failed'],
        },
        lot: {
          status: 'published',
        },
        sellerProfile: {
          status: 'active',
        },
      },
      include: {
        lot: true,
        sellerProfile: true,
        bids: {
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        },
      },
    })) as PublicAuctionDetailRecord | null;

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return publicAuctionDetailResponseSchema.parse({
      auction: this.toContractAuction(auction),
      lot: this.toContractLot(auction.lot),
      sellerProfile: this.toContractSellerProfile(auction.sellerProfile),
      bids: auction.bids.map((bid) => this.toPublicBid(bid)),
    });
  }

  async createAuction(
    userId: string,
    input: AuctionCreateRequest,
  ): Promise<AuctionResponse> {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (sellerProfile.status !== 'active') {
      throw new ForbiddenException('Seller profile is not active');
    }

    const lot = await this.prisma.lot.findUnique({
      where: {
        id: input.lotId,
      },
      select: {
        id: true,
        sellerProfileId: true,
        status: true,
      },
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    if (lot.sellerProfileId !== sellerProfile.id) {
      throw new ForbiddenException('Lot does not belong to seller');
    }

    if (lot.status !== 'draft') {
      throw new ConflictException('Lot is not available for auction');
    }

    const existingAuction = await this.prisma.auction.findFirst({
      where: {
        lotId: input.lotId,
      },
      select: {
        id: true,
      },
    });

    if (existingAuction) {
      throw new ConflictException('Lot already has an auction');
    }

    try {
      const auction = await this.prisma.auction.create({
        data: {
          lotId: input.lotId,
          sellerProfileId: sellerProfile.id,
          slug: input.slug,
          startPrice: input.startPrice,
          reservePrice: input.reservePrice,
          currentPrice: input.startPrice,
          currency: input.currency,
          bidStep: calculateBidStep(input.startPrice),
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          status: 'draft',
          bidCount: 0,
          winnerBidId: null,
          buyNowPrice: input.buyNowPrice ?? null,
        },
      });

      return auctionResponseSchema.parse({
        auction: this.toContractAuction(auction),
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Auction slug already in use');
      }

      throw error;
    }
  }

  async publishAuction(
    userId: string,
    auctionId: string,
  ): Promise<AuctionResponse> {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (sellerProfile.status !== 'active') {
      throw new ForbiddenException('Seller profile is not active');
    }

    const auction = await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: {
        id: true,
        lotId: true,
        sellerProfileId: true,
        startsAt: true,
        status: true,
      },
    });

    if (!auction || auction.sellerProfileId !== sellerProfile.id) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.status !== 'draft') {
      throw new ConflictException('Auction cannot be published');
    }

    const lot = await this.prisma.lot.findUnique({
      where: {
        id: auction.lotId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    if (lot.status !== 'draft') {
      throw new ConflictException('Lot is not available for publication');
    }

    const status = resolveAuctionStatus(auction.startsAt, new Date());

    const updatedAuction = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.lot.update({
          where: {
            id: auction.lotId,
          },
          data: {
            status: 'published',
          },
        });

        return tx.auction.update({
          where: {
            id: auctionId,
          },
          data: {
            status,
          },
        });
      },
    );

    const response = auctionResponseSchema.parse({
      auction: this.toContractAuction(updatedAuction),
    });

    this.realtimeEventsService.publishAuctionUpdated({
      auctionId: response.auction.id,
      currentPrice: response.auction.currentPrice,
      bidCount: response.auction.bidCount,
      status: response.auction.status,
      endsAt: response.auction.endsAt,
      winnerBidId: response.auction.winnerBidId,
      reserveReached:
        toMinorUnits(response.auction.currentPrice) >=
        toMinorUnits(response.auction.reservePrice),
    });

    return response;
  }

  private toContractAuction(auction: AuctionRecord): Auction {
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

  private toContractLot(lot: LotRecord): Lot {
    return {
      id: lot.id,
      sellerProfileId: lot.sellerProfileId,
      categoryId: lot.categoryId,
      title: lot.title,
      description: lot.description,
      condition: lot.condition,
      images: lot.images,
      status: lot.status,
      createdAt: lot.createdAt.toISOString(),
      updatedAt: lot.updatedAt.toISOString(),
    };
  }

  private toContractSellerProfile(
    sellerProfile: SellerProfileRecord,
  ): SellerProfile {
    return {
      id: sellerProfile.id,
      userId: sellerProfile.userId,
      slug: sellerProfile.slug,
      sellerType: sellerProfile.sellerType,
      storeName: sellerProfile.storeName,
      country: sellerProfile.country,
      contactPreference: sellerProfile.contactPreference,
      socialLink: sellerProfile.socialLink,
      shortDescription: sellerProfile.shortDescription,
      status: sellerProfile.status,
      createdAt: sellerProfile.createdAt.toISOString(),
      updatedAt: sellerProfile.updatedAt.toISOString(),
    };
  }

  private toContractBid(bid: {
    id: string;
    auctionId: string;
    bidderUserId: string;
    amount: NumericLike;
    status: Bid['status'];
    createdAt: Date;
    updatedAt: Date;
  }) {
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

  private toPublicBid(bid: {
    id: string;
    auctionId: string;
    amount: NumericLike;
    status: Bid['status'];
    createdAt: Date;
    updatedAt: Date;
  }): PublicBid {
    return {
      id: bid.id,
      auctionId: bid.auctionId,
      amount: toNumber(bid.amount),
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
      updatedAt: bid.updatedAt.toISOString(),
    };
  }
}

export { calculateBidStep };

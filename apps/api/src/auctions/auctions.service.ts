import {
  type Auction,
  type AuctionCreateRequest,
  type AuctionResponse,
  type Bid,
  type Lot,
  type PaginationQuery,
  type PublicBid,
  type SellerProfile,
  auctionListResponseSchema,
  auctionResponseSchema,
  publicAuctionDetailResponseSchema,
  sellerAuctionListResponseSchema,
} from '@bidplace/contracts';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import { calculateBidStep, resolvePublishedAuctionStatus, reserveReached, toDecimalAmount } from '../core/auction';
import { PrismaService, runSerializableTransaction } from '../core/database';
import { Clock } from '../core/time';
import { RealtimeEventsService, mapAuctionUpdatedEventPayload } from '../core/realtime';

const auctionContractSelect = {
  id: true,
  lotId: true,
  sellerProfileId: true,
  slug: true,
  startPrice: true,
  reservePrice: true,
  currentPrice: true,
  currency: true,
  bidStep: true,
  startsAt: true,
  endsAt: true,
  status: true,
  bidCount: true,
  winnerBidId: true,
  buyNowPrice: true,
  createdAt: true,
  updatedAt: true,
};

type AuctionContractRecord = {
  id: string;
  lotId: string;
  sellerProfileId: string;
  slug: string;
  startPrice: Decimal;
  reservePrice: Decimal;
  currentPrice: Decimal;
  currency: string;
  bidStep: Decimal;
  startsAt: Date;
  endsAt: Date;
  status: Auction['status'];
  bidCount: number;
  winnerBidId: string | null;
  buyNowPrice: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
};

const lotContractSelect = {
  id: true,
  sellerProfileId: true,
  categoryId: true,
  title: true,
  description: true,
  condition: true,
  images: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

type LotContractRecord = {
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

const sellerProfileContractSelect = {
  id: true,
  userId: true,
  slug: true,
  sellerType: true,
  storeName: true,
  country: true,
  contactPreference: true,
  socialLink: true,
  shortDescription: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

type SellerProfileContractRecord = {
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

const publicBidSelect = {
  id: true,
  auctionId: true,
  bidderUserId: true,
  amount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

type PublicBidRecord = {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amount: Decimal;
  status: Bid['status'];
  createdAt: Date;
  updatedAt: Date;
};

const publicAuctionListSelect = {
  ...auctionContractSelect,
  lot: {
    select: lotContractSelect,
  },
  sellerProfile: {
    select: sellerProfileContractSelect,
  },
};

type PublicAuctionListRecord = AuctionContractRecord & {
  lot: LotContractRecord;
  sellerProfile: SellerProfileContractRecord;
};

type PublicAuctionDetailRecord = PublicAuctionListRecord & {
  bids: PublicBidRecord[];
};

function isUniqueConstraintError(
  error: unknown,
): error is { code: string; meta?: { target?: unknown } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class AuctionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeEventsService: RealtimeEventsService,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  async listMyAuctions(
    userId: string,
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const auctions: AuctionContractRecord[] = await this.prisma.auction.findMany({
      where: {
        sellerProfileId: sellerProfile.id,
      },
      select: auctionContractSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return sellerAuctionListResponseSchema.parse({
      auctions: auctions.map((auction) => this.toContractAuction(auction)),
    });
  }

  async listPublicAuctions(
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ) {
    const auctions: PublicAuctionListRecord[] = await this.prisma.auction.findMany({
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
      select: publicAuctionListSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
    });

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
    const auction: PublicAuctionDetailRecord | null = await this.prisma.auction.findFirst({
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
      select: {
        ...publicAuctionListSelect,
        bids: {
          select: publicBidSelect,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        },
      },
    });

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

    try {
      const auction = await this.prisma.auction.create({
        data: {
          lotId: input.lotId,
          sellerProfileId: sellerProfile.id,
          slug: input.slug,
          startPrice: toDecimalAmount(input.startPrice),
          reservePrice: toDecimalAmount(input.reservePrice),
          currentPrice: toDecimalAmount(input.startPrice),
          currency: input.currency,
          bidStep: calculateBidStep(toDecimalAmount(input.startPrice)),
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          status: 'draft',
          bidCount: 0,
          winnerBidId: null,
          buyNowPrice:
            input.buyNowPrice === undefined || input.buyNowPrice === null
              ? null
              : toDecimalAmount(input.buyNowPrice),
        },
        select: auctionContractSelect,
      });

      return auctionResponseSchema.parse({
        auction: this.toContractAuction(auction),
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        if (uniqueConstraintIncludes(error, 'lot')) {
          throw new ConflictException('Lot already has an auction');
        }

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

    const now = this.clock.now();
    const status = resolvePublishedAuctionStatus(auction.startsAt, now);

    const updatedAuction = await runSerializableTransaction(this.prisma, async (tx) => {
      const updatedLot = await tx.lot.updateMany({
        where: {
          id: auction.lotId,
          status: 'draft',
        },
        data: {
          status: 'published',
        },
      });

      if (updatedLot.count !== 1) {
        throw new ConflictException('Lot is not available for publication');
      }

      const publishedAuction = await tx.auction.updateMany({
        where: {
          id: auctionId,
          status: 'draft',
        },
        data: {
          status,
        },
      });

      if (publishedAuction.count !== 1) {
        throw new ConflictException('Auction cannot be published');
      }

      const latestAuction = await tx.auction.findUnique({
        where: {
          id: auctionId,
        },
        select: auctionContractSelect,
      });

      if (!latestAuction) {
        throw new NotFoundException('Auction not found');
      }

      return latestAuction;
    });

    const response = auctionResponseSchema.parse({
      auction: this.toContractAuction(updatedAuction),
    });

    const reserveMet = reserveReached(
      updatedAuction.currentPrice,
      updatedAuction.reservePrice,
    );

    this.realtimeEventsService.publishAuctionUpdated(
      mapAuctionUpdatedEventPayload(
        response.auction,
        reserveMet,
      ),
    );

    return response;
  }

  private toContractAuction(auction: AuctionContractRecord): Auction {
    return {
      id: auction.id,
      lotId: auction.lotId,
      sellerProfileId: auction.sellerProfileId,
      slug: auction.slug,
      startPrice: auction.startPrice.toNumber(),
      reservePrice: auction.reservePrice.toNumber(),
      currentPrice: auction.currentPrice.toNumber(),
      currency: auction.currency,
      bidStep: auction.bidStep.toNumber(),
      startsAt: auction.startsAt.toISOString(),
      endsAt: auction.endsAt.toISOString(),
      status: auction.status,
      bidCount: auction.bidCount,
      winnerBidId: auction.winnerBidId,
      buyNowPrice:
        auction.buyNowPrice === null ? null : auction.buyNowPrice.toNumber(),
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
    };
  }

  private toContractLot(lot: LotContractRecord): Lot {
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
    sellerProfile: SellerProfileContractRecord,
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

  private toContractBid(bid: PublicBidRecord): Bid {
    return {
      id: bid.id,
      auctionId: bid.auctionId,
      bidderUserId: bid.bidderUserId,
      amount: bid.amount.toNumber(),
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
      updatedAt: bid.updatedAt.toISOString(),
    };
  }

  private toPublicBid(bid: PublicBidRecord): PublicBid {
    return {
      id: bid.id,
      auctionId: bid.auctionId,
      amount: bid.amount.toNumber(),
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
      updatedAt: bid.updatedAt.toISOString(),
    };
  }
}

export { calculateBidStep };

function uniqueConstraintIncludes(
  error: { meta?: { target?: unknown } },
  fieldName: string,
): boolean {
  const target = error.meta?.target;

  if (!Array.isArray(target)) {
    return false;
  }

  return target.some(
    (value) =>
      typeof value === 'string' &&
      value.toLowerCase().includes(fieldName.toLowerCase()),
  );
}

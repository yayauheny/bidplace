import {
  type AuctionCreateRequest,
  type AuctionResponse,
  type PaginationQuery,
  auctionListResponseSchema,
  auctionResponseSchema,
  publicAuctionDetailResponseSchema,
  sellerAuctionListResponseSchema,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  parseAuctionStatus,
  parseLotStatus,
  parseSellerStatus,
} from '../core/contracts';
import {
  calculateBidStep,
  resolvePublishedAuctionStatus,
  reserveReached,
  toDecimalAmount,
} from '../core/auction';
import {
  auctionContractSelect,
  publicAuctionDetailSelect,
  publicAuctionListSelect,
  toAuctionDetailItem,
  toAuctionListItem,
  toContractAuction,
} from './auction.mapper';
import { PrismaService, runSerializableTransaction } from '../core/database';
import { Clock } from '../core/time';
import { RealtimeEventsService, mapAuctionUpdatedEventPayload } from '../core/realtime';

const sellerProfileStatusSelect = {
  id: true,
  status: true,
} satisfies Prisma.SellerProfileSelect;

type SellerProfileStatusRecord = Prisma.SellerProfileGetPayload<{
  select: typeof sellerProfileStatusSelect;
}>;

const lotOwnershipStatusSelect = {
  id: true,
  sellerProfileId: true,
  status: true,
} satisfies Prisma.LotSelect;

type LotOwnershipStatusRecord = Prisma.LotGetPayload<{
  select: typeof lotOwnershipStatusSelect;
}>;

const auctionPublicationSelect = {
  id: true,
  lotId: true,
  sellerProfileId: true,
  startsAt: true,
  status: true,
} satisfies Prisma.AuctionSelect;

type AuctionPublicationRecord = Prisma.AuctionGetPayload<{
  select: typeof auctionPublicationSelect;
}>;

const lotPublicationSelect = {
  id: true,
  status: true,
} satisfies Prisma.LotSelect;

type LotPublicationRecord = Prisma.LotGetPayload<{
  select: typeof lotPublicationSelect;
}>;

export interface AuctionsRepository {
  sellerProfile: {
    findUnique: PrismaService['sellerProfile']['findUnique'];
  };
  lot: {
    findUnique: PrismaService['lot']['findUnique'];
    update: PrismaService['lot']['update'];
    updateMany: PrismaService['lot']['updateMany'];
  };
  auction: {
    findMany: PrismaService['auction']['findMany'];
    findFirst: PrismaService['auction']['findFirst'];
    findUnique: PrismaService['auction']['findUnique'];
    create: PrismaService['auction']['create'];
    update: PrismaService['auction']['update'];
    updateMany: PrismaService['auction']['updateMany'];
  };
  $transaction: PrismaService['$transaction'];
}

export interface AuctionsRealtimePublisher {
  publishAuctionUpdated: RealtimeEventsService['publishAuctionUpdated'];
}

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
    @Inject(PrismaService) private readonly prisma: AuctionsRepository,
    @Inject(RealtimeEventsService)
    private readonly realtimeEventsService: AuctionsRealtimePublisher,
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

    const auctions = await this.prisma.auction.findMany({
      where: {
        sellerProfileId: sellerProfile.id,
      },
      select: auctionContractSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return sellerAuctionListResponseSchema.parse({
      auctions: auctions.map((auction) => toContractAuction(auction)),
    });
  }

  async listPublicAuctions(
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ) {
    const auctions = await this.prisma.auction.findMany({
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
      auctions: auctions.map((auction) => toAuctionListItem(auction)),
    });
  }

  async getPublicAuction(
    slug: string,
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ) {
    const auction = await this.prisma.auction.findFirst({
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
        ...publicAuctionDetailSelect,
        bids: {
          ...publicAuctionDetailSelect.bids,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        },
      },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    const detail = toAuctionDetailItem(auction);

    return publicAuctionDetailResponseSchema.parse(detail);
  }

  async createAuction(
    userId: string,
    input: AuctionCreateRequest,
  ): Promise<AuctionResponse> {
    const sellerProfile: SellerProfileStatusRecord | null =
      await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: sellerProfileStatusSelect,
      });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (parseSellerStatus(sellerProfile.status, sellerProfile.id) !== 'active') {
      throw new ForbiddenException('Seller profile is not active');
    }

    const lot: LotOwnershipStatusRecord | null = await this.prisma.lot.findUnique({
      where: {
        id: input.lotId,
      },
      select: lotOwnershipStatusSelect,
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    if (lot.sellerProfileId !== sellerProfile.id) {
      throw new ForbiddenException('Lot does not belong to seller');
    }

    if (parseLotStatus(lot.status, lot.id) !== 'draft') {
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
        auction: toContractAuction(auction),
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
    const sellerProfile: SellerProfileStatusRecord | null =
      await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: sellerProfileStatusSelect,
      });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (parseSellerStatus(sellerProfile.status, sellerProfile.id) !== 'active') {
      throw new ForbiddenException('Seller profile is not active');
    }

    const auction: AuctionPublicationRecord | null =
      await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: auctionPublicationSelect,
      });

    if (!auction || auction.sellerProfileId !== sellerProfile.id) {
      throw new NotFoundException('Auction not found');
    }

    if (parseAuctionStatus(auction.status, auction.id) !== 'draft') {
      throw new ConflictException('Auction cannot be published');
    }

    const lot: LotPublicationRecord | null = await this.prisma.lot.findUnique({
      where: {
        id: auction.lotId,
      },
      select: lotPublicationSelect,
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    if (parseLotStatus(lot.status, lot.id) !== 'draft') {
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
      auction: toContractAuction(updatedAuction),
    });

    const reserveMet = reserveReached(
      updatedAuction.currentPrice,
      updatedAuction.reservePrice,
    );

    this.realtimeEventsService.publishAuctionUpdated(
      mapAuctionUpdatedEventPayload(response.auction, reserveMet),
    );

    return response;
  }
}

export { calculateBidStep };

function uniqueConstraintIncludes(
  error: { meta?: { target?: unknown } },
  fieldName: string,
): boolean {
  const target = error.meta?.target;

  return Array.isArray(target) && target.some((field) => field === fieldName);
}

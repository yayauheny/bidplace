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
import {
  PrismaService,
  isPrismaUniqueConstraintError,
  runSerializableTransaction,
} from '../core/database';
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
    const sellerProfile = await this.getActiveSellerProfile(userId);
    await this.getOwnedDraftLot(input.lotId, sellerProfile.id);

    try {
      const auction = await this.createDraftAuction(input, sellerProfile.id);

      return this.toAuctionResponse(auction);
    } catch (error: unknown) {
      this.throwCreateAuctionConflict(error);
      throw error;
    }
  }

  async publishAuction(
    userId: string,
    auctionId: string,
  ): Promise<AuctionResponse> {
    const sellerProfile = await this.getActiveSellerProfile(userId);
    const auction = await this.getOwnedDraftAuctionForPublication(
      auctionId,
      sellerProfile.id,
    );
    const lot = await this.getDraftLotForPublication(auction.lotId);
    const now = this.clock.now();
    const status = this.getPublishableAuctionStatus(auction.startsAt, now);
    const updatedAuction = await this.publishDraftAuction(
      auction.id,
      lot.id,
      status,
    );
    const response = this.toAuctionResponse(updatedAuction);

    this.publishAuctionUpdated(response.auction);

    return response;
  }

  private async getActiveSellerProfile(
    userId: string,
  ): Promise<SellerProfileStatusRecord> {
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

    return sellerProfile;
  }

  private async getOwnedDraftLot(
    lotId: string,
    sellerProfileId: string,
  ): Promise<LotOwnershipStatusRecord> {
    const lot: LotOwnershipStatusRecord | null = await this.prisma.lot.findUnique({
      where: {
        id: lotId,
      },
      select: lotOwnershipStatusSelect,
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    if (lot.sellerProfileId !== sellerProfileId) {
      throw new ForbiddenException('Lot does not belong to seller');
    }

    if (parseLotStatus(lot.status, lot.id) !== 'draft') {
      throw new ConflictException('Lot is not available for auction');
    }

    return lot;
  }

  private async createDraftAuction(
    input: AuctionCreateRequest,
    sellerProfileId: string,
  ) {
    const startPrice = toDecimalAmount(input.startPrice);
    const reservePrice = toDecimalAmount(input.reservePrice);

    return this.prisma.auction.create({
      data: {
        lotId: input.lotId,
        sellerProfileId,
        slug: input.slug,
        startPrice,
        reservePrice,
        currentPrice: startPrice,
        currency: input.currency,
        bidStep: calculateBidStep(startPrice),
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
  }

  private throwCreateAuctionConflict(error: unknown): void {
    if (!isPrismaUniqueConstraintError(error)) {
      return;
    }

    if (uniqueConstraintIncludes(error, 'lot')) {
      throw new ConflictException('Lot already has an auction');
    }

    throw new ConflictException('Auction slug already in use');
  }

  private async getOwnedDraftAuctionForPublication(
    auctionId: string,
    sellerProfileId: string,
  ): Promise<AuctionPublicationRecord> {
    const auction: AuctionPublicationRecord | null =
      await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: auctionPublicationSelect,
    });

    if (!auction || auction.sellerProfileId !== sellerProfileId) {
      throw new NotFoundException('Auction not found');
    }

    if (parseAuctionStatus(auction.status, auction.id) !== 'draft') {
      throw new ConflictException('Auction cannot be published');
    }

    return auction;
  }

  private async getDraftLotForPublication(
    lotId: string,
  ): Promise<LotPublicationRecord> {
    const lot: LotPublicationRecord | null = await this.prisma.lot.findUnique({
      where: {
        id: lotId,
      },
      select: lotPublicationSelect,
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    if (parseLotStatus(lot.status, lot.id) !== 'draft') {
      throw new ConflictException('Lot is not available for publication');
    }

    return lot;
  }

  private async publishDraftAuction(
    auctionId: string,
    lotId: string,
    status: 'scheduled' | 'active',
  ) {
    return runSerializableTransaction(this.prisma, async (tx) => {
      const updatedLot = await tx.lot.updateMany({
        where: {
          id: lotId,
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
  }

  private toAuctionResponse(auction: Prisma.AuctionGetPayload<{
    select: typeof auctionContractSelect;
  }>): AuctionResponse {
    return auctionResponseSchema.parse({
      auction: toContractAuction(auction),
    });
  }

  private publishAuctionUpdated(auction: AuctionResponse['auction']): void {
    const reserveMet = reserveReached(auction.currentPrice, auction.reservePrice);

    this.realtimeEventsService.publishAuctionUpdated(
      mapAuctionUpdatedEventPayload(auction, reserveMet),
    );
  }

  private getPublishableAuctionStatus(
    startsAt: Date,
    now: Date,
  ): 'scheduled' | 'active' {
    const status = resolvePublishedAuctionStatus(startsAt, now);

    return status === 'active' ? 'active' : 'scheduled';
  }
}

export { calculateBidStep };

function uniqueConstraintIncludes(
  error: unknown,
  fieldName: string,
): boolean {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('meta' in error)
  ) {
    return false;
  }

  const target = (error as { meta?: { target?: unknown } }).meta?.target;

  return Array.isArray(target) && target.some((field) => field === fieldName);
}

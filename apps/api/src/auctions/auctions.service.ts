import {
  type AuctionCreateRequest,
  type AuctionResponse,
  type PaginationQuery,
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
  type RawAuctionListItemRecord,
  type RawAuctionRecord,
  toAuctionDetailItem,
  toAuctionListItem,
  toContractAuction,
} from './auction.mapper';
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

const publicBidSelect = {
  id: true,
  auctionId: true,
  bidderUserId: true,
  amount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
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

type SellerProfileStatusRecord = {
  id: string;
  status: string;
};

type LotStatusRecord = {
  id: string;
  sellerProfileId: string;
  status: string;
};

type PublishedAuctionRecord = RawAuctionRecord & {
  lot: {
    id: string;
    sellerProfileId: string;
    categoryId: string;
    title: string;
    description: string;
    condition: string;
    images: string[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  sellerProfile: {
    id: string;
    userId: string;
    slug: string;
    sellerType: string;
    storeName: string;
    country: string;
    contactPreference: string;
    socialLink: string | null;
    shortDescription: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

type PublishedAuctionDetailRecord = PublishedAuctionRecord & {
  bids: Array<{
    id: string;
    auctionId: string;
    bidderUserId: string;
    amount: number | { toNumber(): number };
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

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

    const auctions = (await this.prisma.auction.findMany({
      where: {
        sellerProfileId: sellerProfile.id,
      },
      select: auctionContractSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })) as RawAuctionRecord[];

    return sellerAuctionListResponseSchema.parse({
      auctions: auctions.map((auction) => toContractAuction(auction)),
    });
  }

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
      select: publicAuctionListSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
    })) as RawAuctionListItemRecord[];

    return auctionListResponseSchema.parse({
      auctions: auctions.map((auction) => toAuctionListItem(auction)),
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
      select: {
        ...publicAuctionListSelect,
        bids: {
          select: publicBidSelect,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        },
      },
    })) as PublishedAuctionDetailRecord | null;

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
    const sellerProfile = (await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    })) as SellerProfileStatusRecord | null;

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (parseSellerStatus(sellerProfile.status, sellerProfile.id) !== 'active') {
      throw new ForbiddenException('Seller profile is not active');
    }

    const lot = (await this.prisma.lot.findUnique({
      where: {
        id: input.lotId,
      },
      select: {
        id: true,
        sellerProfileId: true,
        status: true,
      },
    })) as LotStatusRecord | null;

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
      const auction = (await this.prisma.auction.create({
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
      })) as RawAuctionRecord;

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
    const sellerProfile = (await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    })) as SellerProfileStatusRecord | null;

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (parseSellerStatus(sellerProfile.status, sellerProfile.id) !== 'active') {
      throw new ForbiddenException('Seller profile is not active');
    }

    const auction = (await this.prisma.auction.findUnique({
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
    })) as {
      id: string;
      lotId: string;
      sellerProfileId: string;
      startsAt: Date;
      status: string;
    } | null;

    if (!auction || auction.sellerProfileId !== sellerProfile.id) {
      throw new NotFoundException('Auction not found');
    }

    if (parseAuctionStatus(auction.status, auction.id) !== 'draft') {
      throw new ConflictException('Auction cannot be published');
    }

    const lot = (await this.prisma.lot.findUnique({
      where: {
        id: auction.lotId,
      },
      select: {
        id: true,
        status: true,
      },
    })) as { id: string; status: string } | null;

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

      return latestAuction as RawAuctionRecord;
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

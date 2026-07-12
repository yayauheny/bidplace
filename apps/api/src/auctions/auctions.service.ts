import {
  type Auction,
  type AuctionCreateRequest,
  type AuctionResponse,
  auctionResponseSchema,
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

function resolveAuctionStatus(startsAt: Date, now: Date): Auction['status'] {
  return startsAt <= now ? 'active' : 'scheduled';
}

@Injectable()
export class AuctionsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return auctionResponseSchema.parse({
      auction: this.toContractAuction(updatedAuction),
    });
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
}

export { calculateBidStep };

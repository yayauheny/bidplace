import {
  type AdminAuctionResponse,
  type AdminAuctionsResponse,
  type AdminUserResponse,
  type AdminUsersResponse,
  type Auction,
  type BidHistoryResponse,
  type User,
  adminAuctionResponseSchema,
  adminAuctionsResponseSchema,
  adminUserResponseSchema,
  adminUsersResponseSchema,
  bidHistoryResponseSchema,
} from '@bidplace/contracts';
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../core/database';

type NumericLike = number | { toNumber(): number };

type PrismaUser = {
  id: string;
  email: string;
  phone: string;
  displayName: string;
  role: User['role'];
  status: User['status'];
  createdAt: Date;
  updatedAt: Date;
};

type PrismaAuction = {
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

type PrismaBid = {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amount: NumericLike;
  status: BidHistoryResponse['bids'][number]['status'];
  createdAt: Date;
  updatedAt: Date;
};

function toNumber(value: NumericLike): number {
  return typeof value === 'number' ? value : value.toNumber();
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(): Promise<AdminUsersResponse> {
    const users = (await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })) as PrismaUser[];

    return adminUsersResponseSchema.parse({
      users: users.map((user) => this.toContractUser(user)),
    });
  }

  async banUser(userId: string): Promise<AdminUserResponse> {
    const user = (await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    })) as PrismaUser | null;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = (await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        status: 'banned',
      },
    })) as PrismaUser;

    return adminUserResponseSchema.parse({
      user: this.toContractUser(updatedUser),
    });
  }

  async listAuctions(): Promise<AdminAuctionsResponse> {
    const auctions = (await this.prisma.auction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })) as PrismaAuction[];

    return adminAuctionsResponseSchema.parse({
      auctions: auctions.map((auction) => this.toContractAuction(auction)),
    });
  }

  async hideAuction(auctionId: string): Promise<AdminAuctionResponse> {
    const auction = (await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
    })) as PrismaAuction | null;

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    const updatedAuction = (await this.prisma.auction.update({
      where: {
        id: auctionId,
      },
      data: {
        status: 'hidden',
      },
    })) as PrismaAuction;

    return adminAuctionResponseSchema.parse({
      auction: this.toContractAuction(updatedAuction),
    });
  }

  async listAuctionBids(auctionId: string): Promise<BidHistoryResponse> {
    const auction = await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: {
        id: true,
      },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    const bids = (await this.prisma.bid.findMany({
      where: {
        auctionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })) as PrismaBid[];

    return bidHistoryResponseSchema.parse({
      bids: bids.map((bid) => ({
        id: bid.id,
        auctionId: bid.auctionId,
        bidderUserId: bid.bidderUserId,
        amount: toNumber(bid.amount),
        status: bid.status,
        createdAt: bid.createdAt.toISOString(),
        updatedAt: bid.updatedAt.toISOString(),
      })),
    });
  }

  private toContractUser(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private toContractAuction(auction: PrismaAuction): Auction {
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

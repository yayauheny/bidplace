import {
  type AdminAuctionResponse,
  type AdminAuctionsResponse,
  type AdminUserResponse,
  type AdminUsersResponse,
  type BidHistoryResponse,
  type PaginationQuery,
  adminAuctionResponseSchema,
  adminAuctionsResponseSchema,
  adminUserResponseSchema,
  adminUsersResponseSchema,
  bidHistoryResponseSchema,
} from '@bidplace/contracts';
import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { type RawAuthUserRecord, toContractUser } from '../auth/auth.mapper';
import {
  auctionContractSelect,
  toContractAuction,
} from '../auctions/auction.mapper';
import { bidContractSelect, toContractBid } from '../bids/bid.mapper';
import { PrismaService } from '../core/database';

export interface AdminRepository {
  user: {
    findMany: PrismaService['user']['findMany'];
    findUnique: PrismaService['user']['findUnique'];
    update: PrismaService['user']['update'];
  };
  auction: {
    findMany: PrismaService['auction']['findMany'];
    findUnique: PrismaService['auction']['findUnique'];
    update: PrismaService['auction']['update'];
  };
  bid: {
    findMany: PrismaService['bid']['findMany'];
  };
}

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: AdminRepository) {}

  async listUsers(
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ): Promise<AdminUsersResponse> {
    const users = (await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })) as RawAuthUserRecord[];

    return adminUsersResponseSchema.parse({
      users: users.map((user) => toContractUser(user)),
    });
  }

  async banUser(userId: string): Promise<AdminUserResponse> {
    const user = (await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    })) as RawAuthUserRecord | null;

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
    })) as RawAuthUserRecord;

    return adminUserResponseSchema.parse({
      user: toContractUser(updatedUser),
    });
  }

  async listAuctions({
    page,
    limit,
  }: PaginationQuery = { page: 1, limit: 20 }): Promise<AdminAuctionsResponse> {
    const auctions = await this.prisma.auction.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: auctionContractSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return adminAuctionsResponseSchema.parse({
      auctions: auctions.map((auction) => toContractAuction(auction)),
    });
  }

  async hideAuction(auctionId: string): Promise<AdminAuctionResponse> {
    const auction = await this.prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: auctionContractSelect,
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    const updatedAuction = await this.prisma.auction.update({
      where: {
        id: auctionId,
      },
      data: {
        status: 'hidden',
      },
      select: auctionContractSelect,
    });

    return adminAuctionResponseSchema.parse({
      auction: toContractAuction(updatedAuction),
    });
  }

  async listAuctionBids(
    auctionId: string,
    { page, limit }: PaginationQuery = { page: 1, limit: 20 },
  ): Promise<BidHistoryResponse> {
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

    const bids = await this.prisma.bid.findMany({
      where: {
        auctionId,
      },
      select: bidContractSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return bidHistoryResponseSchema.parse({
      bids: bids.map((bid) => toContractBid(bid)),
    });
  }
}

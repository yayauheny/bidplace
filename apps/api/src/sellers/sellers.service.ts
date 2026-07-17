import {
  publicSellerDetailResponseSchema,
  type PublicSellerDetailResponse,
  type SellerProfileCreateRequest,
  type SellerProfileResponse,
  type SellerProfileUpdateRequest,
  sellerProfileResponseSchema,
} from '@bidplace/contracts';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@bidplace/database';

import {
  sellerProfileContractSelect,
  toContractSellerProfile,
} from './seller-profile.mapper';
import {
  publicAuctionListSelect,
  toAuctionListItem,
} from '../auctions/auction.mapper';
import { parseSellerStatus } from '../core/contracts';
import { PrismaService, isPrismaUniqueConstraintError } from '../core/database';

export interface SellersRepository {
  sellerProfile: {
    findUnique: PrismaService['sellerProfile']['findUnique'];
    create: PrismaService['sellerProfile']['create'];
    update: PrismaService['sellerProfile']['update'];
  };
  auction: {
    findMany: PrismaService['auction']['findMany'];
  };
}

function toSellerProfileUpdateData(
  input: SellerProfileUpdateRequest,
): Prisma.SellerProfileUpdateInput {
  return {
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.sellerType !== undefined
      ? { sellerType: input.sellerType }
      : {}),
    ...(input.storeName !== undefined ? { storeName: input.storeName } : {}),
    ...(input.country !== undefined ? { country: input.country } : {}),
    ...(input.contactPreference !== undefined
      ? { contactPreference: input.contactPreference }
      : {}),
    ...(input.socialLink !== undefined ? { socialLink: input.socialLink } : {}),
    ...(input.shortDescription !== undefined
      ? { shortDescription: input.shortDescription }
      : {}),
  };
}

@Injectable()
export class SellersService {
  constructor(@Inject(PrismaService) private readonly prisma: SellersRepository) {}

  async createProfile(
    userId: string,
    input: SellerProfileCreateRequest,
  ): Promise<SellerProfileResponse> {
    const existingProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (existingProfile) {
      throw new ConflictException('Seller profile already exists');
    }

    try {
      const sellerProfile = await this.prisma.sellerProfile.create({
        data: {
          userId,
          slug: input.slug,
          sellerType: input.sellerType,
          storeName: input.storeName,
          country: input.country,
          contactPreference: input.contactPreference,
          socialLink: input.socialLink ?? null,
          shortDescription: input.shortDescription ?? null,
          status: 'active',
        },
        select: sellerProfileContractSelect,
      });

      return sellerProfileResponseSchema.parse({
        sellerProfile: toContractSellerProfile(sellerProfile),
      });
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Seller slug already in use');
      }

      throw error;
    }
  }

  async updateProfile(
    userId: string,
    input: SellerProfileUpdateRequest,
  ): Promise<SellerProfileResponse> {
    const existingProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!existingProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    try {
      const sellerProfile = await this.prisma.sellerProfile.update({
        where: {
          userId,
        },
        data: toSellerProfileUpdateData(input),
        select: sellerProfileContractSelect,
      });

      return sellerProfileResponseSchema.parse({
        sellerProfile: toContractSellerProfile(sellerProfile),
      });
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Seller slug already in use');
      }

      throw error;
    }
  }

  async getMyProfile(userId: string): Promise<SellerProfileResponse> {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: sellerProfileContractSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const contractSellerProfile = toContractSellerProfile(sellerProfile);

    return sellerProfileResponseSchema.parse({
      sellerProfile: contractSellerProfile,
    });
  }

  async getPublicProfile(slug: string): Promise<SellerProfileResponse> {
    const sellerProfile = await this.getActivePublicSellerProfile(slug);

    return sellerProfileResponseSchema.parse({
      sellerProfile: toContractSellerProfile(sellerProfile),
    });
  }

  async getPublicDetail(slug: string): Promise<PublicSellerDetailResponse> {
    const sellerProfile = await this.getActivePublicSellerProfile(slug);
    const auctions = await this.prisma.auction.findMany({
      where: {
        sellerProfileId: sellerProfile.id,
        status: {
          in: ['scheduled', 'active'],
        },
        lot: {
          status: 'published',
        },
      },
      select: publicAuctionListSelect,
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
    });

    return publicSellerDetailResponseSchema.parse({
      sellerProfile: toContractSellerProfile(sellerProfile),
      auctions: auctions.map((auction) => toAuctionListItem(auction)),
    });
  }

  private async getActivePublicSellerProfile(slug: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        slug,
      },
      select: sellerProfileContractSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const sellerStatus = parseSellerStatus(sellerProfile.status, sellerProfile.id);

    if (sellerStatus !== 'active') {
      throw new NotFoundException('Seller profile not found');
    }

    return sellerProfile;
  }
}

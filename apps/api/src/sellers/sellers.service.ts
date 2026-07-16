import {
  type SellerProfile,
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

import { PrismaService } from '../core/database';

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

export interface SellersRepository {
  sellerProfile: {
    findUnique: PrismaService['sellerProfile']['findUnique'];
    create: PrismaService['sellerProfile']['create'];
    update: PrismaService['sellerProfile']['update'];
  };
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
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
      });

      return sellerProfileResponseSchema.parse({
        sellerProfile: this.toContractProfile(sellerProfile),
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
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
      const data: Prisma.SellerProfileUpdateInput = {};

      if (input.slug !== undefined) {
        data.slug = input.slug;
      }

      if (input.sellerType !== undefined) {
        data.sellerType = input.sellerType;
      }

      if (input.storeName !== undefined) {
        data.storeName = input.storeName;
      }

      if (input.country !== undefined) {
        data.country = input.country;
      }

      if (input.contactPreference !== undefined) {
        data.contactPreference = input.contactPreference;
      }

      if (input.socialLink !== undefined) {
        data.socialLink = input.socialLink;
      }

      if (input.shortDescription !== undefined) {
        data.shortDescription = input.shortDescription;
      }

      const sellerProfile = await this.prisma.sellerProfile.update({
        where: {
          userId,
        },
        data,
      });

      return sellerProfileResponseSchema.parse({
        sellerProfile: this.toContractProfile(sellerProfile),
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
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
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    return sellerProfileResponseSchema.parse({
      sellerProfile: this.toContractProfile(sellerProfile),
    });
  }

  async getPublicProfile(slug: string): Promise<SellerProfileResponse> {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        slug,
      },
    });

    if (!sellerProfile || sellerProfile.status !== 'active') {
      throw new NotFoundException('Seller profile not found');
    }

    return sellerProfileResponseSchema.parse({
      sellerProfile: this.toContractProfile(sellerProfile),
    });
  }

  private toContractProfile(
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
}

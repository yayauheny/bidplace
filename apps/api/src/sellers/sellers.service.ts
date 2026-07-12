import {
  type SellerProfile,
  type SellerProfileCreateRequest,
  type SellerProfileResponse,
  type SellerProfileUpdateRequest,
  sellerProfileResponseSchema,
} from '@bidplace/contracts';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
  constructor(private readonly prisma: PrismaService) {}

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
      const sellerProfile = await this.prisma.sellerProfile.update({
        where: {
          userId,
        },
        data: {
          slug: input.slug,
          sellerType: input.sellerType,
          storeName: input.storeName,
          country: input.country,
          contactPreference: input.contactPreference,
          socialLink:
            input.socialLink === undefined ? undefined : input.socialLink,
          shortDescription:
            input.shortDescription === undefined
              ? undefined
              : input.shortDescription,
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

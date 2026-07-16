import {
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
  type RawSellerProfileRecord,
  toContractSellerProfile,
} from './seller-profile.mapper';
import { parseSellerStatus } from '../core/contracts';
import { PrismaService } from '../core/database';

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
      const sellerProfile = (await this.prisma.sellerProfile.create({
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
      })) as RawSellerProfileRecord;

      return sellerProfileResponseSchema.parse({
        sellerProfile: toContractSellerProfile(sellerProfile),
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

      const sellerProfile = (await this.prisma.sellerProfile.update({
        where: {
          userId,
        },
        data,
      })) as RawSellerProfileRecord;

      return sellerProfileResponseSchema.parse({
        sellerProfile: toContractSellerProfile(sellerProfile),
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Seller slug already in use');
      }

      throw error;
    }
  }

  async getMyProfile(userId: string): Promise<SellerProfileResponse> {
    const sellerProfile = (await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
    })) as RawSellerProfileRecord | null;

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const contractSellerProfile = toContractSellerProfile(sellerProfile);

    return sellerProfileResponseSchema.parse({
      sellerProfile: contractSellerProfile,
    });
  }

  async getPublicProfile(slug: string): Promise<SellerProfileResponse> {
    const sellerProfile = (await this.prisma.sellerProfile.findUnique({
      where: {
        slug,
      },
    })) as RawSellerProfileRecord | null;

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const sellerStatus = parseSellerStatus(sellerProfile.status, sellerProfile.id);

    if (sellerStatus !== 'active') {
      throw new NotFoundException('Seller profile not found');
    }

    return sellerProfileResponseSchema.parse({
      sellerProfile: toContractSellerProfile(sellerProfile),
    });
  }
}

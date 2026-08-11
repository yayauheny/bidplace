import {
  publicSellerListResponseSchema,
  publicSellerDetailResponseSchema,
  sellerProductListResponseSchema,
  type PublicSellerQuery,
  type SellerProfileCreateRequest,
  type SellerProfileUpdateRequest,
} from '@bidplace/contracts';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

import { isPrismaUniqueConstraintError, PrismaService } from '../core/database';
import { type ValidatedImageUpload } from '../images/image-policy';
import { productSelect, toContractProduct } from '../products/products.mapper';
import {
  publicCatalogProductWhere,
  publicListingStatuses,
} from '../products/public-visibility';
import { ProductsService } from '../products/products.service';
import {
  publicSellerProfileSelect,
  sellerProfilePhotoSelect,
  sellerProfileResponseSelect,
  toPublicSellerProfile,
  toSellerProfileResponse,
} from './seller-profile.mapper';

@Injectable()
export class SellersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
  ) {}

  async getMine(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: sellerProfileResponseSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    return toSellerProfileResponse(sellerProfile);
  }

  async create(
    userId: string,
    input: SellerProfileCreateRequest,
    profilePhoto: ValidatedImageUpload,
  ) {
    const existing = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Seller profile already exists');
    }

    const profilePhotoData = Uint8Array.from(profilePhoto.buffer);

    try {
      const sellerProfile = await this.prisma.sellerProfile.create({
        data: {
          userId,
          slug: input.slug,
          sellerType: input.sellerType,
          ...(input.discipline ? { discipline: input.discipline } : {}),
          fullName: input.fullName,
          country: input.country,
          socialLink: input.socialLink,
          shortDescription: input.shortDescription,
          handoffContactType: input.handoffContactType,
          handoffContactValue: input.handoffContactValue,
          handoffInitiator: input.handoffInitiator ?? 'BUYER_CONTACTS_SELLER',
          profilePhotoMimeType: profilePhoto.mimeType,
          profilePhotoByteLength: profilePhoto.buffer.byteLength,
          profilePhotoChecksum: createHash('sha256')
            .update(profilePhoto.buffer)
            .digest('hex'),
          profilePhotoData,
        },
        select: sellerProfileResponseSelect,
      });

      return toSellerProfileResponse(sellerProfile);
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          'Seller profile already exists or slug is already taken',
        );
      }

      throw error;
    }
  }

  async update(
    userId: string,
    input: SellerProfileUpdateRequest,
    profilePhoto?: ValidatedImageUpload,
  ) {
    const current = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        slug: true,
      },
    });

    if (!current) {
      throw new NotFoundException('Seller profile not found');
    }

    if (current.status !== 'CHANGES_REQUESTED') {
      throw new ForbiddenException('Seller profile cannot be edited');
    }

    const data = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );

    if (profilePhoto) {
      const profilePhotoData = Uint8Array.from(profilePhoto.buffer);

      Object.assign(data, {
        profilePhotoMimeType: profilePhoto.mimeType,
        profilePhotoByteLength: profilePhoto.buffer.byteLength,
        profilePhotoChecksum: createHash('sha256')
          .update(profilePhoto.buffer)
          .digest('hex'),
        profilePhotoData,
      });
    }

    try {
      const sellerProfile = await this.prisma.sellerProfile.update({
        where: { id: current.id },
        data,
        select: sellerProfileResponseSelect,
      });

      return toSellerProfileResponse(sellerProfile);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Seller profile not found');
        }

        if (error.code === 'P2002') {
          throw new ConflictException('Seller profile slug is already taken');
        }
      }

      throw error;
    }
  }

  async listProducts(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const products = await this.prisma.product.findMany({
      where: { sellerProfileId: sellerProfile.id },
      select: productSelect,
      orderBy: { createdAt: 'desc' },
    });

    return sellerProductListResponseSchema.parse({
      products: products.map(toContractProduct),
    });
  }

  async listPublic(query: PublicSellerQuery) {
    const searchWhere = query.q
      ? {
          OR: [
            { fullName: { contains: query.q, mode: 'insensitive' as const } },
            { slug: { contains: query.q, mode: 'insensitive' as const } },
            {
              shortDescription: {
                contains: query.q,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};
    const where = { status: 'APPROVED' as const, ...searchWhere };
    const [sellers, total] = await Promise.all([
      this.prisma.sellerProfile.findMany({
        where,
        select: {
          id: true,
          ...publicSellerProfileSelect,
          products: {
            where: publicCatalogProductWhere,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            take: 1,
            select: { createdAt: true },
          },
          _count: {
            select: { products: { where: publicCatalogProductWhere } },
          },
        },
      }),
      this.prisma.sellerProfile.count({ where }),
    ]);

    const sortedSellers = [...sellers].sort((left, right) => {
      if (query.sort === 'activity') {
        const leftCreatedAt = left.products[0]?.createdAt.getTime() ?? 0;
        const rightCreatedAt = right.products[0]?.createdAt.getTime() ?? 0;

        return (
          rightCreatedAt - leftCreatedAt ||
          left.fullName.localeCompare(right.fullName) ||
          left.id.localeCompare(right.id)
        );
      }

      return (
        left.fullName.localeCompare(right.fullName) ||
        left.id.localeCompare(right.id)
      );
    });
    const pagedSellers = sortedSellers.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit,
    );

    return publicSellerListResponseSchema.parse({
      sellers: pagedSellers.map((seller) => ({
        sellerProfile: toPublicSellerProfile(seller),
        workCount: seller._count.products,
      })),
      pagination: { page: query.page, limit: query.limit, total },
    });
  }

  async getPublic(slug: string) {
    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: { slug, status: 'APPROVED' },
      include: {
        products: {
          where: publicCatalogProductWhere,
          include: {
            sellerProfile: {
              select: publicSellerProfileSelect,
            },
            images: { orderBy: { position: 'asc' } },
            listings: {
              where: { status: { in: publicListingStatuses } },
              include: { auctionRules: true },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    return publicSellerDetailResponseSchema.parse({
      sellerProfile: toPublicSellerProfile(sellerProfile),
      products: sellerProfile.products.map((product) =>
        this.products.toPublicProduct(product),
      ),
    });
  }

  async getPhoto(slug: string, userId?: string, role?: string) {
    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: { slug },
      select: sellerProfilePhotoSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const isOwner = sellerProfile.userId === userId;
    const isAdmin = role === 'admin';
    const isPublic = sellerProfile.status === 'APPROVED';

    if (!isOwner && !isAdmin && !isPublic) {
      throw new NotFoundException('Seller profile not found');
    }

    return sellerProfile;
  }
}

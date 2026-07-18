import {
  publicSellerDetailResponseSchema,
  sellerProductListResponseSchema,
  sellerProfileResponseSchema,
  type SellerProfileCreateRequest,
  type SellerProfileUpdateRequest,
} from '@bidplace/contracts';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../core/database';
import { productSelect, toContractProduct } from '../products/products.mapper';
import { ProductsService } from '../products/products.service';

@Injectable()
export class SellersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
  ) {}

  async getMine(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!sellerProfile) throw new NotFoundException('Seller profile not found');
    return this.toProfileResponse(sellerProfile);
  }

  async create(userId: string, input: SellerProfileCreateRequest) {
    const existing = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Seller profile already exists');
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
      },
    });
    return this.toProfileResponse(sellerProfile);
  }

  async update(userId: string, input: SellerProfileUpdateRequest) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );
    const sellerProfile = await this.prisma.sellerProfile.update({
      where: { userId },
      data,
    }).catch(() => null);
    if (!sellerProfile) throw new NotFoundException('Seller profile not found');
    return this.toProfileResponse(sellerProfile);
  }

  async listProducts(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!sellerProfile) throw new NotFoundException('Seller profile not found');
    const products = await this.prisma.product.findMany({ where: { sellerProfileId: sellerProfile.id }, select: productSelect, orderBy: { createdAt: 'desc' } });
    return sellerProductListResponseSchema.parse({ products: products.map(toContractProduct) });
  }

  async getPublic(slug: string) {
    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: { slug, status: 'APPROVED' },
      include: {
        products: {
          where: { status: 'APPROVED' },
          include: {
            sellerProfile: true,
            images: { orderBy: { position: 'asc' } },
            listings: {
              where: { status: { in: ['SCHEDULED', 'LIVE'] } },
              include: { auctionRules: true },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!sellerProfile) throw new NotFoundException('Seller profile not found');
    return publicSellerDetailResponseSchema.parse({
      sellerProfile: {
        slug: sellerProfile.slug,
        sellerType: sellerProfile.sellerType,
        storeName: sellerProfile.storeName,
        country: sellerProfile.country,
        contactPreference: sellerProfile.contactPreference,
        socialLink: sellerProfile.socialLink,
        shortDescription: sellerProfile.shortDescription,
      },
      products: sellerProfile.products.map((product) => this.products.toPublicProduct(product)),
    });
  }

  private toProfileResponse(sellerProfile: {
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
  }) {
    return sellerProfileResponseSchema.parse({
      sellerProfile: {
        ...sellerProfile,
        createdAt: sellerProfile.createdAt.toISOString(),
        updatedAt: sellerProfile.updatedAt.toISOString(),
      },
    });
  }
}

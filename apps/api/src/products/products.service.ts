import {
  publicProductDetailResponseSchema,
  productListResponseSchema,
  type PaginationQuery,
  type ProductWriteRequest,
  type SellerStatus,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService, runSerializableTransaction } from '../core/database';
import { resolveMinimumBidAmount } from '../core/auction';
import { PublicIdService } from '../core/public-id';
import {
  productSelect,
  toContractProduct,
  toProductResponse,
} from './products.mapper';
import { isEditableProductStatus } from './product-state';
import {
  publicCatalogProductWhere,
  publicDirectProductWhere,
  publicListingStatuses,
  selectPublicListing,
} from './public-visibility';
import { assertApprovedSeller } from '../sellers/seller-capability';
import {
  publicSellerProfileSelect,
  toPublicSellerProfile,
} from '../sellers/seller-profile.mapper';

const lockedStatuses = ['SCHEDULED', 'LIVE'] as const;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicIds: PublicIdService,
  ) {}

  async create(userId: string, input: ProductWriteRequest) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    assertApprovedSeller(seller.status as SellerStatus);
    return this.createWithPublicId(seller.id, input);
  }

  private async createWithPublicId(
    sellerProfileId: string,
    input: ProductWriteRequest,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const data: Prisma.ProductUncheckedCreateInput = {
          sellerProfileId,
          publicId: this.publicIds.generate(),
          categoryId: input.categoryId ?? null,
          title: input.title ?? null,
          story: input.story ?? null,
          technique: input.technique ?? null,
          materials: input.materials ?? null,
          dimensions: input.dimensions ?? null,
          weight: input.weight ?? null,
          year: input.year ?? null,
          condition: input.condition ?? null,
          uniqueness: input.uniqueness ?? null,
          provenance: input.provenance ?? null,
          city: input.city ?? null,
          deliveryInfo: input.deliveryInfo ?? null,
          status: 'DRAFT',
        };

        const product = await this.prisma.product.create({
          data,
          select: productSelect,
        });

        return toProductResponse(product);
      } catch (error) {
        if (
          !(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
          )
        ) {
          throw error;
        }
      }
    }

    throw new ConflictException('Could not assign public identifier');
  }

  async update(userId: string, id: string, input: ProductWriteRequest) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        status: true,
        sellerProfile: { select: { userId: true, status: true } },
        listings: {
          where: { status: { in: [...lockedStatuses] } },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Product is not owned by user');
    }

    assertApprovedSeller(product.sellerProfile.status as SellerStatus);

    if (!isEditableProductStatus(product.status)) {
      throw new ForbiddenException('Product cannot be edited');
    }

    if (product.listings.length) {
      throw new ConflictException('Product is locked by an active Listing');
    }

    const data: Prisma.ProductUncheckedUpdateInput = {};

    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.title !== undefined) data.title = input.title;
    if (input.story !== undefined) data.story = input.story;
    if (input.technique !== undefined) data.technique = input.technique;
    if (input.materials !== undefined) data.materials = input.materials;
    if (input.dimensions !== undefined) data.dimensions = input.dimensions;
    if (input.weight !== undefined) data.weight = input.weight;
    if (input.year !== undefined) data.year = input.year;
    if (input.condition !== undefined) data.condition = input.condition;
    if (input.uniqueness !== undefined) data.uniqueness = input.uniqueness;
    if (input.provenance !== undefined) data.provenance = input.provenance;
    if (input.city !== undefined) data.city = input.city;
    if (input.deliveryInfo !== undefined) data.deliveryInfo = input.deliveryInfo;

    const updated = await this.prisma.product.update({
      where: { id },
      data,
      select: productSelect,
    });

    return toProductResponse(updated);
  }

  async submit(userId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sellerProfile: { select: { userId: true, status: true } },
        images: { select: { id: true }, take: 1 },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Product is not owned by user');
    }

    assertApprovedSeller(product.sellerProfile.status as SellerStatus);

    if (!isEditableProductStatus(product.status)) {
      throw new ConflictException('Product cannot be submitted for review');
    }

    if (product.images.length < 1) {
      throw new ConflictException('Product must have at least one image');
    }

    return runSerializableTransaction(this.prisma, async (tx) => {
      const current = await tx.product.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!current) {
        throw new NotFoundException('Product not found');
      }

      if (!isEditableProductStatus(current.status)) {
        throw new ConflictException('Product cannot be submitted for review');
      }

      const updated = await tx.product.update({
        where: { id },
        data: { status: 'PENDING_REVIEW' },
        select: productSelect,
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          targetType: 'PRODUCT',
          targetId: updated.id,
          oldStatus: current.status,
          newStatus: 'PENDING_REVIEW',
          reason: null,
        },
      });

      return toProductResponse(updated);
    });
  }

  async getPublic(publicId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        publicId,
        ...publicDirectProductWhere,
      },
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
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const projection = this.toPublicProduct(product);
    const currentListing = selectPublicListing(product.listings);

    return publicProductDetailResponseSchema.parse({
      ...projection,
      minimumNextBid:
        projection.listing?.status === 'LIVE' &&
        currentListing &&
        currentListing.auctionRules
          ? resolveMinimumBidAmount({
              currentPrice: currentListing.currentPrice,
              startPrice: currentListing.auctionRules.startPrice,
              bidCount: currentListing.bidCount,
            }).toNumber()
          : null,
    });
  }

  async listPublic(query: PaginationQuery) {
    const where = publicCatalogProductWhere;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
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
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return productListResponseSchema.parse({
      products: products.map((product) => this.toPublicProduct(product)),
      pagination: { ...query, total },
    });
  }

  toPublicProduct(
    product: Awaited<ReturnType<PrismaService['product']['findFirst']>> & object,
  ) {
    const record = product as typeof product & {
      sellerProfile: {
        slug: string;
        sellerType: 'creator' | 'influencer';
        fullName: string;
        country: string;
        socialLink: string;
        shortDescription: string;
      };
      images: Array<{
        id: string;
        position: number;
        mimeType: string;
        byteLength: number;
        checksum: string;
      }>;
      listings: Array<{
        id: string;
        productId: string;
        status: 'SCHEDULED' | 'LIVE' | 'ENDED';
        startsAt: Date;
        originalEndsAt: Date;
        endsAt: Date;
        currentPrice: { toNumber(): number };
        bidCount: number;
        closedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        auctionRules: { startPrice: { toNumber(): number } } | null;
      }>;
    };

    const listing = selectPublicListing(record.listings);
    const publicProduct = toContractProduct({
      id: record.id,
      publicId: record.publicId,
      sellerProfileId: record.sellerProfileId,
      categoryId: record.categoryId,
      title: record.title,
      story: record.story,
      technique: record.technique,
      materials: record.materials,
      dimensions: record.dimensions,
      weight: record.weight,
      year: record.year,
      condition: record.condition,
      uniqueness: record.uniqueness,
      provenance: record.provenance,
      city: record.city,
      deliveryInfo: record.deliveryInfo,
      publishedAt: record.publishedAt,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      images: record.images,
    });

    return {
      product: publicProduct,
      sellerProfile: toPublicSellerProfile(record.sellerProfile),
      listing:
        listing && listing.auctionRules
              ? {
              id: listing.id,
              productId: listing.productId,
              type: 'AUCTION' as const,
              status: listing.status,
              currency: 'BYN' as const,
              startsAt: listing.startsAt.toISOString(),
              originalEndsAt: listing.originalEndsAt.toISOString(),
              endsAt: listing.endsAt.toISOString(),
              currentPrice: listing.currentPrice.toNumber(),
              bidCount: listing.bidCount,
              closedAt: listing.closedAt?.toISOString() ?? null,
              createdAt: listing.createdAt.toISOString(),
              updatedAt: listing.updatedAt.toISOString(),
              auctionRules: {
                startPrice: listing.auctionRules.startPrice.toNumber(),
                incrementPolicyCode: 'MVP_BYN_V1' as const,
                softCloseWindowSeconds: 60 as const,
                softCloseExtensionSeconds: 60 as const,
                softCloseMaxTotalSeconds: 600 as const,
              },
              }
          : null,
    };
  }
}

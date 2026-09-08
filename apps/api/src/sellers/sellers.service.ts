import {
  publicSellerListResponseSchema,
  publicSellerDetailResponseSchema,
  sellerProductDetailResponseSchema,
  sellerProductListResponseSchema,
  type PublicSellerQuery,
  type PublicSellerWorksQuery,
  type SellerProfileCreateRequest,
  type SellerProfileUpdateRequest,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

import { isPrismaUniqueConstraintError, PrismaService } from '../core/database';
import { emptyImageBytes, ImageStore, imageKey } from '../core/image-store';
import { type ValidatedImageUpload } from '../images/image-policy';
import {
  productSelect,
  toContractProduct,
  publicCatalogProductSelect,
  toCreationStepContract,
} from '../products/products.mapper';
import { ProductsService } from '../products/products.service';
import {
  publicCatalogProductWhere,
  publicProductContentSql,
} from '../products/public-visibility';
import {
  publicSellerProfileSelect,
  sellerProfilePhotoSelect,
  sellerProfileResponseSelect,
  toPublicSellerProfile,
  toSellerProfileResponse,
} from './seller-profile.mapper';

export function countPublicSellerStatuses(
  products: Array<{ listings: Array<{ status: string }> }>,
) {
  const counts = { SCHEDULED: 0, LIVE: 0, ENDED: 0 };

  for (const product of products) {
    const status = product.listings[0]?.status;
    if (status === 'SCHEDULED' || status === 'LIVE' || status === 'ENDED') {
      counts[status] += 1;
    }
  }

  return counts;
}

type PublicSellerProductPageRow = { id: string };
type PublicSellerCountRow = { total: number | bigint };
type PublicSellerStatusRow = {
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  count: number | bigint;
};

function publicSellerProductsCte(
  slug: string,
  status?: PublicSellerWorksQuery['status'],
) {
  const statusFilter = status
    ? Prisma.sql`AND c."status" = CAST(${status} AS "ListingStatus")`
    : Prisma.empty;

  return Prisma.sql`WITH canonical AS (
    SELECT DISTINCT ON (l."product_id")
      l."product_id",
      l."status",
      l."current_price",
      l."bid_count",
      l."ends_at",
      l."created_at" AS "listing_created_at"
    FROM "listings" l
    WHERE l."status" IN ('LIVE', 'SCHEDULED', 'ENDED')
    ORDER BY
      l."product_id",
      CASE l."status"
        WHEN 'LIVE' THEN 0
        WHEN 'SCHEDULED' THEN 1
        ELSE 2
      END,
      l."created_at" DESC,
      l."id" DESC
  ), filtered AS (
    SELECT
      p."id",
      p."created_at",
      c."status",
      c."current_price",
      c."bid_count",
      c."ends_at"
    FROM "products" p
    INNER JOIN "seller_profiles" sp ON sp."id" = p."seller_profile_id"
    INNER JOIN canonical c ON c."product_id" = p."id"
    WHERE p."status" = 'APPROVED'
      AND sp."status" = 'APPROVED'
      AND sp."slug" = ${slug}
      AND ${publicProductContentSql}
      ${statusFilter}
  )`;
}

function publicSellerProductsOrderBy(sort: PublicSellerWorksQuery['sort']) {
  switch (sort) {
    case 'priceAsc':
      return 'p."current_price" ASC, p."id" ASC';
    case 'priceDesc':
      return 'p."current_price" DESC, p."id" ASC';
    case 'newest':
      return 'p."created_at" DESC, p."id" ASC';
    case 'oldest':
      return 'p."created_at" ASC, p."id" ASC';
    case 'activity':
      return 'p."bid_count" DESC, p."created_at" DESC, p."id" ASC';
  }
}

@Injectable()
export class SellersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly imageStore: ImageStore,
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

    try {
      const sellerProfile = await this.prisma.$transaction(async (tx) => {
        const created = await tx.sellerProfile.create({
          data: {
            userId,
            slug: input.slug,
            sellerType: input.sellerType,
            ...(input.discipline ? { discipline: input.discipline } : {}),
            fullName: input.fullName,
            country: input.country,
            socialLink: input.socialLink,
            telegramUrl: input.telegramUrl ?? null,
            instagramUrl: input.instagramUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            shortDescription: input.shortDescription,
            handoffContactType: input.handoffContactType,
            handoffContactValue: input.handoffContactValue,
            handoffInitiator: input.handoffInitiator ?? 'BUYER_CONTACTS_SELLER',
            profilePhotoMimeType: profilePhoto.mimeType,
            profilePhotoByteLength: profilePhoto.buffer.byteLength,
            profilePhotoChecksum: createHash('sha256')
              .update(profilePhoto.buffer)
              .digest('hex'),
            profilePhotoData: emptyImageBytes,
          },
          select: sellerProfileResponseSelect,
        });

        await this.imageStore.put(
          imageKey.sellerPhoto(created.id),
          {
            bytes: profilePhoto.buffer,
            mimeType: profilePhoto.mimeType,
          },
          tx,
        );
        await tx.sellerProfile.update({
          where: { id: created.id },
          data: { profilePhotoObjectKey: imageKey.sellerPhoto(created.id) },
        });

        return created;
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
      Object.assign(data, {
        profilePhotoMimeType: profilePhoto.mimeType,
        profilePhotoByteLength: profilePhoto.buffer.byteLength,
        profilePhotoChecksum: createHash('sha256')
          .update(profilePhoto.buffer)
          .digest('hex'),
      });
    }

    try {
      if (profilePhoto) {
        const sellerProfile = await this.prisma.$transaction(async (tx) => {
          const updated = await tx.sellerProfile.update({
            where: { id: current.id },
            data,
            select: sellerProfileResponseSelect,
          });

          await this.imageStore.put(
            imageKey.sellerPhoto(current.id),
            {
              bytes: profilePhoto.buffer,
              mimeType: profilePhoto.mimeType,
            },
            tx,
          );

          return updated;
        });

        return toSellerProfileResponse(sellerProfile);
      }

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

  async getProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerProfile: { userId } },
      select: {
        ...productSelect,
        creationIntro: true,
        creationSteps: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            position: true,
            title: true,
            body: true,
            mimeType: true,
            byteLength: true,
            checksum: true,
            width: true,
            height: true,
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    const latestReason = await this.prisma.auditEvent.findFirst({
      where: {
        targetType: 'PRODUCT',
        targetId: product.id,
        reason: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { reason: true },
    });

    return sellerProductDetailResponseSchema.parse({
      product: toContractProduct(product),
      creationIntro: product.creationIntro ?? null,
      creationSteps: product.creationSteps.map(toCreationStepContract),
      lastModerationReason: latestReason?.reason ?? null,
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
    const where = {
      status: 'APPROVED' as const,
      ...(query.tag
        ? {
            discipline: {
              contains: query.tag,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...searchWhere,
    };
    const [sellers, total] = await Promise.all([
      this.prisma.sellerProfile.findMany({
        where,
        select: {
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

  async getPublic(
    slug: string,
    query: PublicSellerWorksQuery = { page: 1, limit: 20, sort: 'activity' },
  ) {
    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: { slug, status: 'APPROVED' },
      select: publicSellerProfileSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const pageCte = publicSellerProductsCte(slug, query.status);
    const countCte = publicSellerProductsCte(slug);
    const [pageRows, totalRows, statusRows] = await Promise.all([
      this.prisma.$queryRaw<PublicSellerProductPageRow[]>(
        Prisma.sql`${pageCte}
          SELECT p."id"
          FROM filtered p
          ORDER BY ${Prisma.raw(publicSellerProductsOrderBy(query.sort))}
          LIMIT ${query.limit}
          OFFSET ${(query.page - 1) * query.limit}`,
      ),
      this.prisma.$queryRaw<PublicSellerCountRow[]>(
        Prisma.sql`${countCte} SELECT COUNT(*)::int AS "total" FROM filtered`,
      ),
      this.prisma.$queryRaw<PublicSellerStatusRow[]>(
        Prisma.sql`${countCte}
          SELECT "status", COUNT(*)::int AS "count"
          FROM filtered
          GROUP BY "status"`,
      ),
    ]);

    const products = pageRows.length
      ? await this.prisma.product.findMany({
          where: { id: { in: pageRows.map((row) => row.id) } },
          select: publicCatalogProductSelect,
        })
      : [];
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const orderedProducts = pageRows
      .map((row) => productsById.get(row.id))
      .filter(
        (product): product is (typeof products)[number] =>
          product !== undefined,
      );
    const statusCounts = { SCHEDULED: 0, LIVE: 0, ENDED: 0 };
    for (const row of statusRows) statusCounts[row.status] = Number(row.count);
    const total = Number(totalRows[0]?.total ?? 0);

    return publicSellerDetailResponseSchema.parse({
      sellerProfile: toPublicSellerProfile(sellerProfile),
      products: orderedProducts.map((product) =>
        this.products.toPublicProduct(product),
      ),
      statusCounts,
      pagination: { page: query.page, limit: query.limit, total },
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

    const stored = await this.imageStore.get(
      imageKey.sellerPhoto(sellerProfile.id),
    );

    if (!stored) {
      throw new NotFoundException('Seller profile not found');
    }

    return {
      status: sellerProfile.status,
      profilePhotoMimeType: stored.mimeType,
      profilePhotoData: stored.bytes,
    };
  }
}

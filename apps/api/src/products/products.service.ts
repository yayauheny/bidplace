import {
  creationStoryResponseSchema,
  type CreationStoryWriteRequest,
  publicProductDetailResponseSchema,
  productListResponseSchema,
  type PublicDiscoveryQuery,
  type ProductWriteRequest,
  type SellerStatus,
} from '@bidplace/contracts';
import { Prisma, type Prisma as PrismaTypes } from '@bidplace/database';
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

const publicCatalogProductSelect = {
  id: true,
  publicId: true,
  sellerProfileId: true,
  categoryId: true,
  title: true,
  story: true,
  technique: true,
  materials: true,
  dimensions: true,
  weight: true,
  year: true,
  condition: true,
  uniqueness: true,
  provenance: true,
  city: true,
  deliveryInfo: true,
  creationIntro: true,
  publishedAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  sellerProfile: { select: publicSellerProfileSelect },
  images: {
    orderBy: { position: 'asc' as const },
    select: {
      id: true,
      position: true,
      mimeType: true,
      byteLength: true,
      checksum: true,
      width: true,
      height: true,
    },
  },
  listings: {
    where: { status: { in: publicListingStatuses } },
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      productId: true,
      status: true,
      startsAt: true,
      originalEndsAt: true,
      endsAt: true,
      currentPrice: true,
      bidCount: true,
      closedAt: true,
      createdAt: true,
      updatedAt: true,
      auctionRules: { select: { startPrice: true } },
    },
  },
} satisfies PrismaTypes.ProductSelect;

type PublicCatalogPageRow = { id: string; total: number | bigint };

function escapeLikePattern(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

function toCreationStepContract(step: {
  id: string;
  position: number;
  title: string;
  body: string;
  mimeType: string | null;
  byteLength: number | null;
  checksum: string | null;
  width: number | null;
  height: number | null;
}) {
  return {
    id: step.id,
    position: step.position,
    title: step.title,
    body: step.body,
    image:
      step.mimeType && step.byteLength && step.checksum
        ? {
            url: `/api/creation-steps/${step.id}/image`,
            mimeType: step.mimeType,
            byteLength: step.byteLength,
            checksum: step.checksum,
            width: step.width,
            height: step.height,
          }
        : null,
  };
}

function publicCatalogOrderBy(sort: PublicDiscoveryQuery['sort']): string {
  switch (sort) {
    case 'activity':
      return 'p.status_rank ASC, p.bid_count DESC, p.current_price DESC, p.ends_at ASC, p.id ASC';
    case 'endingSoon':
      return 'p.status_rank ASC, p.ends_at ASC, p.id ASC';
    case 'priceAsc':
      return 'p.current_price ASC, p.id ASC';
    case 'priceDesc':
      return 'p.current_price DESC, p.id ASC';
    case 'newest':
      return 'p.published_at DESC NULLS LAST, p.id ASC';
  }
}

function publicCatalogCte(query: PublicDiscoveryQuery) {
  const filters: Prisma.Sql[] = [Prisma.sql`p."status" = 'APPROVED'`];

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    filters.push(Prisma.sql`(
      p."title" ILIKE ${pattern} ESCAPE '\\'
      OR p."story" ILIKE ${pattern} ESCAPE '\\'
      OR p."materials" ILIKE ${pattern} ESCAPE '\\'
      OR sp."full_name" ILIKE ${pattern} ESCAPE '\\'
    )`);
  }

  if (query.category) {
    filters.push(Prisma.sql`p."category_id" = CAST(${query.category} AS uuid)`);
  }

  if (query.author) {
    filters.push(Prisma.sql`sp."slug" = ${query.author}`);
  }

  if (query.yearFrom !== undefined) {
    filters.push(Prisma.sql`p."year" >= ${query.yearFrom}`);
  }

  if (query.yearTo !== undefined) {
    filters.push(Prisma.sql`p."year" <= ${query.yearTo}`);
  }

  for (const material of query.materials ?? []) {
    const pattern = `%${escapeLikePattern(material)}%`;
    filters.push(Prisma.sql`p."materials" ILIKE ${pattern} ESCAPE '\\'`);
  }

  if (query.status) {
    filters.push(
      Prisma.sql`c.status = CAST(${query.status} AS "ListingStatus")`,
    );
  }

  if (query.priceMin !== undefined) {
    filters.push(Prisma.sql`c.current_price >= ${query.priceMin}`);
  }

  if (query.priceMax !== undefined) {
    filters.push(Prisma.sql`c.current_price <= ${query.priceMax}`);
  }

  if (query.uniqueness) {
    filters.push(Prisma.sql`p."uniqueness" = ${query.uniqueness}`);
  }

  return Prisma.sql`WITH canonical AS (
    SELECT DISTINCT ON (l."product_id")
      l."product_id",
      l."status",
      CASE l."status"
        WHEN 'LIVE' THEN 0
        WHEN 'SCHEDULED' THEN 1
        ELSE 2
      END AS status_rank,
      l."ends_at",
      l."current_price",
      l."bid_count",
      l."created_at"
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
    SELECT p."id", p."category_id", p."seller_profile_id", p."materials", p."uniqueness", p."published_at", c."status", c.status_rank,
      c."ends_at", c."current_price", c."bid_count"
    FROM "products" p
    INNER JOIN "seller_profiles" sp ON sp."id" = p."seller_profile_id"
    INNER JOIN canonical c ON c."product_id" = p."id"
    WHERE sp."status" = 'APPROVED'
      AND ${Prisma.join(filters, ' AND ')}
  )`;
}

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
          creationIntro: input.creationIntro ?? null,
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
    if (input.deliveryInfo !== undefined)
      data.deliveryInfo = input.deliveryInfo;
    if (input.creationIntro !== undefined)
      data.creationIntro = input.creationIntro;

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

  async replaceCreationStory(
    userId: string,
    productId: string,
    input: CreationStoryWriteRequest,
  ) {
    const product = await this.requireEditableOwner(userId, productId);
    const incomingIds = input.steps.flatMap((step) =>
      step.id ? [step.id] : [],
    );
    if (new Set(incomingIds).size !== incomingIds.length) {
      throw new ConflictException('Creation steps must be unique');
    }

    return runSerializableTransaction(this.prisma, async (tx) => {
      const existing = await tx.productCreationStep.findMany({
        where: { productId },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((step) => step.id));
      if (incomingIds.some((id) => !existingIds.has(id))) {
        throw new NotFoundException('Creation step not found');
      }

      await tx.product.update({
        where: { id: product.id },
        data: { creationIntro: input.intro },
      });
      await tx.productCreationStep.deleteMany({
        where: { productId, id: { notIn: incomingIds } },
      });
      await tx.productCreationStep.updateMany({
        where: { productId },
        data: { position: { increment: 1000 } },
      });
      for (const [position, step] of input.steps.entries()) {
        if (step.id) {
          await tx.productCreationStep.update({
            where: { id: step.id },
            data: { position, title: step.title, body: step.body },
          });
        } else {
          await tx.productCreationStep.create({
            data: { productId, position, title: step.title, body: step.body },
          });
        }
      }

      const steps = await tx.productCreationStep.findMany({
        where: { productId },
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
      });
      return creationStoryResponseSchema.parse({
        creation: {
          intro: input.intro,
          steps: steps.map(toCreationStepContract),
        },
      });
    });
  }

  async reorderCreationSteps(
    userId: string,
    productId: string,
    stepIds: string[],
  ) {
    await this.requireEditableOwner(userId, productId);
    return runSerializableTransaction(this.prisma, async (tx) => {
      const steps = await tx.productCreationStep.findMany({
        where: { productId },
        select: { id: true },
      });
      const knownIds = new Set(steps.map((step) => step.id));
      if (
        stepIds.length !== knownIds.size ||
        new Set(stepIds).size !== stepIds.length ||
        stepIds.some((id) => !knownIds.has(id))
      ) {
        throw new ConflictException(
          'Creation step order must include every step exactly once',
        );
      }
      await tx.productCreationStep.updateMany({
        where: { productId },
        data: { position: { increment: 1000 } },
      });
      await Promise.all(
        stepIds.map((id, position) =>
          tx.productCreationStep.update({ where: { id }, data: { position } }),
        ),
      );
      return { ok: true as const };
    });
  }

  private async requireEditableOwner(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        status: true,
        sellerProfile: { select: { userId: true, status: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Product is not owned by user');
    }
    assertApprovedSeller(product.sellerProfile.status as SellerStatus);
    if (!isEditableProductStatus(product.status)) {
      throw new ForbiddenException('Product creation story is locked');
    }
    return product;
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
      creationIntro: product.creationIntro ?? null,
      creationSteps: (product.creationSteps ?? []).map((step) => ({
        id: step.id,
        position: step.position,
        title: step.title,
        body: step.body,
        image:
          step.mimeType && step.byteLength && step.checksum
            ? {
                url: `/api/creation-steps/${step.id}/image`,
                mimeType: step.mimeType,
                byteLength: step.byteLength,
                checksum: step.checksum,
                width: step.width,
                height: step.height,
              }
            : null,
      })),
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

  async listPublic(query: PublicDiscoveryQuery) {
    const cte = publicCatalogCte(query);
    const pageRows = await this.prisma.$queryRaw<PublicCatalogPageRow[]>(
      Prisma.sql`${cte}
        SELECT "id", COUNT(*) OVER()::int AS "total"
        FROM filtered p
        ORDER BY ${Prisma.raw(publicCatalogOrderBy(query.sort))}
        LIMIT ${query.limit}
        OFFSET ${(query.page - 1) * query.limit}`,
    );

    const total = pageRows.length
      ? Number(pageRows[0]!.total)
      : Number(
          (
            await this.prisma.$queryRaw<Array<{ total: number | bigint }>>(
              Prisma.sql`${cte}
                SELECT COUNT(*)::int AS "total"
                FROM filtered`,
            )
          )[0]?.total ?? 0,
        );

    if (!pageRows.length) {
      return productListResponseSchema.parse({
        products: [],
        pagination: { page: query.page, limit: query.limit, total },
        facets: await this.discoveryFacets(query),
      });
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: pageRows.map((row) => row.id) } },
      select: publicCatalogProductSelect,
    });
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const pagedProducts = pageRows
      .map((row) => productsById.get(row.id))
      .filter(
        (product): product is (typeof products)[number] =>
          product !== undefined,
      );

    return productListResponseSchema.parse({
      products: pagedProducts.map((product) => this.toPublicProduct(product)),
      pagination: { page: query.page, limit: query.limit, total },
      facets: await this.discoveryFacets(query),
    });
  }

  private async discoveryFacets(query: PublicDiscoveryQuery) {
    const facetQuery = { ...query, status: undefined };
    const cte = publicCatalogCte(facetQuery);
    const [statusRows, categoryRows, authorRows, materialRows, uniquenessRows] =
      await Promise.all([
        this.prisma.$queryRaw<
          Array<{
            status: 'SCHEDULED' | 'LIVE' | 'ENDED';
            count: number | bigint;
          }>
        >(
          Prisma.sql`${cte} SELECT "status", COUNT(*)::int AS "count" FROM filtered GROUP BY "status"`,
        ),
        this.prisma.$queryRaw<
          Array<{ id: string; name: string; count: number | bigint }>
        >(
          Prisma.sql`${cte}
          SELECT c."id", c."name", COUNT(*)::int AS "count"
          FROM filtered f
          INNER JOIN "categories" c ON c."id" = f."category_id"
          GROUP BY c."id", c."name"
          ORDER BY c."name" ASC`,
        ),
        this.prisma.$queryRaw<
          Array<{ slug: string; name: string; count: number | bigint }>
        >(
          Prisma.sql`${cte}
          SELECT sp."slug", sp."full_name" AS "name", COUNT(*)::int AS "count"
          FROM filtered f
          INNER JOIN "seller_profiles" sp ON sp."id" = f."seller_profile_id"
          GROUP BY sp."slug", sp."full_name"
          ORDER BY sp."full_name" ASC`,
        ),
        this.prisma.$queryRaw<Array<{ materials: string }>>(
          Prisma.sql`${cte}
          SELECT DISTINCT f."materials"
          FROM filtered f
          WHERE f."materials" IS NOT NULL
          ORDER BY f."materials" ASC`,
        ),
        this.prisma.$queryRaw<Array<{ uniqueness: string }>>(
          Prisma.sql`${cte}
          SELECT DISTINCT f."uniqueness"
          FROM filtered f
          WHERE f."uniqueness" IS NOT NULL
          ORDER BY f."uniqueness" ASC`,
        ),
      ]);
    const statusCounts = { SCHEDULED: 0, LIVE: 0, ENDED: 0 };
    for (const row of statusRows) statusCounts[row.status] = Number(row.count);
    return {
      statusCounts,
      categories: categoryRows.map((row) => ({
        ...row,
        count: Number(row.count),
      })),
      authors: authorRows.map((row) => ({
        ...row,
        count: Number(row.count),
      })),
      materials: materialRows.map((row) => row.materials),
      uniquenesses: uniquenessRows.map((row) => row.uniqueness),
    };
  }

  toPublicProduct(
    product: Awaited<ReturnType<PrismaService['product']['findFirst']>> &
      object,
  ) {
    const record = product as typeof product & {
      sellerProfile: {
        slug: string;
        sellerType: 'creator' | 'influencer';
        discipline: string;
        fullName: string;
        country: string;
        socialLink: string;
        telegramUrl: string | null;
        instagramUrl: string | null;
        websiteUrl: string | null;
        shortDescription: string;
      };
      images: Array<{
        id: string;
        position: number;
        mimeType: string;
        byteLength: number;
        checksum: string;
        width: number | null;
        height: number | null;
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

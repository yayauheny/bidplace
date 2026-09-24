import {
  portfolioAuthorDetailResponseSchema,
  portfolioAuthorsResponseSchema,
  portfolioAuthorApplicationResponseSchema,
  portfolioCabinetWorksResponseSchema,
  portfolioDiscoveryFacetsResponseSchema,
  portfolioHomeResponseSchema,
  portfolioWorkDetailResponseSchema,
  portfolioWorksResponseSchema,
  type PortfolioAuthorsQuery,
  type PortfolioWorksQuery,
  type PortfolioCabinetWorksQuery,
  type PortfolioAchievementWriteRequest,
} from '@bidplace/contracts';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../core/database';
import { ProductsService } from '../products/products.service';
import { SellersService } from '../sellers/sellers.service';

const HOME_CURATOR_SLOT = 'home';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly products: ProductsService,
    private readonly sellers: SellersService,
    private readonly prisma: PrismaService,
  ) {}

  async listWorks(query: PortfolioWorksQuery) {
    const response = await this.products.listPortfolio({
      page: query.page,
      limit: query.limit,
      q: query.q,
      category: query.category,
      materials: query.materials,
      sort: query.sort,
      author: query.author,
    });

    return portfolioWorksResponseSchema.parse({
      works: response.items.map(toPortfolioWorkItem),
      pagination: response.pagination,
    });
  }

  async getWork(publicId: string) {
    const response = await this.products.getPortfolio(publicId);
    const work = toPortfolioWorkItem(response);
    const authorWorks = await this.products.listPortfolio({
      page: 1,
      limit: 4,
      author: response.sellerProfile.slug,
      sort: 'newest',
    });

    return portfolioWorkDetailResponseSchema.parse({
      ...work,
      relatedWorks: authorWorks.items
        .filter((item) => item.product.publicId !== publicId)
        .map(toPortfolioWorkItem),
    });
  }

  async listAuthors(query: PortfolioAuthorsQuery) {
    const response = await this.sellers.listPortfolioAuthors(query, {
      requireCity: true,
    });
    const authors = response.sellers.map((item) => ({
      author: toPortfolioAuthor(item.sellerProfile),
      workCount: item.workCount,
    }));

    return portfolioAuthorsResponseSchema.parse({
      authors,
      pagination: response.pagination,
    });
  }

  async facets() {
    const [materials, authors] = await Promise.all([
      this.products.listPortfolioMaterialFacets(),
      this.sellers.listPublicFacets(),
    ]);
    return portfolioDiscoveryFacetsResponseSchema.parse({
      materials: normalizeFacetValues(materials),
      cities: normalizeFacetValues(authors.map((author) => author.city)),
      tags: normalizeFacetValues(authors.map((author) => author.discipline)),
    });
  }

  async getAuthor(slug: string, query: PortfolioWorksQuery) {
    const author = await this.sellers.getApprovedPublicAuthor(slug, {
      requireCity: true,
    });
    if (!author) throw new NotFoundException('Author not found');

    const works = await this.products.listPortfolio({
      page: query.page,
      limit: query.limit,
      q: query.q,
      category: query.category,
      materials: query.materials,
      sort: query.sort,
      author: slug,
    });

    return portfolioAuthorDetailResponseSchema.parse({
      author: toPortfolioAuthor(author.sellerProfile),
      works: works.items.map(toPortfolioWorkItem),
      pagination: works.pagination,
    });
  }

  async home() {
    const [works, authors, selection] = await Promise.all([
      this.listWorks({ page: 1, limit: 6, sort: 'newest' }),
      this.listAuthors({ page: 1, limit: 6, sort: 'added' }),
      this.prisma.curatorSelection.findUnique({
        where: { slot: HOME_CURATOR_SLOT },
        select: {
          productId: true,
          note: true,
          curator: { select: { slug: true } },
        },
      }),
    ]);
    let curatorSelection = null;
    if (selection?.curator.slug) {
      const product = await this.prisma.product.findUnique({
        where: { id: selection.productId },
        select: { publicId: true },
      });
      if (product) {
        try {
          const [item, curator] = await Promise.all([
            this.products.getPortfolio(product.publicId),
            this.sellers.getApprovedPublicAuthor(selection.curator.slug, {
              requireCity: true,
            }),
          ]);
          if (curator) {
            const mapped = toPortfolioWorkItem(item);
            curatorSelection = {
              curator: toPortfolioAuthor(curator.sellerProfile),
              work: {
                ...mapped.work,
                author: mapped.author,
              },
              note: selection.note?.trim() ? selection.note.trim() : null,
            };
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            throw error;
          }
        }
      }
    }
    return portfolioHomeResponseSchema.parse({
      curatorSelection,
      newWorks: works.works,
      newAuthors: authors.authors.map((item) => item.author),
    });
  }

  async setCuratorSelection(
    publicId: string,
    curatorSlug: string,
    note: string | null,
    actorUserId: string,
  ) {
    let item;
    try {
      item = await this.products.getPortfolio(publicId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ConflictException('Work is not publicly visible');
      }
      throw error;
    }
    const curator = await this.sellers.getApprovedPublicAuthor(curatorSlug, {
      requireCity: true,
    });
    if (!curator) {
      throw new ConflictException('Curator is not publicly visible');
    }
    const selectedAt = new Date();
    await this.prisma.curatorSelection.upsert({
      where: { slot: HOME_CURATOR_SLOT },
      create: {
        slot: HOME_CURATOR_SLOT,
        productId: item.product.id,
        curatorSellerProfileId: curator.sellerProfile.id,
        note,
        selectedAt,
        selectedByUserId: actorUserId,
      },
      update: {
        productId: item.product.id,
        curatorSellerProfileId: curator.sellerProfile.id,
        note,
        selectedAt,
        selectedByUserId: actorUserId,
      },
    });
    return {
      publicId: item.product.publicId,
      productId: item.product.id,
      curatorSlug: curator.sellerProfile.slug,
      selectedAt: selectedAt.toISOString(),
      note,
    };
  }

  async clearCuratorSelection() {
    await this.prisma.curatorSelection.deleteMany({
      where: { slot: HOME_CURATOR_SLOT },
    });
    return { ok: true as const };
  }

  async getApplication(userId: string) {
    const response = await this.sellers.getMine(userId);
    const profile = response.sellerProfile;
    return portfolioAuthorApplicationResponseSchema.parse({
      application: {
        slug: profile.slug,
        fullName: profile.fullName,
        country: profile.country,
        city: profile.city,
        discipline: profile.discipline,
        practice: profile.practice,
        shortDescription: profile.shortDescription,
        status: profile.status,
        applicationStage: profile.applicationStage,
      },
      editingRevision: response.editingRevision,
      achievements: await this.sellers.listEditingAchievements(userId),
    });
  }

  async submitApplication(userId: string) {
    await this.sellers.submitProfileRevision(userId);
    return this.getApplication(userId);
  }

  async advanceApplication(userId: string) {
    await this.sellers.advanceApplicationStage(userId);
    return this.getApplication(userId);
  }

  addAchievement(
    userId: string,
    input: PortfolioAchievementWriteRequest,
    image?: Parameters<SellersService['addAchievement']>[2],
  ) {
    return this.sellers.addAchievement(userId, input, image);
  }

  deleteAchievement(userId: string, achievementId: string) {
    return this.sellers.deleteAchievement(userId, achievementId);
  }

  getApplicationPhoto(userId: string) {
    return this.sellers.getEditingPhoto(userId);
  }

  getAchievementImage(id: string, userId?: string, role?: string) {
    return this.sellers.getAchievementImage(id, userId, role);
  }

  async listCabinetWorks(userId: string, query: PortfolioCabinetWorksQuery) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { status: true },
    });
    if (seller?.status !== 'APPROVED' && seller?.status !== 'SUSPENDED') {
      throw new ForbiddenException('Author cabinet is unavailable');
    }
    const where = { sellerProfile: { userId } };
    const offset = (query.page - 1) * query.limit;
    const [pageRows, total] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          id: string;
          effectiveUpdatedAt: Date;
          moderationMessage: string | null;
        }>
      >`
        SELECT
          product.id,
          GREATEST(product.updated_at, COALESCE(revision.updated_at, product.updated_at)) AS "effectiveUpdatedAt",
          moderation.reason AS "moderationMessage"
        FROM products AS product
        INNER JOIN seller_profiles AS seller
          ON seller.id = product.seller_profile_id
        LEFT JOIN product_revisions AS revision
          ON revision.id = product.editing_revision_id
        LEFT JOIN LATERAL (
          SELECT audit.reason
          FROM audit_events AS audit
          WHERE audit.target_type::text = 'PRODUCT'
            AND audit.target_id = product.id
            AND audit.new_status IN ('CHANGES_REQUESTED', 'REJECTED')
            AND (
              audit.new_status = product.status::text
              OR audit.new_status = revision.status::text
            )
          ORDER BY audit.created_at DESC, audit.id DESC
          LIMIT 1
        ) AS moderation ON TRUE
        WHERE seller.user_id = ${userId}::uuid
        ORDER BY
          GREATEST(product.updated_at, COALESCE(revision.updated_at, product.updated_at)) DESC,
          product.id DESC
        OFFSET ${offset}
        LIMIT ${query.limit}
      `,
      this.prisma.product.count({ where }),
    ]);
    const productIds = pageRows.map((row) => row.id);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            publicId: true,
            title: true,
            status: true,
            images: {
              orderBy: { position: 'asc' },
              take: 1,
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
            editingRevision: {
              select: {
                title: true,
                status: true,
                images: {
                  orderBy: { position: 'asc' },
                  take: 1,
                  select: {
                    position: true,
                    image: {
                      select: {
                        id: true,
                        mimeType: true,
                        byteLength: true,
                        checksum: true,
                        width: true,
                        height: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : [];
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    return portfolioCabinetWorksResponseSchema.parse({
      works: pageRows.flatMap((row) => {
        const product = productsById.get(row.id);
        if (!product) return [];
        const revision = product.editingRevision;
        const revisionImage = revision?.images[0];
        const image = revision
          ? revisionImage
            ? { ...revisionImage.image, position: revisionImage.position }
            : null
          : (product.images[0] ?? null);
        return [
          {
            id: product.id,
            publicId: product.publicId,
            title: revision ? revision.title : product.title,
            status: product.status,
            editingRevisionStatus: revision?.status ?? null,
            updatedAt: row.effectiveUpdatedAt.toISOString(),
            moderationMessage: row.moderationMessage,
            coverImage: image
              ? {
                  ...image,
                  url: `/api/images/${image.id}`,
                  width: image.width ?? null,
                  height: image.height ?? null,
                }
              : null,
          },
        ];
      }),
      pagination: { page: query.page, limit: query.limit, total },
    });
  }
}

function normalizeFacetValues(values: Array<string | null>) {
  const valuesByKey = new Map<string, string>();
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase('ru-RU');
    if (!valuesByKey.has(key)) {
      valuesByKey.set(key, normalized);
    }
  }
  return [...valuesByKey.values()].sort(
    (left, right) =>
      left.localeCompare(right, 'ru-RU', { sensitivity: 'base' }) ||
      left.localeCompare(right),
  );
}

function toPortfolioWorkItem(item: {
  product: {
    id: string;
    publicId: string;
    title: string;
    story: string | null;
    categoryId: string;
    technique: string | null;
    materials: string | null;
    dimensions: string | null;
    year: number | null;
    uniqueness?: string | null;
    images: Array<unknown>;
    publishedAt: string;
  };
  sellerProfile: Parameters<typeof toPortfolioAuthor>[0];
}) {
  const { product, sellerProfile } = item;
  return {
    work: {
      id: product.id,
      publicId: product.publicId,
      title: product.title,
      story: product.story,
      categoryId: product.categoryId,
      technique: product.technique,
      materials: product.materials,
      dimensions: product.dimensions,
      year: product.year,
      uniqueness: product.uniqueness?.trim() || null,
      images: product.images,
      publishedAt: product.publishedAt,
      sharePath: `/works/${product.publicId}`,
    },
    author: toPortfolioAuthor(sellerProfile),
  };
}

function toPortfolioAuthor(profile: {
  id: string;
  slug: string;
  fullName: string;
  country: string;
  city: string | null;
  discipline: string | null;
  practice: string | null;
  biography?: string | null;
  profilePhotoUrl: string;
  telegramUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  shortDescription: string | null;
  achievements?:
    | Array<{
        id: string;
        occurredDate: { year: number; month: number; day: number | null } | null;
        body: string;
        image?: {
          url: string;
          mimeType: string;
          byteLength: number;
          checksum: string;
        } | null;
      }>
    | undefined;
}) {
  if (!profile.discipline || !profile.shortDescription) {
    throw new Error('Public author is missing required fields');
  }
  return {
    id: profile.id,
    slug: profile.slug,
    fullName: profile.fullName,
    country: profile.country,
    city: profile.city ?? '',
    discipline: profile.discipline,
    practice: profile.practice,
    biography: profile.biography ?? null,
    profilePhotoUrl: profile.profilePhotoUrl,
    telegramUrl: profile.telegramUrl,
    instagramUrl: profile.instagramUrl,
    websiteUrl: profile.websiteUrl,
    publicEmail: profile.publicEmail,
    shortDescription: profile.shortDescription,
    achievements: profile.achievements ?? [],
    sharePath: `/authors/${profile.slug}`,
  };
}

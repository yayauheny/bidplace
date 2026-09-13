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
  type PortfolioAchievementWriteRequest,
} from '@bidplace/contracts';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

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
    const response = await this.sellers.listPublic(query, {
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
      tags: normalizeFacetValues(
        authors.map((author) => author.discipline),
      ),
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
        select: { productId: true },
      }),
    ]);
    let curatorSelection = null;
    if (selection) {
      const product = await this.prisma.product.findUnique({
        where: { id: selection.productId },
        select: { publicId: true },
      });
      if (product) {
        try {
          curatorSelection = toPortfolioWorkItem(
            await this.products.getPortfolio(product.publicId),
          );
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

  async setCuratorSelection(publicId: string, actorUserId: string) {
    let item;
    try {
      item = await this.products.getPortfolio(publicId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ConflictException('Work is not publicly visible');
      }
      throw error;
    }
    const selectedAt = new Date();
    await this.prisma.curatorSelection.upsert({
      where: { slot: HOME_CURATOR_SLOT },
      create: {
        slot: HOME_CURATOR_SLOT,
        productId: item.product.id,
        selectedAt,
        selectedByUserId: actorUserId,
      },
      update: {
        productId: item.product.id,
        selectedAt,
        selectedByUserId: actorUserId,
      },
    });
    return {
      publicId: item.product.publicId,
      productId: item.product.id,
      selectedAt: selectedAt.toISOString(),
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
      },
      editingRevision: response.editingRevision,
    });
  }

  async submitApplication(userId: string) {
    await this.sellers.submitProfileRevision(userId);
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

  async listCabinetWorks(userId: string) {
    const works = await this.sellers.listCabinetWorks(userId);
    return portfolioCabinetWorksResponseSchema.parse({ works });
  }

  hideWork(userId: string, productId: string) {
    return this.products.hide(userId, productId);
  }

  unhideWork(userId: string, productId: string) {
    return this.products.unhide(userId, productId);
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
  discipline: string;
  practice: string | null;
  profilePhotoUrl: string;
  telegramUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  shortDescription: string;
  achievements?:
    | Array<{
        id: string;
        occurredAt: string | null;
        body: string;
        image: {
          url: string;
          mimeType: string;
          byteLength: number;
          checksum: string;
        } | null;
      }>
    | undefined;
}) {
  return {
    id: profile.id,
    slug: profile.slug,
    fullName: profile.fullName,
    country: profile.country,
    city: profile.city,
    discipline: profile.discipline,
    practice: profile.practice,
    profilePhotoUrl: profile.profilePhotoUrl,
    telegramUrl: profile.telegramUrl,
    instagramUrl: profile.instagramUrl,
    websiteUrl: profile.websiteUrl,
    shortDescription: profile.shortDescription,
    achievements: profile.achievements ?? [],
    sharePath: `/authors/${profile.slug}`,
  };
}

import {
  portfolioAuthorDetailResponseSchema,
  portfolioAuthorsResponseSchema,
  portfolioAuthorApplicationResponseSchema,
  portfolioCabinetWorksResponseSchema,
  portfolioHomeResponseSchema,
  portfolioWorkDetailResponseSchema,
  portfolioWorksResponseSchema,
  type PortfolioAuthorsQuery,
  type PortfolioWorksQuery,
  type PortfolioAchievementWriteRequest,
} from '@bidplace/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';

import { ProductsService } from '../products/products.service';
import { SellersService } from '../sellers/sellers.service';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly products: ProductsService,
    private readonly sellers: SellersService,
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
    const response = await this.sellers.listPublic(
      {
        page: query.page,
        limit: query.limit,
        q: query.q,
        tag: query.tag,
        city: query.city,
        sort: query.sort === 'name' ? 'name' : 'activity',
      },
      { requireCity: true },
    );
    const authors = response.sellers.map((item) => ({
      author: toPortfolioAuthor(item.sellerProfile),
      workCount: item.workCount,
    }));

    return portfolioAuthorsResponseSchema.parse({
      authors,
      pagination: response.pagination,
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
    const [works, authors] = await Promise.all([
      this.listWorks({ page: 1, limit: 6, sort: 'newest' }),
      this.listAuthors({ page: 1, limit: 6, sort: 'added' }),
    ]);
    return portfolioHomeResponseSchema.parse({
      curatorSelection: null,
      newWorks: works.works,
      newAuthors: authors.authors.map((item) => item.author),
    });
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

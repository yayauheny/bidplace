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
    const response = await this.products.listPublic({
      page: query.page,
      limit: query.limit,
      q: query.q,
      category: query.category,
      materials: query.materials,
      sort: query.sort,
    });

    return portfolioWorksResponseSchema.parse({
      works: response.products.map(toPortfolioWorkItem),
      pagination: response.pagination,
    });
  }

  async getWork(publicId: string) {
    const response = await this.products.getPublic(publicId);
    const work = toPortfolioWorkItem(response);
    const authorWorks = await this.products.listPublic({
      page: 1,
      limit: 4,
      author: response.sellerProfile.slug,
      sort: 'newest',
    });

    return portfolioWorkDetailResponseSchema.parse({
      ...work,
      relatedWorks: authorWorks.products
        .filter((item) => item.product.publicId !== publicId)
        .map(toPortfolioWorkItem),
    });
  }

  async listAuthors(query: PortfolioAuthorsQuery) {
    const response = await this.sellers.listPublic({
      page: query.page,
      limit: query.limit,
      q: query.q,
      tag: query.tag,
      sort: query.sort === 'name' ? 'name' : 'activity',
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

  async getAuthor(slug: string, query: PortfolioWorksQuery) {
    const response = await this.sellers.getPublic(slug, {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });

    if (!response) throw new NotFoundException('Author not found');

    return portfolioAuthorDetailResponseSchema.parse({
      author: toPortfolioAuthor(response.sellerProfile),
      works: response.products.map(toPortfolioWorkItem),
      pagination: response.pagination,
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
        discipline: profile.discipline,
        shortDescription: profile.shortDescription,
        status: profile.status,
      },
    });
  }

  async listCabinetWorks(userId: string) {
    const response = await this.sellers.listProducts(userId);
    const works = await Promise.all(
      response.products.map(async (product) => {
        const detail = await this.sellers.getProduct(userId, product.id);
        return {
          id: product.id,
          publicId: product.publicId,
          title: product.title,
          status: product.status,
          updatedAt: product.updatedAt,
          moderationMessage: detail.lastModerationReason,
        };
      }),
    );
    return portfolioCabinetWorksResponseSchema.parse({ works });
  }
}

function toPortfolioWorkItem(item: {
  product: {
    id: string;
    publicId: string;
    title: string | null;
    story: string | null;
    categoryId: string | null;
    technique: string | null;
    materials: string | null;
    dimensions: string | null;
    year: number | null;
    images: Array<unknown>;
    publishedAt: string | null;
  };
  sellerProfile: Parameters<typeof toPortfolioAuthor>[0];
}) {
  const { product, sellerProfile } = item;
  if (
    !product.title ||
    !product.categoryId ||
    !product.publishedAt ||
    product.images.length === 0
  ) {
    throw new NotFoundException('Work not found');
  }
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
    },
    author: toPortfolioAuthor(sellerProfile),
  };
}

function toPortfolioAuthor(profile: {
  id: string;
  slug: string;
  fullName: string;
  country: string;
  discipline: string;
  profilePhotoUrl: string;
  telegramUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  shortDescription: string;
}) {
  return {
    id: profile.id,
    slug: profile.slug,
    fullName: profile.fullName,
    country: profile.country,
    discipline: profile.discipline,
    profilePhotoUrl: profile.profilePhotoUrl,
    telegramUrl: profile.telegramUrl,
    instagramUrl: profile.instagramUrl,
    websiteUrl: profile.websiteUrl,
    shortDescription: profile.shortDescription,
  };
}

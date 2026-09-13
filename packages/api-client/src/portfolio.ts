import {
  portfolioAuthorDetailResponseSchema,
  portfolioAuthorsQuerySchema,
  portfolioAuthorsResponseSchema,
  portfolioAuthorApplicationResponseSchema,
  portfolioCabinetWorksResponseSchema,
  portfolioDiscoveryFacetsResponseSchema,
  portfolioHomeResponseSchema,
  portfolioWorkDetailResponseSchema,
  portfolioWorksQuerySchema,
  portfolioWorksResponseSchema,
  portfolioAchievementResponseSchema,
  portfolioAchievementWriteRequestSchema,
  portfolioOkResponseSchema,
  productResponseSchema,
  type PortfolioAchievementWriteRequest,
  type PortfolioAuthorsQuery,
  type PortfolioWorksQuery,
} from '@bidplace/contracts';

import { requestBlob, requestJson, type RequestContext } from './request';

export function createPortfolioClient(context: RequestContext) {
  return {
    home() {
      return requestJson(
        context,
        '/api/portfolio/home',
        portfolioHomeResponseSchema,
      );
    },
    listWorks(query?: Partial<PortfolioWorksQuery>) {
      return requestJson(context, '/api/works', portfolioWorksResponseSchema, {
        query: portfolioWorksQuerySchema.parse(query ?? {}),
      });
    },
    getWork(publicId: string) {
      return requestJson(
        context,
        `/api/works/${publicId}`,
        portfolioWorkDetailResponseSchema,
      );
    },
    listAuthors(query?: Partial<PortfolioAuthorsQuery>) {
      return requestJson(
        context,
        '/api/authors',
        portfolioAuthorsResponseSchema,
        {
          query: portfolioAuthorsQuerySchema.parse(query ?? {}),
        },
      );
    },
    facets() {
      return requestJson(
        context,
        '/api/portfolio/facets',
        portfolioDiscoveryFacetsResponseSchema,
      );
    },
    getAuthor(slug: string, query?: Partial<PortfolioWorksQuery>) {
      return requestJson(
        context,
        `/api/authors/${slug}`,
        portfolioAuthorDetailResponseSchema,
        { query: portfolioWorksQuerySchema.parse(query ?? {}) },
      );
    },
    getAuthorApplication() {
      return requestJson(
        context,
        '/api/author/application',
        portfolioAuthorApplicationResponseSchema,
      );
    },
    getAuthorApplicationPhoto() {
      return requestBlob(context, '/api/author/application/photo');
    },
    submitAuthorApplication() {
      return requestJson(
        context,
        '/api/author/application/submit',
        portfolioAuthorApplicationResponseSchema,
        { method: 'POST' },
      );
    },
    addAuthorAchievement(
      input: PortfolioAchievementWriteRequest,
      image?: Blob,
    ) {
      return requestJson(
        context,
        '/api/author/application/achievements',
        portfolioAchievementResponseSchema,
        {
          method: 'POST',
          body: {
            ...portfolioAchievementWriteRequestSchema.parse(input),
            image,
          },
          asFormData: true,
        },
      );
    },
    deleteAuthorAchievement(id: string) {
      return requestJson(
        context,
        `/api/author/application/achievements/${id}`,
        portfolioOkResponseSchema,
        { method: 'DELETE' },
      );
    },
    listCabinetWorks() {
      return requestJson(
        context,
        '/api/author/cabinet/works',
        portfolioCabinetWorksResponseSchema,
      );
    },
    hideWork(id: string) {
      return requestJson(
        context,
        `/api/products/${id}/hide`,
        productResponseSchema,
        { method: 'POST' },
      );
    },
    unhideWork(id: string) {
      return requestJson(
        context,
        `/api/products/${id}/unhide`,
        productResponseSchema,
        { method: 'POST' },
      );
    },
  };
}

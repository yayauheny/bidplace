import {
  portfolioAuthorDetailResponseSchema,
  portfolioAuthorsQuerySchema,
  portfolioAuthorsResponseSchema,
  portfolioAuthorApplicationResponseSchema,
  portfolioCabinetWorksQuerySchema,
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
  type PortfolioCabinetWorksQuery,
  type PortfolioWorksQuery,
} from '@bidplace/contracts';

import {
  requestBlob,
  requestJson,
  signalRequestOptions,
  type ReadCallOptions,
  type RequestContext,
} from './request';

export function createPortfolioClient(context: RequestContext) {
  return {
    home(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/portfolio/home',
        portfolioHomeResponseSchema,
        signalRequestOptions(options),
      );
    },
    listWorks(query?: Partial<PortfolioWorksQuery>, options?: ReadCallOptions) {
      return requestJson(context, '/api/works', portfolioWorksResponseSchema, {
        query: portfolioWorksQuerySchema.parse(query ?? {}),
        ...signalRequestOptions(options),
      });
    },
    getWork(publicId: string, options?: ReadCallOptions) {
      return requestJson(
        context,
        `/api/works/${publicId}`,
        portfolioWorkDetailResponseSchema,
        signalRequestOptions(options),
      );
    },
    facets(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/portfolio/facets',
        portfolioDiscoveryFacetsResponseSchema,
        signalRequestOptions(options),
      );
    },
    listAuthors(
      query?: Partial<PortfolioAuthorsQuery>,
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        '/api/authors',
        portfolioAuthorsResponseSchema,
        {
          query: portfolioAuthorsQuerySchema.parse(query ?? {}),
          ...signalRequestOptions(options),
        },
      );
    },
    getAuthor(
      slug: string,
      query?: Partial<PortfolioWorksQuery>,
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        `/api/authors/${slug}`,
        portfolioAuthorDetailResponseSchema,
        {
          query: portfolioWorksQuerySchema.parse(query ?? {}),
          ...signalRequestOptions(options),
        },
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
    advanceAuthorApplication() {
      return requestJson(
        context,
        '/api/author/application/advance',
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
    listCabinetWorks(query?: Partial<PortfolioCabinetWorksQuery>) {
      return requestJson(
        context,
        '/api/author/cabinet/works',
        portfolioCabinetWorksResponseSchema,
        { query: portfolioCabinetWorksQuerySchema.parse(query ?? {}) },
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

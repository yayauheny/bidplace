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
  type PortfolioAuthorsQuery,
  type PortfolioWorksQuery,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

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
    facets() {
      return requestJson(
        context,
        '/api/portfolio/facets',
        portfolioDiscoveryFacetsResponseSchema,
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
    submitAuthorApplication() {
      return requestJson(
        context,
        '/api/author/application/submit',
        portfolioAuthorApplicationResponseSchema,
        { method: 'POST' },
      );
    },
    listCabinetWorks() {
      return requestJson(
        context,
        '/api/author/cabinet/works',
        portfolioCabinetWorksResponseSchema,
      );
    },
  };
}

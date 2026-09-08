import {
  portfolioAuthorDetailResponseSchema,
  portfolioAuthorsQuerySchema,
  portfolioAuthorsResponseSchema,
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
  };
}

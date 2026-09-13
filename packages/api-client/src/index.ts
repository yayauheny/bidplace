import { type ZodType } from 'zod';

import { createAdminClient } from './admin';
import { createAnalyticsClient } from './analytics';
import { createAuthClient } from './auth';
import { createCategoriesClient } from './categories';
export {
  ApiClientError,
  getApiErrorCode,
  type ApiClientErrorKind,
} from './errors';
import { createImagesClient } from './images';
import { createProductsClient } from './products';
import { createPortfolioClient } from './portfolio';
import {
  createRequestContext,
  requestJson,
  type ApiClientOptions,
  type RequestOptions,
} from './request';
import { createSellersClient } from './sellers';

export type { ApiClientOptions, RequestOptions };

export function createApiClient(options: ApiClientOptions) {
  const context = createRequestContext(options);

  return {
    baseUrl: context.baseUrl,
    request<T>(
      path: string,
      schema: ZodType<T>,
      requestOptions?: RequestOptions,
    ) {
      return requestJson(context, path, schema, requestOptions);
    },
    auth: createAuthClient(context),
    analytics: createAnalyticsClient(context),
    images: createImagesClient(context),
    products: createProductsClient(context),
    portfolio: createPortfolioClient(context),
    sellers: createSellersClient(context),
    admin: createAdminClient(context),
    categories: createCategoriesClient(context),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

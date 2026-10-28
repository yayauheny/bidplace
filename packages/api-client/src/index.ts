import { type ZodType } from 'zod';

import { createAdminClient } from './admin';
import { createAnalyticsClient } from './analytics';
import { createAuthClient } from './auth';
import { createCategoriesClient } from './categories';
import { createCatalogClient } from './catalog';
import { createCountriesClient } from './countries';
export {
  ApiClientError,
  classifyApiError,
  getApiErrorCode,
  parseApiError,
  type ApiClientErrorKind,
} from './errors';
import { createImagesClient } from './images';
import { createProductsClient } from './products';
import { createPortfolioClient } from './portfolio';
import {
  createRequestContext,
  requestJson,
  type ApiClientOptions,
  type ReadCallOptions,
  type RequestOptions,
} from './request';
import { createSellersClient } from './sellers';

export type { ApiClientOptions, ReadCallOptions, RequestOptions };

export function createApiClient(options: ApiClientOptions) {
  const context = createRequestContext(options);

  return {
    baseUrl: context.baseUrl,
    request<TSchema extends ZodType>(
      path: string,
      schema: TSchema,
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
    catalog: createCatalogClient(context),
    countries: createCountriesClient(context),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

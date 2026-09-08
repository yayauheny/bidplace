import { type ZodType } from 'zod';

import { createAdminClient } from './admin';
import { createActivityClient } from './activity';
import { createAnalyticsClient } from './analytics';
import { createAuthClient } from './auth';
import { createCategoriesClient } from './categories';
import { createDiscoveryClient } from './discovery';
export {
  ApiClientError,
  getApiErrorCode,
  getBidTooLowMinimum,
  type ApiClientErrorKind,
} from './errors';
import { createListingsClient } from './listings';
import { createImagesClient } from './images';
import { createOrdersClient } from './orders';
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
    activity: createActivityClient(context),
    analytics: createAnalyticsClient(context),
    listings: createListingsClient(context),
    images: createImagesClient(context),
    products: createProductsClient(context),
    portfolio: createPortfolioClient(context),
    orders: createOrdersClient(context),
    sellers: createSellersClient(context),
    admin: createAdminClient(context),
    categories: createCategoriesClient(context),
    discovery: createDiscoveryClient(context),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

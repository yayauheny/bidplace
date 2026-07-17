import { type ZodType } from 'zod';

import { createAdminClient } from './admin';
import { createAuthClient } from './auth';
import { createAuctionsClient } from './auctions';
import { createCategoriesClient } from './categories';
export {
  ApiClientError,
  type ApiClientErrorKind,
} from './errors';
import { createLotsClient } from './lots';
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
    request<T>(path: string, schema: ZodType<T>, requestOptions?: RequestOptions) {
      return requestJson(context, path, schema, requestOptions);
    },
    auth: createAuthClient(context),
    auctions: createAuctionsClient(context),
    lots: createLotsClient(context),
    sellers: createSellersClient(context),
    admin: createAdminClient(context),
    categories: createCategoriesClient(context),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

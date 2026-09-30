import { categoryListResponseSchema } from '@bidplace/contracts';

import {
  requestJson,
  signalRequestOptions,
  type ReadCallOptions,
  type RequestContext,
} from './request';

export function createCategoriesClient(context: RequestContext) {
  return {
    list(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/categories',
        categoryListResponseSchema,
        signalRequestOptions(options),
      );
    },
  };
}

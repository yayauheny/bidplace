import { categoryListResponseSchema } from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createCategoriesClient(context: RequestContext) {
  return {
    list() {
      return requestJson(context, '/api/categories', categoryListResponseSchema);
    },
  };
}

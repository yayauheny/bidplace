import { catalogTermListResponseSchema, catalogTermRoleSchema } from '@bidplace/contracts';

import { requestJson, signalRequestOptions, type ReadCallOptions, type RequestContext } from './request';

export function createCatalogClient(context: RequestContext) {
  return {
    listTerms(role: 'MATERIAL' | 'TECHNIQUE', options?: ReadCallOptions) {
      return requestJson(context, '/api/catalog/terms', catalogTermListResponseSchema, {
        query: { role: catalogTermRoleSchema.parse(role) },
        ...signalRequestOptions(options),
      });
    },
  };
}

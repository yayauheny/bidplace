import {
  lotCreateRequestSchema,
  lotResponseSchema,
  type LotCreateRequest,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createLotsClient(context: RequestContext) {
  return {
    create(input: LotCreateRequest, images: Array<Blob | File>) {
      const parsed = lotCreateRequestSchema.parse(input);

      return requestJson(context, '/api/lots', lotResponseSchema, {
        method: 'POST',
        body: { ...parsed, images },
        asFormData: true,
      });
    },
  };
}

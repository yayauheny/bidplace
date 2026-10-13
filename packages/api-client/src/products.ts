import {
  productResponseSchema,
  productWriteRequestSchema,
  storyResponseSchema,
  storyWriteRequestSchema,
  type StoryWriteRequest,
  type ProductWriteRequest,
} from '@bidplace/contracts';

import { parseRequest } from './errors/parse-request';
import { requestJson, type RequestContext } from './request';

export function createProductsClient(context: RequestContext) {
  return {
    create(input: ProductWriteRequest) {
      return requestJson(context, '/api/products', productResponseSchema, {
        method: 'POST',
        body: parseRequest(productWriteRequestSchema, input),
      });
    },
    submit(id: string) {
      return requestJson(
        context,
        `/api/products/${id}/submit`,
        productResponseSchema,
        {
          method: 'POST',
        },
      );
    },
    update(id: string, input: ProductWriteRequest) {
      return requestJson(
        context,
        `/api/products/${id}`,
        productResponseSchema,
        {
          method: 'PATCH',
          body: parseRequest(productWriteRequestSchema, input),
        },
      );
    },
    replaceCreation(id: string, input: StoryWriteRequest) {
      return requestJson(
        context,
        `/api/products/${id}/creation`,
        storyResponseSchema,
        {
          method: 'PUT',
          body: parseRequest(storyWriteRequestSchema, input),
        },
      );
    },
  };
}

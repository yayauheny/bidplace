import { z } from 'zod';
import {
  productResponseSchema,
  productWriteRequestSchema,
  creationStepOrderRequestSchema,
  creationStoryResponseSchema,
  creationStoryWriteRequestSchema,
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
    replaceCreation(id: string, input: unknown) {
      return requestJson(
        context,
        `/api/products/${id}/creation`,
        creationStoryResponseSchema,
        {
          method: 'PUT',
          body: creationStoryWriteRequestSchema.parse(input),
        },
      );
    },
    reorderCreation(id: string, stepIds: string[]) {
      return requestJson(
        context,
        `/api/products/${id}/creation/order`,
        z.object({ ok: z.literal(true) }).strict(),
        {
          method: 'PATCH',
          body: creationStepOrderRequestSchema.parse({ stepIds }),
        },
      );
    },
  };
}

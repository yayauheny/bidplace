import {
  paginationQuerySchema,
  productListResponseSchema,
  productResponseSchema,
  productWriteRequestSchema,
  publicProductDetailResponseSchema,
  type PaginationQuery,
  type ProductWriteRequest,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createProductsClient(context: RequestContext) {
  return {
    list(query?: PaginationQuery) {
      return requestJson(context, '/api/products', productListResponseSchema, {
        query: paginationQuerySchema.parse(query ?? {}),
      });
    },
    get(publicId: string) {
      return requestJson(
        context,
        `/api/products/${publicId}`,
        publicProductDetailResponseSchema,
      );
    },
    create(input: ProductWriteRequest) {
      return requestJson(context, '/api/products', productResponseSchema, {
        method: 'POST',
        body: productWriteRequestSchema.parse(input),
      });
    },
    submit(id: string) {
      return requestJson(context, `/api/products/${id}/submit`, productResponseSchema, {
        method: 'POST',
      });
    },
    update(id: string, input: ProductWriteRequest) {
      return requestJson(context, `/api/products/${id}`, productResponseSchema, {
        method: 'PATCH',
        body: productWriteRequestSchema.parse(input),
      });
    },
  };
}

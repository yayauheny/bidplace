import {
  orderResponseSchema,
  paginationQuerySchema,
  sellerOrderListResponseSchema,
  type PaginationQueryInput,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createOrdersClient(context: RequestContext) {
  return {
    list(query?: PaginationQueryInput) {
      return requestJson(
        context,
        '/api/orders',
        sellerOrderListResponseSchema,
        { query: paginationQuerySchema.parse(query ?? {}) },
      );
    },
    get(publicId: string) {
      return requestJson(context, `/api/orders/${publicId}`, orderResponseSchema);
    },
    contacted(publicId: string) {
      return requestJson(context, `/api/orders/${publicId}/contacted`, orderResponseSchema, {
        method: 'POST',
      });
    },
    completed(publicId: string) {
      return requestJson(context, `/api/orders/${publicId}/completed`, orderResponseSchema, {
        method: 'POST',
      });
    },
    handoffFailed(publicId: string) {
      return requestJson(
        context,
        `/api/orders/${publicId}/handoff-failed`,
        orderResponseSchema,
        {
          method: 'POST',
        },
      );
    },
  };
}

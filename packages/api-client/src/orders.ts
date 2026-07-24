import { orderResponseSchema } from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createOrdersClient(context: RequestContext) {
  return {
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

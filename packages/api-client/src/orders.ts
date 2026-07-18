import { orderResponseSchema } from '@bidplace/contracts'; import { requestJson, type RequestContext } from './request';
export function createOrdersClient(context: RequestContext) { return { get(publicId: string) { return requestJson(context, `/api/orders/${publicId}`, orderResponseSchema); } }; }

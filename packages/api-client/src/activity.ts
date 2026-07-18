import { activityResponseSchema } from '@bidplace/contracts'; import { requestJson, type RequestContext } from './request';
export function createActivityClient(context: RequestContext) { return { get() { return requestJson(context, '/api/me/activity', activityResponseSchema); } }; }

import {
  publicHomeResponseSchema,
  type PublicHomeResponse,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createDiscoveryClient(context: RequestContext) {
  return {
    home(): Promise<PublicHomeResponse> {
      return requestJson(context, '/api/discovery/home', publicHomeResponseSchema);
    },
  };
}

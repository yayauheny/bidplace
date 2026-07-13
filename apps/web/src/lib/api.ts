import { createApiClient } from '@bidplace/api-client';

import { readAccessToken } from './auth-storage';

export function createWebApiClient(baseUrl: string) {
  return createApiClient({
    baseUrl,
    getAccessToken: readAccessToken,
  });
}

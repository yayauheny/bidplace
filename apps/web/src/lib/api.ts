import { createApiClient } from '@bidplace/api-client';

import { readAccessToken } from './auth-storage';
import { getPublicApiUrl } from './public-env';

export function createWebApiClient() {
  return createApiClient({
    baseUrl: getPublicApiUrl(),
    getAccessToken: readAccessToken,
  });
}

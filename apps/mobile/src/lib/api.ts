import { createApiClient } from '@bidplace/api-client';

import { getApiUrl } from './environment';

export function createMobileApiClient() {
  return createApiClient({
    baseUrl: getApiUrl(),
    credentials: 'include',
  });
}

import { createApiClient } from '@bidplace/api-client';

export function createWebApiClient(baseUrl: string) {
  return createApiClient({
    baseUrl,
    credentials: 'include',
  });
}

import { ApiClientError } from '@bidplace/api-client';

const nonRetryableKinds = new Set([
  'bad_request',
  'validation',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
]);

export function retryTransientPublicQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return false;
  }

  if (error instanceof ApiClientError && nonRetryableKinds.has(error.kind)) {
    return false;
  }

  return failureCount < 2;
}

import { ApiClientError } from '@bidplace/api-client';

export type PublicWorkPageState = 'loading' | 'not_found' | 'error' | 'ready';

export function isPublicWorkMissing(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.kind === 'not_found' || error.status === 404)
  );
}

export function resolvePublicWorkPageState(query: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: unknown;
}): PublicWorkPageState {
  if (query.isLoading) {
    return 'loading';
  }

  if (query.isError && isPublicWorkMissing(query.error)) {
    return 'not_found';
  }

  if (query.isError || !query.data) {
    return 'error';
  }

  return 'ready';
}

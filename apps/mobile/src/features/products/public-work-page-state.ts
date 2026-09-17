import { ApiClientError } from '@bidplace/api-client';

import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';

export type PublicWorkPageState = 'loading' | 'not_found' | 'error' | 'ready';

export function isPublicWorkMissing(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.kind === 'not_found' || error.status === 404)
  );
}

export function resolvePublicWorkPageState(query: {
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  data: unknown;
}): PublicWorkPageState {
  const fetchStatus = infrastructurePageFetchStatus(query);
  if (fetchStatus === 'loading') {
    return 'loading';
  }

  if (query.isError && isPublicWorkMissing(query.error)) {
    return 'not_found';
  }

  if (fetchStatus === 'error' || !query.data) {
    return 'error';
  }

  return 'ready';
}

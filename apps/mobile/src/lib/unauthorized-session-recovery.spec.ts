import { QueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import { authKeys } from './query-cache';
import { createUnauthorizedSessionRecovery } from './unauthorized-session-recovery';

function apiError(kind: 'unauthorized' | 'forbidden' | 'network') {
  return new ApiClientError(kind, {
    kind,
    status: kind === 'unauthorized' ? 401 : kind === 'forbidden' ? 403 : 0,
    code: kind === 'unauthorized' ? ApiErrorCode.UNAUTHORIZED : null,
  });
}

function createClientWithProtectedData() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(authKeys.session, { id: 'user-1' });
  queryClient.setQueryData(['seller', 'products'], [{ id: 'product-1' }]);
  queryClient.setQueryData(['admin', 'users'], [{ id: 'user-1' }]);
  queryClient.setQueryData(['products', 'list'], { page: 1 });
  return queryClient;
}

describe('unauthorized session recovery', () => {
  it('converges concurrent unauthorized query and mutation failures to one anonymous state', async () => {
    const queryClient = createClientWithProtectedData();
    const recover = createUnauthorizedSessionRecovery(queryClient);
    const unauthorized = apiError('unauthorized');

    const queryRecovery = recover(unauthorized);
    const mutationRecovery = recover(unauthorized);

    expect(queryRecovery).toBe(mutationRecovery);
    await queryRecovery;

    expect(queryClient.getQueryData(authKeys.session)).toBeNull();
    expect(queryClient.getQueryData(['seller', 'products'])).toBeUndefined();
    expect(queryClient.getQueryData(['admin', 'users'])).toBeUndefined();
    expect(queryClient.getQueryData(['products', 'list'])).toEqual({ page: 1 });
  });

  it.each(['forbidden', 'network'] as const)(
    'does not clear an authenticated session for %s',
    async (kind) => {
      const queryClient = createClientWithProtectedData();
      const recover = createUnauthorizedSessionRecovery(queryClient);

      expect(recover(apiError(kind))).toBeNull();
      expect(queryClient.getQueryData(authKeys.session)).toEqual({
        id: 'user-1',
      });
      expect(queryClient.getQueryData(['seller', 'products'])).toEqual([
        { id: 'product-1' },
      ]);
    },
  );
});

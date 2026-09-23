import { ApiClientError } from '@bidplace/api-client';
import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it, vi } from 'vitest';
import { QueryObserver } from '@tanstack/react-query';

import { authKeys } from './query-cache';
import { createAppQueryClient } from './query-client';

const unauthorized = new ApiClientError('Unauthorized', {
  kind: 'unauthorized',
  status: 401,
  code: ApiErrorCode.UNAUTHORIZED,
});

function seedAuthenticatedState() {
  const queryClient = createAppQueryClient();
  queryClient.setQueryData(authKeys.session, { id: 'user-1' });
  queryClient.setQueryData(['seller', 'products'], [{ id: 'product-1' }]);
  return queryClient;
}

describe('application query client session recovery', () => {
  it('recovers the session after an unauthorized query without retrying it', async () => {
    const queryClient = seedAuthenticatedState();
    let attempts = 0;

    await expect(
      queryClient.fetchQuery({
        queryKey: ['seller', 'products'],
        queryFn: async () => {
          attempts += 1;
          throw unauthorized;
        },
      }),
    ).rejects.toBe(unauthorized);

    expect(attempts).toBe(1);
    await vi.waitFor(() => {
      expect(queryClient.getQueryData(authKeys.session)).toBeNull();
    });
    expect(queryClient.getQueryData(authKeys.session)).toBeNull();
  });

  it('recovers the session after an unauthorized mutation', async () => {
    const queryClient = seedAuthenticatedState();
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: async () => {
        throw unauthorized;
      },
    });

    await expect(mutation.execute(undefined)).rejects.toBe(unauthorized);

    expect(queryClient.getQueryData(authKeys.session)).toBeNull();
  });

  it('keeps the active session observer through unauthorized recovery', async () => {
    const queryClient = seedAuthenticatedState();
    let meRequests = 0;
    const observer = new QueryObserver(queryClient, {
      queryKey: authKeys.session,
      enabled: false,
      queryFn: async () => {
        meRequests += 1;
        throw unauthorized;
      },
    });
    const sessionQuery = queryClient
      .getQueryCache()
      .find({ queryKey: authKeys.session, exact: true });
    const states: Array<unknown> = [];
    const unsubscribe = observer.subscribe((result) => {
      states.push(result.data);
    });

    await expect(observer.refetch({ throwOnError: true })).rejects.toBe(
      unauthorized,
    );
    await vi.waitFor(() => {
      expect(observer.getCurrentResult().data).toBeNull();
    });

    expect(
      queryClient.getQueryCache().find({
        queryKey: authKeys.session,
        exact: true,
      }),
    ).toBe(sessionQuery);
    expect(observer.getCurrentResult().data).toBeNull();
    expect(states).toContain(null);
    expect(meRequests).toBe(1);

    queryClient.setQueryData(authKeys.session, { id: 'logged-in-user' });
    expect(observer.getCurrentResult().data).toEqual({ id: 'logged-in-user' });
    expect(meRequests).toBe(1);
    unsubscribe();
  });
});

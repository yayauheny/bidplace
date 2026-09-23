import { ApiClientError } from '@bidplace/api-client';
import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

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
});

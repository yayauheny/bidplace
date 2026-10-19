import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';
import type { SellerProfileResponse } from '@bidplace/contracts';

import { authKeys } from '../../lib/query-cache';
import {
  fetchSellerProfile,
  sellerProfileGcMs,
  sellerProfileQueryKey,
  sellerProfileStaleMs,
} from './seller-profile-data';

function clientWithSession() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, { id: 'user-a' });
  return queryClient;
}

function queryOptions(
  api: { getMyProfile(): Promise<SellerProfileResponse> },
  queryClient: QueryClient,
) {
  return {
    queryKey: sellerProfileQueryKey,
    queryFn: () => fetchSellerProfile(api, queryClient),
    retry: false,
    staleTime: sellerProfileStaleMs,
    gcTime: sellerProfileGcMs,
  } as const;
}

const profileResponse = {
  sellerProfile: { id: 'profile-1' },
  editingRevision: null,
} as unknown as SellerProfileResponse;

describe('fetchSellerProfile', () => {
  it('uses one staleTime/gcTime pair for every consumer of the key', () => {
    expect(sellerProfileStaleMs).toBe(60_000);
    expect(sellerProfileGcMs).toBe(5 * 60_000);
  });

  it('caches a successful response once within staleTime', async () => {
    const queryClient = clientWithSession();
    const api = { getMyProfile: vi.fn().mockResolvedValue(profileResponse) };

    await queryClient.fetchQuery(queryOptions(api, queryClient));
    await queryClient.fetchQuery(queryOptions(api, queryClient));

    expect(api.getMyProfile).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(sellerProfileQueryKey)).toEqual(
      profileResponse,
    );
  });

  it('caches known absence as null and does not refetch within staleTime', async () => {
    const queryClient = clientWithSession();
    const api = {
      getMyProfile: vi.fn().mockRejectedValue(
        new ApiClientError('not found', { kind: 'not_found', status: 404 }),
      ),
    };

    await queryClient.fetchQuery(queryOptions(api, queryClient));
    await queryClient.fetchQuery(queryOptions(api, queryClient));

    expect(api.getMyProfile).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(sellerProfileQueryKey)).toBeNull();
  });

  it.each([
    new ApiClientError('unauthorized', {
      kind: 'unauthorized',
      status: 401,
    }),
    new ApiClientError('network down', { kind: 'network', status: 0 }),
  ])('never converts %s into cached absence', async (error) => {
    const queryClient = clientWithSession();
    const api = { getMyProfile: vi.fn().mockRejectedValue(error) };

    await expect(
      queryClient.fetchQuery(queryOptions(api, queryClient)),
    ).rejects.toBe(error);
    expect(queryClient.getQueryData(sellerProfileQueryKey)).toBeUndefined();

    await expect(
      queryClient.fetchQuery(queryOptions(api, queryClient)),
    ).rejects.toBe(error);
    expect(api.getMyProfile).toHaveBeenCalledTimes(2);
  });

  it('keeps not_found semantics when the cache refuses the absence write', async () => {
    const queryClient = clientWithSession();
    // Session switched (or ended) while the request was in flight.
    queryClient.setQueryData(authKeys.session, null);
    const api = {
      getMyProfile: vi.fn().mockRejectedValue(
        new ApiClientError('missing', { kind: 'not_found', status: 404 }),
      ),
    };

    await expect(
      queryClient.fetchQuery(queryOptions(api, queryClient)),
    ).rejects.toMatchObject({ kind: 'not_found' });
    expect(queryClient.getQueryData(sellerProfileQueryKey)).toBeUndefined();
  });

  it('never writes a profile payload after the session closed the cache', async () => {
    const queryClient = clientWithSession();
    queryClient.setQueryData(authKeys.session, null);
    const api = { getMyProfile: vi.fn().mockResolvedValue(profileResponse) };

    await expect(
      queryClient.fetchQuery(queryOptions(api, queryClient)),
    ).rejects.toThrow('Private cache is closed');
    expect(queryClient.getQueryData(sellerProfileQueryKey)).toBeUndefined();
  });
});

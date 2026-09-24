import { useQuery } from '@tanstack/react-query';

import { ApiClientError, type ApiClient } from '@bidplace/api-client';

import { useApiClient } from '../providers/api-provider';
import { useAuth } from '../providers/auth-provider';

type SellerProfile = Awaited<
  ReturnType<ApiClient['sellers']['getMyProfile']>
>['sellerProfile'];

export function isAuthorCabinetAvailable(
  status: SellerProfile['status'] | null,
) {
  return status === 'APPROVED' || status === 'SUSPENDED';
}

export function authorProfileDestination(
  status: SellerProfile['status'] | null,
): '/cabinet' | '/profile' | '/profile?intro=1' {
  if (status === null) return '/profile?intro=1';
  return isAuthorCabinetAvailable(status) ? '/cabinet' : '/profile';
}

export function useSellerCapability() {
  const api = useApiClient();
  const auth = useAuth();
  const query = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => api.sellers.getMyProfile(),
    enabled: auth.isAuthenticated && !auth.isAdmin,
    retry: false,
  });
  const profile: SellerProfile | null = query.data?.sellerProfile ?? null;
  const absent =
    query.isError &&
    query.error instanceof ApiClientError &&
    query.error.kind === 'not_found';

  return {
    profile,
    status: profile?.status ?? null,
    isLoading: query.isLoading,
    isError: query.isError && !absent,
    isAbsent: absent || (!query.isLoading && !query.data && !query.isError),
  };
}

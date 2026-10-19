import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from '@bidplace/api-client';

import {
  classifySellerProfileQuery,
  fetchSellerProfile,
  sellerProfileGcMs,
  sellerProfileQueryKey,
  sellerProfileStaleMs,
} from '../features/sellers/seller-profile-data';
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
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: sellerProfileQueryKey,
    queryFn: () => fetchSellerProfile(api.sellers, queryClient),
    enabled: auth.isAuthenticated && !auth.isAdmin,
    retry: false,
    staleTime: sellerProfileStaleMs,
    gcTime: sellerProfileGcMs,
  });
  const profile: SellerProfile | null = query.data?.sellerProfile ?? null;
  const { absent, isError } = classifySellerProfileQuery(query);

  return {
    profile,
    status: profile?.status ?? null,
    isLoading: query.isLoading,
    isError,
    isAbsent: absent || (!query.isLoading && !query.data && !query.isError),
  };
}

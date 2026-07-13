import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PaginationQuery } from '@bidplace/contracts';

import { useApiClient } from '../../providers/api-provider';

export const adminKeys = {
  users: (query?: PaginationQuery) => ['admin', 'users', query ?? {}] as const,
  auctions: (query?: PaginationQuery) => ['admin', 'auctions', query ?? {}] as const,
};

export function useAdminUsersQuery(query?: PaginationQuery, enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => api.admin.listUsers(query),
    enabled,
  });
}

export function useAdminAuctionsQuery(query?: PaginationQuery, enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: adminKeys.auctions(query),
    queryFn: () => api.admin.listAuctions(query),
    enabled,
  });
}

export function useBanUserMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.admin.banUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useHideAuctionMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auctionId: string) => api.admin.hideAuction(auctionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] });
    },
  });
}

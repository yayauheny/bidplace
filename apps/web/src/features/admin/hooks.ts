import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../providers/api-provider';

import type { PaginationQuery } from '@bidplace/contracts';

export const adminKeys = {
  users: (query?: PaginationQuery) => ['admin', 'users', query ?? {}] as const,
  auctions: (query?: PaginationQuery) => ['admin', 'auctions', query ?? {}] as const,
  auctionBids: (auctionId: string, query?: PaginationQuery) =>
    ['admin', 'auction-bids', auctionId, query ?? {}] as const,
};

export function useAdminUsersQuery(query?: PaginationQuery) {
  const api = useApiClient();

  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => api.admin.listUsers(query),
  });
}

export function useAdminAuctionsQuery(query?: PaginationQuery) {
  const api = useApiClient();

  return useQuery({
    queryKey: adminKeys.auctions(query),
    queryFn: () => api.admin.listAuctions(query),
  });
}

export function useAdminAuctionBidsQuery(auctionId: string, query?: PaginationQuery) {
  const api = useApiClient();

  return useQuery({
    queryKey: adminKeys.auctionBids(auctionId, query),
    queryFn: () => api.admin.listAuctionBids(auctionId, query),
    enabled: Boolean(auctionId),
  });
}

export function useBanUserMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.admin.banUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useHideAuctionMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auctionId: string) => api.admin.hideAuction(auctionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BidCreateRequest, PaginationQuery } from '@bidplace/contracts';
import { ApiClientError } from '@bidplace/api-client';

import { useApiClient } from '../../providers/api-provider';

export const auctionKeys = {
  all: ['auctions'] as const,
  list: (query?: PaginationQuery) => ['auctions', 'list', query ?? {}] as const,
  detail: (slug: string) => ['auctions', 'detail', slug] as const,
  seller: (slug: string) => ['sellers', 'public', slug] as const,
};

export function usePublicAuctionsQuery(query?: PaginationQuery) {
  const api = useApiClient();

  return useQuery({
    queryKey: auctionKeys.list(query),
    queryFn: () => api.auctions.list(query),
  });
}

export function usePublicAuctionQuery(slug: string, query?: PaginationQuery) {
  const api = useApiClient();

  return useQuery({
    queryKey: auctionKeys.detail(slug),
    queryFn: () => api.auctions.getPublic(slug, query),
    enabled: Boolean(slug),
  });
}

export function useSellerPublicProfileQuery(slug: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: auctionKeys.seller(slug),
    queryFn: () => api.sellers.getPublic(slug),
    enabled: Boolean(slug),
  });
}

export function usePlaceBidMutation(auctionId: string, slug: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const invalidateAuction = async () => {
    await queryClient.invalidateQueries({
      queryKey: auctionKeys.detail(slug),
    });
    await queryClient.invalidateQueries({
      queryKey: auctionKeys.all,
    });
  };

  return useMutation({
    mutationFn: (input: BidCreateRequest) =>
      api.auctions.placeBid(auctionId, input),
    onSuccess: invalidateAuction,
    onError: async (error) => {
      if (error instanceof ApiClientError && error.status === 409) {
        await invalidateAuction();
      }
    },
  });
}

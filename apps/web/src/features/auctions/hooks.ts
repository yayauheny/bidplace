import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  AuctionCreateRequest,
  BidCreateRequest,
  PaginationQuery,
} from '@bidplace/contracts';

import { useApiClient } from '../../providers/api-provider';

export const auctionKeys = {
  all: ['auctions'] as const,
  list: (query?: PaginationQuery) => ['auctions', 'list', query ?? {}] as const,
  detail: (slug: string) => ['auctions', 'detail', slug] as const,
  sellerBids: (auctionId: string) =>
    ['auctions', 'seller-bids', auctionId] as const,
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

export function usePlaceBidMutation(auctionId: string, slug: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BidCreateRequest) =>
      api.auctions.placeBid(auctionId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: auctionKeys.detail(slug),
      });
      await queryClient.invalidateQueries({
        queryKey: auctionKeys.all,
      });
    },
  });
}

export function useCreateAuctionMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AuctionCreateRequest) => api.auctions.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: auctionKeys.all,
      });
    },
  });
}

export function usePublishAuctionMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auctionId: string) => api.auctions.publish(auctionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: auctionKeys.all,
      });
    },
  });
}

export function useSellerPublicProfileQuery(slug: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['seller-profile', slug] as const,
    queryFn: () => api.sellers.getPublic(slug),
    enabled: Boolean(slug),
  });
}

export function useSellerAuctionBidsQuery(auctionId: string, query?: PaginationQuery) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['seller-bids', auctionId, query ?? {}] as const,
    queryFn: () => api.sellers.listAuctionBids(auctionId, query),
    enabled: Boolean(auctionId),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AuctionCreateRequest,
  LotCreateRequest,
  PaginationQuery,
  SellerProfileCreateRequest,
  SellerProfileUpdateRequest,
} from '@bidplace/contracts';

import { useApiClient } from '../../providers/api-provider';
import { catalogueKeys } from '../../lib/query-cache';

export const sellerKeys = {
  profile: ['seller', 'profile'] as const,
  categories: ['seller', 'categories'] as const,
  lots: (query?: PaginationQuery) => ['seller', 'lots', query ?? {}] as const,
  auctions: (query?: PaginationQuery) => ['seller', 'auctions', query ?? {}] as const,
};

export function useMySellerProfileQuery(enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: sellerKeys.profile,
    queryFn: () => api.sellers.getMyProfile(),
    enabled,
  });
}

export function useSellerCategoriesQuery(enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: catalogueKeys.categories,
    queryFn: () => api.categories.list(),
    enabled,
  });
}

export function useMySellerLotsQuery(query?: PaginationQuery, enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: sellerKeys.lots(query),
    queryFn: () => api.sellers.listLots(query),
    enabled,
  });
}

export function useMySellerAuctionsQuery(query?: PaginationQuery, enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: sellerKeys.auctions(query),
    queryFn: () => api.sellers.listAuctions(query),
    enabled,
  });
}

export function useCreateSellerProfileMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SellerProfileCreateRequest) =>
      api.sellers.createProfile(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.profile });
    },
  });
}

export function useUpdateSellerProfileMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SellerProfileUpdateRequest) =>
      api.sellers.updateProfile(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.profile });
    },
  });
}

export function useCreateLotMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      images,
    }: {
      input: LotCreateRequest;
      images: Array<Blob | File>;
    }) => api.lots.create(input, images),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.lots() });
      await queryClient.invalidateQueries({ queryKey: sellerKeys.auctions() });
    },
  });
}

export function useCreateAuctionMutation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AuctionCreateRequest) => api.auctions.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerKeys.auctions() });
      await queryClient.invalidateQueries({ queryKey: sellerKeys.lots() });
    },
  });
}

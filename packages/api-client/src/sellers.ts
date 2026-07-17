import {
  bidHistoryResponseSchema,
  paginationQuerySchema,
  publicSellerDetailResponseSchema,
  sellerAuctionListResponseSchema,
  sellerLotListResponseSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileResponseSchema,
  sellerProfileUpdateRequestSchema,
  type PaginationQuery,
  type SellerProfileCreateRequest,
  type SellerProfileUpdateRequest,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createSellersClient(context: RequestContext) {
  return {
    getMyProfile() {
      return requestJson(
        context,
        '/api/seller/profile',
        sellerProfileResponseSchema,
      );
    },
    getPublic(slug: string) {
      return requestJson(
        context,
        `/api/sellers/${slug}`,
        sellerProfileResponseSchema,
      );
    },
    getPublicDetail(slug: string) {
      return requestJson(
        context,
        `/api/sellers/${slug}/detail`,
        publicSellerDetailResponseSchema,
      );
    },
    createProfile(input: SellerProfileCreateRequest) {
      return requestJson(
        context,
        '/api/seller/profile',
        sellerProfileResponseSchema,
        {
          method: 'POST',
          body: sellerProfileCreateRequestSchema.parse(input),
        },
      );
    },
    updateProfile(input: SellerProfileUpdateRequest) {
      return requestJson(
        context,
        '/api/seller/profile',
        sellerProfileResponseSchema,
        {
          method: 'PATCH',
          body: sellerProfileUpdateRequestSchema.parse(input),
        },
      );
    },
    listLots(query?: PaginationQuery) {
      return requestJson(
        context,
        '/api/seller/lots',
        sellerLotListResponseSchema,
        {
          query: paginationQuerySchema.parse(query ?? {}),
        },
      );
    },
    listAuctions(query?: PaginationQuery) {
      return requestJson(
        context,
        '/api/seller/auctions',
        sellerAuctionListResponseSchema,
        {
          query: paginationQuerySchema.parse(query ?? {}),
        },
      );
    },
    listAuctionBids(auctionId: string, query?: PaginationQuery) {
      return requestJson(
        context,
        `/api/seller/auctions/${auctionId}/bids`,
        bidHistoryResponseSchema,
        {
          query: paginationQuerySchema.parse(query ?? {}),
        },
      );
    },
  };
}

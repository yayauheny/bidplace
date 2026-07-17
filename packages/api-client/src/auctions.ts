import {
  auctionCreateRequestSchema,
  auctionListResponseSchema,
  auctionPublishRequestSchema,
  auctionResponseSchema,
  bidCreateRequestSchema,
  bidPlacementResponseSchema,
  paginationQuerySchema,
  publicAuctionDetailResponseSchema,
  type AuctionCreateRequest,
  type BidCreateRequest,
  type PaginationQuery,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createAuctionsClient(context: RequestContext) {
  return {
    list(query?: PaginationQuery) {
      return requestJson(context, '/api/auctions', auctionListResponseSchema, {
        query: paginationQuerySchema.parse(query ?? {}),
      });
    },
    getPublic(slug: string, query?: PaginationQuery) {
      return requestJson(
        context,
        `/api/auctions/${slug}`,
        publicAuctionDetailResponseSchema,
        {
          query: paginationQuerySchema.parse(query ?? {}),
        },
      );
    },
    placeBid(auctionId: string, input: BidCreateRequest) {
      return requestJson(
        context,
        `/api/auctions/${auctionId}/bids`,
        bidPlacementResponseSchema,
        {
          method: 'POST',
          body: bidCreateRequestSchema.parse(input),
        },
      );
    },
    create(input: AuctionCreateRequest) {
      return requestJson(
        context,
        '/api/seller/auctions',
        auctionResponseSchema,
        {
          method: 'POST',
          body: auctionCreateRequestSchema.parse(input),
        },
      );
    },
    publish(auctionId: string) {
      return requestJson(
        context,
        `/api/seller/auctions/${auctionId}/publish`,
        auctionResponseSchema,
        {
          method: 'POST',
          body: auctionPublishRequestSchema.parse({}),
        },
      );
    },
  };
}

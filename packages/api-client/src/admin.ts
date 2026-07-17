import {
  adminAuctionResponseSchema,
  adminAuctionsResponseSchema,
  adminUserResponseSchema,
  adminUsersResponseSchema,
  bidHistoryResponseSchema,
  paginationQuerySchema,
  type PaginationQuery,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createAdminClient(context: RequestContext) {
  return {
    listUsers(query?: PaginationQuery) {
      return requestJson(
        context,
        '/api/admin/users',
        adminUsersResponseSchema,
        {
          query: paginationQuerySchema.parse(query ?? {}),
        },
      );
    },
    banUser(userId: string) {
      return requestJson(
        context,
        `/api/admin/users/${userId}/ban`,
        adminUserResponseSchema,
        {
          method: 'POST',
        },
      );
    },
    listAuctions(query?: PaginationQuery) {
      return requestJson(
        context,
        '/api/admin/auctions',
        adminAuctionsResponseSchema,
        {
          query: paginationQuerySchema.parse(query ?? {}),
        },
      );
    },
    hideAuction(auctionId: string) {
      return requestJson(
        context,
        `/api/admin/auctions/${auctionId}/hide`,
        adminAuctionResponseSchema,
        {
          method: 'POST',
        },
      );
    },
    listAuctionBids(auctionId: string, query?: PaginationQuery) {
      return requestJson(
        context,
        `/api/admin/auctions/${auctionId}/bids`,
        bidHistoryResponseSchema,
        {
          query: paginationQuerySchema.parse(query ?? {}),
        },
      );
    },
  };
}

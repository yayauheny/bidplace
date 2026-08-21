import {
  adminAnalyticsOverviewSchema,
  adminAnalyticsQuerySchema,
  adminCreateListingOrderResponseSchema,
  adminEmergencyCancelRequestSchema,
  adminListingsNeedingOrderResponseSchema,
  adminOkResponseSchema,
  adminOrderCancellationRequestSchema,
  adminOrderResponseSchema,
  adminOrderReplacementRequestSchema,
  adminProductStatusUpdateRequestSchema,
  adminRankedBidsResponseSchema,
  adminSellerStatusResponseSchema,
  adminSellerProfilesResponseSchema,
  adminProductsResponseSchema,
  adminSellerStatusUpdateRequestSchema,
  adminUserRevokeSessionsRequestSchema,
  adminUserStatusResponseSchema,
  adminUserStatusUpdateRequestSchema,
  adminUsersLookupQuerySchema,
  adminUsersLookupResponseSchema,
  productResponseSchema,
  type AdminAnalyticsQuery,
  type AdminEmergencyCancelRequest,
  type AdminOrderCancellationRequest,
  type AdminOrderReplacementRequest,
  type AdminProductStatusUpdateRequest,
  type AdminSellerStatusUpdateRequest,
  type AdminUserRevokeSessionsRequest,
  type AdminUserStatusUpdateRequest,
  type AdminUsersLookupQuery,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createAdminClient(context: RequestContext) {
  return {
    listSellerProfiles() {
      return requestJson(
        context,
        '/api/admin/seller-profiles',
        adminSellerProfilesResponseSchema,
      );
    },
    listProducts() {
      return requestJson(
        context,
        '/api/admin/products',
        adminProductsResponseSchema,
      );
    },
    getAnalyticsOverview(query: AdminAnalyticsQuery = { period: '7d' }) {
      const parsed = adminAnalyticsQuerySchema.parse(query);

      return requestJson(
        context,
        '/api/admin/analytics/overview',
        adminAnalyticsOverviewSchema,
        {
          query: {
            period: parsed.period,
            from: parsed.from,
            to: parsed.to,
            drilldown: parsed.drilldown,
          },
        },
      );
    },
    updateSellerStatus(id: string, input: AdminSellerStatusUpdateRequest) {
      return requestJson(
        context,
        `/api/admin/seller-profiles/${id}/status`,
        adminSellerStatusResponseSchema,
        {
          method: 'PATCH',
          body: adminSellerStatusUpdateRequestSchema.parse(input),
        },
      );
    },
    updateProductStatus(id: string, input: AdminProductStatusUpdateRequest) {
      return requestJson(
        context,
        `/api/admin/products/${id}/status`,
        productResponseSchema,
        {
          method: 'PATCH',
          body: adminProductStatusUpdateRequestSchema.parse(input),
        },
      );
    },
    listRankedBids(listingId: string) {
      return requestJson(
        context,
        `/api/admin/listings/${listingId}/bids`,
        adminRankedBidsResponseSchema,
      );
    },
    listListingsNeedingOrder() {
      return requestJson(
        context,
        '/api/admin/listings/needs-order',
        adminListingsNeedingOrderResponseSchema,
      );
    },
    lookupUsers(query: AdminUsersLookupQuery) {
      const parsed = adminUsersLookupQuerySchema.parse(query);

      return requestJson(
        context,
        '/api/admin/users',
        adminUsersLookupResponseSchema,
        { query: { email: parsed.email } },
      );
    },
    updateUserStatus(id: string, input: AdminUserStatusUpdateRequest) {
      return requestJson(
        context,
        `/api/admin/users/${id}/status`,
        adminUserStatusResponseSchema,
        {
          method: 'PATCH',
          body: adminUserStatusUpdateRequestSchema.parse(input),
        },
      );
    },
    revokeUserSessions(id: string, input: AdminUserRevokeSessionsRequest) {
      return requestJson(
        context,
        `/api/admin/users/${id}/revoke-sessions`,
        adminUserStatusResponseSchema,
        {
          method: 'POST',
          body: adminUserRevokeSessionsRequestSchema.parse(input),
        },
      );
    },
    emergencyCancelListing(
      listingId: string,
      input: AdminEmergencyCancelRequest,
    ) {
      return requestJson(
        context,
        `/api/admin/listings/${listingId}/emergency-cancel`,
        adminOkResponseSchema,
        {
          method: 'POST',
          body: adminEmergencyCancelRequestSchema.parse(input),
        },
      );
    },
    createOrderForEndedListing(listingId: string) {
      return requestJson(
        context,
        `/api/admin/listings/${listingId}/create-order`,
        adminCreateListingOrderResponseSchema,
        { method: 'POST' },
      );
    },
    cancelOrder(publicId: string, input: AdminOrderCancellationRequest) {
      return requestJson(
        context,
        `/api/admin/orders/${publicId}/cancel`,
        adminOrderResponseSchema,
        {
          method: 'POST',
          body: adminOrderCancellationRequestSchema.parse(input),
        },
      );
    },
    replaceOrder(publicId: string, input: AdminOrderReplacementRequest) {
      return requestJson(
        context,
        `/api/admin/orders/${publicId}/replacement`,
        adminOrderResponseSchema,
        {
          method: 'POST',
          body: adminOrderReplacementRequestSchema.parse(input),
        },
      );
    },
  };
}

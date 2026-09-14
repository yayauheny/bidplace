import {
  adminAnalyticsOverviewSchema,
  adminAnalyticsQuerySchema,
  adminCuratorSelectionRequestSchema,
  adminCuratorSelectionResponseSchema,
  adminOkResponseSchema,
  adminProductStatusUpdateRequestSchema,
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
    setCuratorSelection(publicId: string, note: string | null) {
      return requestJson(
        context,
        '/api/admin/curator-selection',
        adminCuratorSelectionResponseSchema,
        {
          method: 'PUT',
          body: adminCuratorSelectionRequestSchema.parse({ publicId, note }),
        },
      );
    },
    clearCuratorSelection() {
      return requestJson(
        context,
        '/api/admin/curator-selection',
        adminOkResponseSchema,
        { method: 'DELETE' },
      );
    },
  };
}

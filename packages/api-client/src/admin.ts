import { z } from 'zod';

import {
  type AnalyticsFoundationQuery,
  analyticsFoundationQuerySchema,
  analyticsFoundationResponseSchema,
  adminAnalyticsOverviewSchema,
  adminQueueQuerySchema,
  adminHistoryQuerySchema,
  adminHistoryResponseSchema,
  adminModerationSummariesSchema,
  adminSellerDetailSchema,
  adminProductDetailSchema,
  type AdminQueueQuery,
  catalogTermSchema,
  catalogTermWriteSchema,
  catalogCategoryWriteSchema,
  catalogProposalMapSchema,
  catalogProposalRejectSchema,
  categorySchema,
  adminAnalyticsQuerySchema,
  adminCuratorSelectionRequestSchema,
  adminCuratorSelectionResponseSchema,
  adminOkResponseSchema,
  adminProductStatusUpdateRequestSchema,
  adminSellerStatusResponseSchema,
  adminSellerProfilesResponseSchema,
  adminProductsResponseSchema,
  adminModerationListQuerySchema,
  adminSellerStatusUpdateRequestSchema,
  adminUserRevokeSessionsRequestSchema,
  adminUserStatusResponseSchema,
  adminUserStatusUpdateRequestSchema,
  adminUsersLookupQuerySchema,
  adminUsersLookupResponseSchema,
  productResponseSchema,
  type AdminAnalyticsQuery,
  type AdminModerationListQueryInput,
  type AdminProductStatusUpdateRequest,
  type AdminSellerStatusUpdateRequest,
  type AdminUserRevokeSessionsRequest,
  type AdminUserStatusUpdateRequest,
  type AdminUsersLookupQuery,
} from '@bidplace/contracts';

import {
  requestBlob,
  requestJson,
  signalRequestOptions,
  type ReadCallOptions,
  type RequestContext,
} from './request';
import { parseRequest } from './errors/parse-request';

function moderationListQuery(query: AdminModerationListQueryInput) {
  const parsed = adminModerationListQuerySchema.parse(query);
  return {
    limit: parsed.limit,
    filter: parsed.filter,
    search: parsed.search,
    cursor: parsed.cursor,
  };
}

export function createAdminClient(context: RequestContext) {
  return {
    listSellerSummaries(
      query: Partial<AdminQueueQuery> = {},
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        '/api/admin/seller-profiles/summary',
        adminModerationSummariesSchema,
        {
          query: adminQueueQuerySchema.parse(query),
          ...signalRequestOptions(options),
        },
      );
    },
    listProductSummaries(
      query: Partial<AdminQueueQuery> = {},
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        '/api/admin/products/summary',
        adminModerationSummariesSchema,
        {
          query: adminQueueQuerySchema.parse(query),
          ...signalRequestOptions(options),
        },
      );
    },
    getSellerDetail(id: string, options?: ReadCallOptions) {
      return requestJson(
        context,
        `/api/admin/seller-profiles/${id}`,
        adminSellerDetailSchema,
        signalRequestOptions(options),
      );
    },
    getProductDetail(id: string, options?: ReadCallOptions) {
      return requestJson(
        context,
        `/api/admin/products/${id}`,
        adminProductDetailSchema,
        signalRequestOptions(options),
      );
    },
    getSellerHistory(
      id: string,
      query: { limit?: number; cursor?: string } = {},
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        `/api/admin/seller-profiles/${id}/history`,
        adminHistoryResponseSchema,
        {
          query: adminHistoryQuerySchema.parse(query),
          ...signalRequestOptions(options),
        },
      );
    },
    getProductHistory(
      id: string,
      query: { limit?: number; cursor?: string } = {},
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        `/api/admin/products/${id}/history`,
        adminHistoryResponseSchema,
        {
          query: adminHistoryQuerySchema.parse(query),
          ...signalRequestOptions(options),
        },
      );
    },
    listSellerProfiles(
      query: AdminModerationListQueryInput = {},
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        '/api/admin/seller-profiles',
        adminSellerProfilesResponseSchema,
        {
          query: moderationListQuery(query),
          ...signalRequestOptions(options),
        },
      );
    },
    listProducts(
      query: AdminModerationListQueryInput = {},
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        '/api/admin/products',
        adminProductsResponseSchema,
        {
          query: moderationListQuery(query),
          ...signalRequestOptions(options),
        },
      );
    },
    getSellerRevisionPhoto(
      profileId: string,
      revisionId: string,
      options?: ReadCallOptions,
    ) {
      return requestBlob(
        context,
        `/api/admin/seller-profiles/${profileId}/revisions/${revisionId}/photo`,
        signalRequestOptions(options),
      );
    },
    getAchievementImage(id: string, options?: ReadCallOptions) {
      return requestBlob(context, `/api/author-achievements/${id}/image`, signalRequestOptions(options));
    },
    getProductImage(imageId: string, options?: ReadCallOptions) {
      return requestBlob(
        context,
        `/api/images/${imageId}`,
        signalRequestOptions(options),
      );
    },
    getAnalyticsFoundation(
      query: AnalyticsFoundationQuery,
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        '/api/admin/analytics/foundation',
        analyticsFoundationResponseSchema,
        {
          query: analyticsFoundationQuerySchema.parse(query),
          ...signalRequestOptions(options),
        },
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
          body: parseRequest(adminSellerStatusUpdateRequestSchema, input),
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
          body: parseRequest(adminProductStatusUpdateRequestSchema, input),
        },
      );
    },
    lookupUsers(query: AdminUsersLookupQuery) {
      const parsed = parseRequest(adminUsersLookupQuerySchema, query);

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
          body: parseRequest(adminUserStatusUpdateRequestSchema, input),
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
          body: parseRequest(adminUserRevokeSessionsRequestSchema, input),
        },
      );
    },
    createCatalogTerm(input: { role: 'MATERIAL' | 'TECHNIQUE'; name: string }) {
      return requestJson(
        context,
        '/api/admin/catalog/terms',
        z.object({ term: catalogTermSchema }).strict(),
        {
          method: 'POST',
          body: parseRequest(catalogTermWriteSchema, input),
        },
      );
    },
    createCatalogCategory(name: string) {
      return requestJson(context, '/api/admin/categories', z.object({
        category: categorySchema,
      }).strict(), {
        method: 'POST',
        body: parseRequest(catalogCategoryWriteSchema, { name }),
      });
    },
    mapCatalogProposal(proposalId: string, input: { categoryId?: string; termId?: string }) {
      return requestJson(context, `/api/admin/catalog/proposals/${proposalId}/map`,
        adminOkResponseSchema, {
          method: 'POST',
          body: parseRequest(catalogProposalMapSchema, input),
        });
    },
    rejectCatalogProposal(proposalId: string, reason: string) {
      return requestJson(context, `/api/admin/catalog/proposals/${proposalId}/reject`,
        adminOkResponseSchema, {
          method: 'POST',
          body: parseRequest(catalogProposalRejectSchema, { reason }),
        });
    },
    setCuratorSelection(
      publicId: string,
      curatorSlug: string,
      note: string | null,
    ) {
      return requestJson(
        context,
        '/api/admin/curator-selection',
        adminCuratorSelectionResponseSchema,
        {
          method: 'PUT',
          body: adminCuratorSelectionRequestSchema.parse({
            publicId,
            curatorSlug,
            note,
          }),
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

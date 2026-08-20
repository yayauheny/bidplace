import {
  adminCreateListingOrderResponseSchema,
  adminListingsNeedingOrderResponseSchema,
  adminOrderCancellationRequestSchema,
  adminOrderResponseSchema,
  adminOrderReplacementRequestSchema,
  adminProductStatusUpdateRequestSchema,
  adminRankedBidsResponseSchema,
  adminSellerStatusResponseSchema,
  adminSellerProfilesResponseSchema,
  adminProductsResponseSchema,
  adminSellerStatusUpdateRequestSchema,
  productResponseSchema,
  type AdminOrderCancellationRequest,
  type AdminOrderReplacementRequest,
  type AdminProductStatusUpdateRequest,
  type AdminSellerStatusUpdateRequest,
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

import {
  publicSellerDetailResponseSchema,
  publicSellerListResponseSchema,
  sellerProductListResponseSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileResponseSchema,
  sellerProfileUpdateRequestSchema,
  publicSellerQuerySchema,
  publicSellerWorksQuerySchema,
  type PublicSellerQueryInput,
  type PublicSellerWorksQuery,
  type SellerProfileCreateRequest,
  type SellerProfileUpdateRequest,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createSellersClient(context: RequestContext) {
  return {
    listPublic(query?: PublicSellerQueryInput) {
      return requestJson(
        context,
        '/api/sellers',
        publicSellerListResponseSchema,
        { query: publicSellerQuerySchema.parse(query ?? {}) },
      );
    },
    getMyProfile() {
      return requestJson(
        context,
        '/api/seller/profile',
        sellerProfileResponseSchema,
      );
    },
    listProducts() {
      return requestJson(
        context,
        '/api/seller/products',
        sellerProductListResponseSchema,
      );
    },
    getPublicDetail(slug: string, query?: Partial<PublicSellerWorksQuery>) {
      return requestJson(
        context,
        `/api/sellers/${slug}/detail`,
        publicSellerDetailResponseSchema,
        { query: publicSellerWorksQuerySchema.parse(query ?? {}) },
      );
    },
    createProfile(input: SellerProfileCreateRequest, profilePhoto: Blob) {
      return requestJson(
        context,
        '/api/seller/profile',
        sellerProfileResponseSchema,
        {
          method: 'POST',
          body: {
            ...sellerProfileCreateRequestSchema.parse(input),
            profilePhoto,
          },
          asFormData: true,
        },
      );
    },
    updateProfile(input: SellerProfileUpdateRequest, profilePhoto?: Blob) {
      return requestJson(
        context,
        '/api/seller/profile',
        sellerProfileResponseSchema,
        {
          method: 'PATCH',
          body: {
            ...sellerProfileUpdateRequestSchema.parse(input),
            profilePhoto,
          },
          asFormData: true,
        },
      );
    },
  };
}

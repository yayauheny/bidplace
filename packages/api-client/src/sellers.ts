import {
  sellerProductListResponseSchema,
  sellerProductDetailResponseSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileResponseSchema,
  sellerProfileUpdateRequestSchema,
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
    listProducts() {
      return requestJson(
        context,
        '/api/seller/products',
        sellerProductListResponseSchema,
      );
    },
    getProduct(id: string) {
      return requestJson(
        context,
        `/api/seller/products/${id}`,
        sellerProductDetailResponseSchema,
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

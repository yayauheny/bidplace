import {
  sellerProductListResponseSchema,
  sellerProductDetailResponseSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileResponseSchema,
  sellerProfileUpdateRequestSchema,
  type SellerProfileCreateRequest,
  type SellerProfileUpdateRequest,
} from '@bidplace/contracts';

import { parseRequest } from './errors/parse-request';
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
            ...parseRequest(sellerProfileCreateRequestSchema, input),
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
            ...parseRequest(sellerProfileUpdateRequestSchema, input),
            profilePhoto,
          },
          asFormData: true,
        },
      );
    },
  };
}

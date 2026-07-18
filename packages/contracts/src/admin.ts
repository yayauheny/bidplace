import { z } from 'zod';

import { bidSchema } from './bid';
import {
  orderCancellationReasonSchema,
  productStatusSchema,
  sellerStatusSchema,
} from './enums';
import { orderResponseSchema } from './order';
import { uuidSchema } from './primitives';
import { sellerProfileResponseSchema } from './seller-profile';
import { sellerProfileSchema } from './seller-profile';
import { productSchema } from './product';

export const adminSellerStatusUpdateRequestSchema = z
  .object({ status: sellerStatusSchema.extract(['APPROVED', 'SUSPENDED']) })
  .strict();
export const adminProductStatusUpdateRequestSchema = z
  .object({ status: productStatusSchema.extract(['APPROVED', 'ARCHIVED']) })
  .strict();
export const adminOrderCancellationRequestSchema = z
  .object({ reason: orderCancellationReasonSchema })
  .strict();
export const adminOrderReplacementRequestSchema = z
  .object({ bidId: uuidSchema })
  .strict();
export const adminRankedBidsResponseSchema = z
  .object({ bids: z.array(bidSchema) })
  .strict();

export const adminSellerStatusResponseSchema = sellerProfileResponseSchema;
export const adminOrderResponseSchema = orderResponseSchema;
export const adminSellerProfilesResponseSchema = z.object({ sellerProfiles: z.array(sellerProfileSchema) }).strict();
export const adminProductsResponseSchema = z.object({ products: z.array(productSchema) }).strict();

export type AdminSellerStatusUpdateRequest = z.infer<
  typeof adminSellerStatusUpdateRequestSchema
>;
export type AdminProductStatusUpdateRequest = z.infer<
  typeof adminProductStatusUpdateRequestSchema
>;
export type AdminOrderCancellationRequest = z.infer<
  typeof adminOrderCancellationRequestSchema
>;
export type AdminOrderReplacementRequest = z.infer<
  typeof adminOrderReplacementRequestSchema
>;

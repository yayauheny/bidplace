import { z } from 'zod';

import { bidSchema } from './bid';
import {
  orderCancellationReasonSchema,
  productStatusSchema,
  sellerStatusSchema,
} from './enums';
import { uuidSchema } from './primitives';
import {
  sellerProfileResponseSchema,
  sellerProfileSchema,
} from './seller-profile';
import { creationStepSchema, productSchema } from './product';

const sellerModerationStatusSchema = sellerStatusSchema.extract([
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
  'SUSPENDED',
]);

const productModerationStatusSchema = productStatusSchema.extract([
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
  'ARCHIVED',
]);

export const adminSellerStatusUpdateRequestSchema = z
  .object({
    status: sellerModerationStatusSchema,
    reason: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      ['CHANGES_REQUESTED', 'REJECTED', 'SUSPENDED'].includes(value.status) &&
      !value.reason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'reason is required for this seller status',
      });
    }
  });

export const adminProductStatusUpdateRequestSchema = z
  .object({
    status: productModerationStatusSchema,
    reason: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      ['CHANGES_REQUESTED', 'REJECTED', 'ARCHIVED'].includes(value.status) &&
      !value.reason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'reason is required for this product status',
      });
    }
  });

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
export const adminSellerProfileSchema = sellerProfileSchema
  .extend({
    lastModerationReason: z.string().nullable(),
    hasBlockingListing: z.boolean(),
  })
  .strict();
export const adminSellerProfilesResponseSchema = z
  .object({ sellerProfiles: z.array(adminSellerProfileSchema) })
  .strict();
export const adminProductSchema = productSchema
  .extend({
    sellerProfile: z
      .object({
        slug: z.string().min(1),
        fullName: z.string().min(1),
        status: sellerStatusSchema,
      })
      .strict(),
    creationIntro: z.string().trim().min(1).nullable(),
    creationSteps: z.array(creationStepSchema),
    hasBlockingListing: z.boolean(),
    lastModerationReason: z.string().nullable(),
  })
  .strict();
export const adminProductsResponseSchema = z
  .object({ products: z.array(adminProductSchema) })
  .strict();

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

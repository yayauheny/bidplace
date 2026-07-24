import { z } from 'zod';

import {
  handoffContactTypeSchema,
  handoffInitiatorSchema,
  orderCancellationReasonSchema,
  orderStatusSchema,
} from './enums';
import { isoDateTimeSchema, moneyAmountSchema, uuidSchema } from './primitives';

export const orderSchema = z
  .object({
    id: uuidSchema,
    publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    listingId: uuidSchema,
    sellerId: uuidSchema,
    buyerId: uuidSchema,
    sourceBidId: uuidSchema,
    finalAmount: moneyAmountSchema,
    contactDueAt: isoDateTimeSchema,
    sellerHandoffType: handoffContactTypeSchema,
    sellerHandoffValue: z.string().trim().min(1),
    buyerEmailAtClose: z.string().email(),
    handoffInitiator: handoffInitiatorSchema,
    status: orderStatusSchema,
    cancellationReason: orderCancellationReasonSchema.nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

const orderResponseBaseSchema = z
  .object({
    order: orderSchema.pick({
      id: true,
      publicId: true,
      listingId: true,
      finalAmount: true,
      contactDueAt: true,
      status: true,
      cancellationReason: true,
      createdAt: true,
      updatedAt: true,
    }),
    productSummary: z
      .object({
        publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
        title: z.string().trim().min(1),
      })
      .strict(),
  })
  .strict();

export const buyerOrderResponseSchema = orderResponseBaseSchema
  .extend({
    sellerHandoffType: handoffContactTypeSchema.nullable(),
    sellerHandoffValue: z.string().trim().min(1).nullable(),
  })
  .strict();

export const sellerOrderResponseSchema = orderResponseBaseSchema
  .extend({
    buyerEmailAtClose: z.string().email(),
  })
  .strict();

export const adminOrderResponseSchema = orderResponseBaseSchema
  .extend({
    sellerHandoffType: handoffContactTypeSchema,
    sellerHandoffValue: z.string().trim().min(1),
    buyerEmailAtClose: z.string().email(),
    handoffInitiator: handoffInitiatorSchema,
  })
  .strict();

export const orderResponseSchema = z.union([
  buyerOrderResponseSchema,
  sellerOrderResponseSchema,
  adminOrderResponseSchema,
]);

export type Order = z.infer<typeof orderSchema>;
export type BuyerOrderResponse = z.infer<typeof buyerOrderResponseSchema>;
export type SellerOrderResponse = z.infer<typeof sellerOrderResponseSchema>;
export type AdminOrderResponse = z.infer<typeof adminOrderResponseSchema>;

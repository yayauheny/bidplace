import { z } from 'zod';
import { mediaDeliverySchema } from './media';

import { categorySchema } from './category';
import { productStatusSchema } from './enums';
import { isoDateTimeSchema, uuidSchema } from './primitives';
import { creationStepSchema, productSchema } from './product';

export const categoryListResponseSchema = z
  .object({
    categories: z.array(categorySchema),
  })
  .strict();

export const sellerProductListResponseSchema = z
  .object({
    products: z.array(productSchema),
  })
  .strict();

export const sellerProductDetailResponseSchema = z
  .object({
    product: productSchema,
    publication: mediaDeliverySchema.optional(),
    editingRevision: z
      .object({
        id: uuidSchema,
        version: z.number().int().positive(),
        status: productStatusSchema,
        updatedAt: isoDateTimeSchema,
      })
      .strict()
      .nullable(),
    creationIntro: z.string().trim().min(1).nullable(),
    creationSteps: z.array(creationStepSchema),
    lastModerationReason: z.string().nullable(),
  })
  .strict();

export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;
export type SellerProductListResponse = z.infer<
  typeof sellerProductListResponseSchema
>;
export type SellerProductDetailResponse = z.infer<
  typeof sellerProductDetailResponseSchema
>;

import { z } from 'zod';

import { categorySchema } from './category';
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

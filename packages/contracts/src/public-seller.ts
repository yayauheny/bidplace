import { z } from 'zod';

import { paginationMetaSchema } from './pagination';
import { publicProductListItemSchema } from './public-product';
import { publicSellerProfileSchema } from './seller-profile';

export const publicSellerListItemSchema = z
  .object({
    sellerProfile: publicSellerProfileSchema,
    workCount: z.number().int().nonnegative(),
  })
  .strict();

export const publicSellerListResponseSchema = z
  .object({
    sellers: z.array(publicSellerListItemSchema),
    pagination: paginationMetaSchema,
  })
  .strict();

export const publicSellerDetailResponseSchema = z
  .object({
    sellerProfile: publicSellerProfileSchema,
    products: z.array(publicProductListItemSchema),
  })
  .strict();

export type PublicSellerDetailResponse = z.infer<
  typeof publicSellerDetailResponseSchema
>;

export type PublicSellerListItem = z.infer<
  typeof publicSellerListItemSchema
>;

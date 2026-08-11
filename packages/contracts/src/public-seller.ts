import { z } from 'zod';

import { paginationMetaSchema, paginationQuerySchema } from './pagination';
import { publicProductListItemSchema } from './public-product';
import { publicSellerProfileSchema } from './seller-profile';

const publicSellerWorkStatusSchema = z.enum(['SCHEDULED', 'LIVE', 'ENDED']);
const publicSellerWorkSortSchema = z.enum([
  'activity',
  'newest',
  'priceAsc',
  'priceDesc',
]);

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
    pagination: paginationMetaSchema,
  })
  .strict();

export const publicSellerWorksQuerySchema = paginationQuerySchema
  .extend({
    status: publicSellerWorkStatusSchema.optional(),
    sort: publicSellerWorkSortSchema.default('activity'),
  })
  .strict();

export type PublicSellerDetailResponse = z.infer<
  typeof publicSellerDetailResponseSchema
>;

export type PublicSellerListItem = z.infer<typeof publicSellerListItemSchema>;
export type PublicSellerWorksQuery = z.infer<
  typeof publicSellerWorksQuerySchema
>;

import { z } from 'zod';

import { paginationMetaSchema } from './pagination';
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

export type PublicSellerListItem = z.infer<typeof publicSellerListItemSchema>;

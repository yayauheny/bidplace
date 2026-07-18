import { z } from 'zod';

import { publicProductListItemSchema } from './public-product';
import { publicSellerProfileSchema } from './seller-profile';

export const publicSellerDetailResponseSchema = z
  .object({
    sellerProfile: publicSellerProfileSchema,
    products: z.array(publicProductListItemSchema),
  })
  .strict();

export type PublicSellerDetailResponse = z.infer<
  typeof publicSellerDetailResponseSchema
>;

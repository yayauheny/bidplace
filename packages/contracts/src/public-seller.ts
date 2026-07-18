import { z } from 'zod';

import { publicProductListItemSchema } from './public-product';
import { sellerProfileSchema } from './seller-profile';

export const publicSellerDetailResponseSchema = z
  .object({
    sellerProfile: sellerProfileSchema,
    products: z.array(publicProductListItemSchema),
  })
  .strict();

export type PublicSellerDetailResponse = z.infer<
  typeof publicSellerDetailResponseSchema
>;

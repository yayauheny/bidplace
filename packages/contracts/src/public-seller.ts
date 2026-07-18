import { z } from 'zod';

import { publicProductListItemSchema } from './public-product';
import { sellerProfileSchema } from './seller-profile';

export const publicSellerProfileSchema = sellerProfileSchema.pick({
  slug: true,
  sellerType: true,
  storeName: true,
  country: true,
  contactPreference: true,
  socialLink: true,
  shortDescription: true,
});

export const publicSellerDetailResponseSchema = z
  .object({
    sellerProfile: publicSellerProfileSchema,
    products: z.array(publicProductListItemSchema),
  })
  .strict();

export type PublicSellerDetailResponse = z.infer<
  typeof publicSellerDetailResponseSchema
>;

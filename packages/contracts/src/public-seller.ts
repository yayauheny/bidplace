import { z } from 'zod';

import { auctionListItemSchema } from './public-auction';
import { sellerProfileSchema } from './seller-profile';

export const publicSellerDetailResponseSchema = z
  .object({
    sellerProfile: sellerProfileSchema,
    auctions: z.array(auctionListItemSchema),
  })
  .strict();

export type PublicSellerDetailResponse = z.infer<
  typeof publicSellerDetailResponseSchema
>;

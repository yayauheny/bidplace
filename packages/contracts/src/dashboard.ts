import { z } from 'zod';

import { auctionSchema } from './auction';
import { categorySchema } from './category';
import { lotSchema } from './lot';

export const categoryListResponseSchema = z
  .object({
    categories: z.array(categorySchema),
  })
  .strict();

export const sellerLotListResponseSchema = z
  .object({
    lots: z.array(lotSchema),
  })
  .strict();

export const sellerAuctionListResponseSchema = z
  .object({
    auctions: z.array(auctionSchema),
  })
  .strict();

export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;
export type SellerLotListResponse = z.infer<typeof sellerLotListResponseSchema>;
export type SellerAuctionListResponse = z.infer<
  typeof sellerAuctionListResponseSchema
>;

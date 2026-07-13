import { z } from 'zod';

import { auctionSchema } from './auction';
import { bidSchema } from './bid';
import { lotSchema } from './lot';
import { sellerProfileSchema } from './seller-profile';

export const auctionListItemSchema = z
  .object({
    auction: auctionSchema,
    lot: lotSchema,
    sellerProfile: sellerProfileSchema,
  })
  .strict();

export const auctionListResponseSchema = z
  .object({
    auctions: z.array(auctionListItemSchema),
  })
  .strict();

export const publicAuctionDetailResponseSchema = z
  .object({
    auction: auctionSchema,
    lot: lotSchema,
    sellerProfile: sellerProfileSchema,
    bids: z.array(bidSchema),
  })
  .strict();

export type AuctionListItem = z.infer<typeof auctionListItemSchema>;
export type AuctionListResponse = z.infer<typeof auctionListResponseSchema>;
export type PublicAuctionDetailResponse = z.infer<
  typeof publicAuctionDetailResponseSchema
>;

import {
  auctionCreateRequestSchema,
  lotCreateRequestSchema,
  sellerProfileCreateRequestSchema,
} from '@bidplace/contracts';
import { z } from 'zod';

export const sellerProfileFormSchema = sellerProfileCreateRequestSchema;
export const lotFormSchema = lotCreateRequestSchema;
export const auctionFormSchema = auctionCreateRequestSchema;

export type SellerProfileFormValues = z.infer<typeof sellerProfileFormSchema>;
export type LotFormValues = z.infer<typeof lotFormSchema>;
export type AuctionFormValues = z.infer<typeof auctionFormSchema>;

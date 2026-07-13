import { z } from 'zod';

import { auctionSchema } from './auction';
import { bidStatusSchema } from './enums';
import { isoDateTimeSchema, moneyAmountSchema, uuidSchema } from './primitives';

export const bidSchema = z
  .object({
    id: uuidSchema,
    auctionId: uuidSchema,
    bidderUserId: uuidSchema,
    amount: moneyAmountSchema,
    status: bidStatusSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const publicBidSchema = bidSchema.omit({
  bidderUserId: true,
});

export const bidCreateRequestSchema = z
  .object({
    amount: moneyAmountSchema,
  })
  .strict()
  .refine((value) => value.amount > 0, {
    message: 'amount must be greater than zero',
    path: ['amount'],
  });

export const bidPlacementResponseSchema = z
  .object({
    bid: bidSchema,
    auction: auctionSchema,
  })
  .strict();

export const bidHistoryResponseSchema = z
  .object({
    bids: z.array(bidSchema),
  })
  .strict();

export type Bid = z.infer<typeof bidSchema>;
export type PublicBid = z.infer<typeof publicBidSchema>;
export type BidCreateRequest = z.infer<typeof bidCreateRequestSchema>;
export type BidPlacementResponse = z.infer<typeof bidPlacementResponseSchema>;
export type BidHistoryResponse = z.infer<typeof bidHistoryResponseSchema>;

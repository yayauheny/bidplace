import { z } from 'zod';

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

export const bidCreateRequestSchema = z
  .object({
    amount: moneyAmountSchema,
  })
  .strict()
  .refine((value) => value.amount > 0, {
    message: 'amount must be greater than zero',
    path: ['amount'],
  });

export type Bid = z.infer<typeof bidSchema>;
export type BidCreateRequest = z.infer<typeof bidCreateRequestSchema>;

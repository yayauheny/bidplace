import { z } from 'zod'; import { listingSchema } from './listing'; import { paginationMetaSchema } from './pagination'; import { isoDateTimeSchema, moneyAmountSchema, uuidSchema } from './primitives';
export const bidSchema = z.object({ id: uuidSchema, listingId: uuidSchema, amount: moneyAmountSchema, createdAt: isoDateTimeSchema, bidderAlias: z.string().min(1) }).strict();
export const bidCreateRequestSchema = z.object({ amount: moneyAmountSchema }).strict();
export const bidPlacementResponseSchema = z.object({ bid: bidSchema, listing: listingSchema, minimumNextBid: moneyAmountSchema }).strict();
export const bidHistoryResponseSchema = z.object({ bids: z.array(bidSchema), pagination: paginationMetaSchema }).strict();
export type BidCreateRequest = z.infer<typeof bidCreateRequestSchema>;

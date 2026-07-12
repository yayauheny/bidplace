import { z } from 'zod';

import { auctionStatusSchema } from './enums';
import { bidSchema } from './bid';
import { isoDateTimeSchema, moneyAmountSchema, uuidSchema } from './primitives';

export const realtimeEventNameSchema = z.enum([
  'auction.updated',
  'bid.placed',
  'auction.ended',
]);

export const auctionUpdatedEventPayloadSchema = z
  .object({
    auctionId: uuidSchema,
    currentPrice: moneyAmountSchema,
    bidCount: z.number().int().nonnegative(),
    status: auctionStatusSchema,
    endsAt: isoDateTimeSchema,
    winnerBidId: uuidSchema.nullable(),
    reserveReached: z.boolean(),
  })
  .strict();

export const bidPlacedEventPayloadSchema = z
  .object({
    auctionId: uuidSchema,
    bid: bidSchema,
    currentPrice: moneyAmountSchema,
    bidCount: z.number().int().nonnegative(),
  })
  .strict();

export const auctionEndedEventPayloadSchema = z
  .object({
    auctionId: uuidSchema,
    status: auctionStatusSchema,
    winnerBidId: uuidSchema.nullable(),
    reserveReached: z.boolean(),
  })
  .strict();

export const realtimeEventPayloadSchema = z.discriminatedUnion('event', [
  z
    .object({
      event: z.literal('auction.updated'),
      payload: auctionUpdatedEventPayloadSchema,
    })
    .strict(),
  z
    .object({
      event: z.literal('bid.placed'),
      payload: bidPlacedEventPayloadSchema,
    })
    .strict(),
  z
    .object({
      event: z.literal('auction.ended'),
      payload: auctionEndedEventPayloadSchema,
    })
    .strict(),
]);

export type RealtimeEventName = z.infer<typeof realtimeEventNameSchema>;
export type AuctionUpdatedEventPayload = z.infer<
  typeof auctionUpdatedEventPayloadSchema
>;
export type BidPlacedEventPayload = z.infer<typeof bidPlacedEventPayloadSchema>;
export type AuctionEndedEventPayload = z.infer<
  typeof auctionEndedEventPayloadSchema
>;

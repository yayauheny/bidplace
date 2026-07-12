import { z } from 'zod';

import { auctionStatusSchema } from './enums';
import {
  currencyCodeSchema,
  isoDateTimeSchema,
  moneyAmountSchema,
  slugSchema,
  uuidSchema,
} from './primitives';

export const auctionSchema = z
  .object({
    id: uuidSchema,
    lotId: uuidSchema,
    sellerProfileId: uuidSchema,
    slug: slugSchema,
    startPrice: moneyAmountSchema,
    reservePrice: moneyAmountSchema,
    currentPrice: moneyAmountSchema,
    currency: currencyCodeSchema,
    bidStep: moneyAmountSchema,
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema,
    status: auctionStatusSchema,
    bidCount: z.number().int().nonnegative(),
    winnerBidId: uuidSchema.nullable(),
    buyNowPrice: moneyAmountSchema.nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const auctionCreateRequestSchema = z
  .object({
    lotId: uuidSchema,
    slug: slugSchema,
    startPrice: moneyAmountSchema,
    reservePrice: moneyAmountSchema,
    currency: currencyCodeSchema,
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema,
    buyNowPrice: moneyAmountSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => value.reservePrice >= value.startPrice, {
    message: 'reservePrice must be greater than or equal to startPrice',
    path: ['reservePrice'],
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export const auctionPublishRequestSchema = z.object({}).strict();

export const auctionDetailSchema = auctionSchema;

export type Auction = z.infer<typeof auctionSchema>;
export type AuctionCreateRequest = z.infer<typeof auctionCreateRequestSchema>;
export type AuctionPublishRequest = z.infer<
  typeof auctionPublishRequestSchema
>;

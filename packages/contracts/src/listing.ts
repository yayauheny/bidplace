import { z } from 'zod';
import { listingStatusSchema, listingTypeSchema } from './enums';
import { currencyCodeSchema, isoDateTimeSchema, moneyAmountSchema, uuidSchema } from './primitives';
export const auctionRulesSchema = z.object({ startPrice: moneyAmountSchema, incrementPolicyCode: z.literal('MVP_BYN_V1'), softCloseWindowSeconds: z.literal(60), softCloseExtensionSeconds: z.literal(60), softCloseMaxTotalSeconds: z.literal(600) }).strict();
export const listingSchema = z.object({ id: uuidSchema, productId: uuidSchema, type: listingTypeSchema, status: listingStatusSchema, currency: z.literal('BYN'), startsAt: isoDateTimeSchema, originalEndsAt: isoDateTimeSchema, endsAt: isoDateTimeSchema, currentPrice: moneyAmountSchema, bidCount: z.number().int().nonnegative(), closedAt: isoDateTimeSchema.nullable(), auctionRules: auctionRulesSchema, createdAt: isoDateTimeSchema, updatedAt: isoDateTimeSchema }).strict();
export const listingCreateRequestSchema = z.object({ startsAt: isoDateTimeSchema, endsAt: isoDateTimeSchema, startPrice: moneyAmountSchema }).strict().refine(({ startsAt, endsAt }) => new Date(endsAt) > new Date(startsAt), { path: ['endsAt'], message: 'endsAt must be after startsAt' });
export const listingUpdateRequestSchema = z.object({ action: z.enum(['SCHEDULE', 'CANCEL']) }).strict();
export const listingResponseSchema = z.object({ listing: listingSchema }).strict();
export type Listing = z.infer<typeof listingSchema>; export type ListingCreateRequest = z.infer<typeof listingCreateRequestSchema>;

import { z } from 'zod';

import { idempotencyKeySchema } from './auth';
import {
  listingTypeSchema,
  orderStatusSchema,
} from './enums';
import { isoDateTimeSchema, uuidSchema } from './primitives';
import { turnstileTokenSchema } from './user';

const DAY_MS = 24 * 60 * 60 * 1000;

export const COMMERCE_CURRENCIES = ['BYN', 'RUB'] as const;
export type Currency = (typeof COMMERCE_CURRENCIES)[number];

export const COMMERCE_LIMITS = {
  maxAmountMinor: 100_000_000,
  auctionMinDays: 1,
  auctionMaxDays: 14,
  scheduleMaxDays: 30,
  buyerActiveOrders: 3,
  buyerStrikesToBlock: 2,
  contactWindowHours: [1, 6, 24, 48, 72],
  defaultContactWindowHours: 24,
  sellerReminderHours: [24, 48],
  adminAttentionHours: 72,
  strikeDelayHours: 72,
  reportWindowDays: 14,
} as const;

type BidStepRow = { belowMinor: number | null; stepMinor: number };

export const BID_STEP_TABLES: Record<Currency, readonly BidStepRow[]> = {
  BYN: [
    { belowMinor: 2_500, stepMinor: 50 },
    { belowMinor: 10_000, stepMinor: 100 },
    { belowMinor: 50_000, stepMinor: 500 },
    { belowMinor: 100_000, stepMinor: 1_000 },
    { belowMinor: null, stepMinor: 2_500 },
  ],
  RUB: [
    { belowMinor: 50_000, stepMinor: 1_000 },
    { belowMinor: 250_000, stepMinor: 2_500 },
    { belowMinor: 1_000_000, stepMinor: 10_000 },
    { belowMinor: 2_500_000, stepMinor: 25_000 },
    { belowMinor: null, stepMinor: 50_000 },
  ],
};

export const ORDER_SOURCES = [
  'AUCTION_WIN',
  'SECOND_CHANCE',
  'FIXED_PURCHASE',
] as const;
export const ORDER_FAIL_REASONS = [
  'BUYER_REFUSED',
  'BUYER_NO_CONTACT',
  'BUYER_INVALID_CONTACTS',
  'SELLER_REFUSED',
  'OFFER_DECLINED',
  'OFFER_EXPIRED',
  'ADMIN_CANCELLED',
] as const;
export const FAULT_SIDES = ['BUYER', 'SELLER', 'NONE'] as const;
export const REPORT_TARGETS = ['ORDER', 'WORK', 'AUTHOR', 'USER'] as const;
export const REPORT_STATUSES = ['OPEN', 'UPHELD', 'REJECTED'] as const;
export const REPORT_REASONS = [
  'NO_CONTACT',
  'TERMS_CHANGED',
  'NOT_AS_DESCRIBED',
  'NOT_HANDED_OVER',
  'FRAUD',
  'OTHER',
] as const;
export const EFFECTIVE_LISTING_STATES = [
  'SCHEDULED',
  'LIVE',
  'AWAITING_CLOSE',
  'ENDED',
  'CANCELLED',
] as const;
export const LOT_MARKS = [
  'BUY',
  'AUCTION',
  'SCHEDULED',
  'RESERVED',
  'SOLD',
] as const;
export const ATTENTION_KINDS = [
  'OFFER',
  'ACTIVE_ORDER',
  'OPEN_REPORT',
  'AUCTION_CHOICE',
  'CONTACTS_REQUIRED',
] as const;

const currencySchema = z.enum(COMMERCE_CURRENCIES);

const amountMinorSchema = z
  .number()
  .int()
  .positive()
  .max(COMMERCE_LIMITS.maxAmountMinor);

const contactWindowHoursSchema = z
  .number()
  .int()
  .refine(
    (value): value is (typeof COMMERCE_LIMITS.contactWindowHours)[number] =>
      (COMMERCE_LIMITS.contactWindowHours as readonly number[]).includes(
        value,
      ),
    { message: 'Contact window must be 1, 6, 24, 48 or 72 hours' },
  )
  .default(COMMERCE_LIMITS.defaultContactWindowHours);

function bidStepMinor(currency: Currency, currentMinor: number): number {
  const row = BID_STEP_TABLES[currency].find(
    (entry) => entry.belowMinor === null || currentMinor < entry.belowMinor,
  );
  if (!row) {
    throw new Error(`no bid step for ${currency} ${currentMinor}`);
  }
  return row.stepMinor;
}

const listingFields = {
  currency: currencySchema,
  startsAt: isoDateTimeSchema,
  contactWindowHours: contactWindowHoursSchema,
};

const fixedListingSchema = z
  .object({
    type: z.literal('FIXED'),
    priceMinor: amountMinorSchema,
    ...listingFields,
  })
  .strict();

const auctionListingSchema = z
  .object({
    type: z.literal('AUCTION'),
    startPriceMinor: amountMinorSchema,
    endsAt: isoDateTimeSchema,
    ...listingFields,
  })
  .strict();

export const createListingRequestSchema = z
  .discriminatedUnion('type', [fixedListingSchema, auctionListingSchema])
  .superRefine((value, context) => {
    const start = Date.parse(value.startsAt);
    if (
      start >
      Date.now() + COMMERCE_LIMITS.scheduleMaxDays * DAY_MS
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startsAt'],
        message: 'startsAt is further than 30 days',
      });
    }
    if (value.type !== 'AUCTION') return;

    const span = Date.parse(value.endsAt) - start;
    if (
      span < COMMERCE_LIMITS.auctionMinDays * DAY_MS ||
      span > COMMERCE_LIMITS.auctionMaxDays * DAY_MS
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'Auction length must be from 1 to 14 days',
      });
    }
    if (value.startPriceMinor % bidStepMinor(value.currency, value.startPriceMinor) !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startPriceMinor'],
        message: 'Start price must be a multiple of the bid step',
      });
    }
  });

export const placeBidRequestSchema = z
  .object({
    amountMinor: amountMinorSchema,
    idempotencyKey: idempotencyKeySchema,
    turnstileToken: turnstileTokenSchema.optional(),
  })
  .strict();

export const purchaseRequestSchema = z
  .object({
    idempotencyKey: idempotencyKeySchema,
    comment: z.string().trim().max(500).optional(),
    turnstileToken: turnstileTokenSchema.optional(),
  })
  .strict();

export const failOrderRequestSchema = z
  .object({
    reason: z.enum(ORDER_FAIL_REASONS),
  })
  .strict();

export const orderNoteRequestSchema = z
  .object({
    note: z.string().trim().max(1000),
  })
  .strict();

export const createReportRequestSchema = z
  .object({
    reason: z.enum(REPORT_REASONS),
    text: z.string().trim().max(1000).optional(),
  })
  .strict();

export const resolveReportRequestSchema = z
  .object({
    status: z.enum(['UPHELD', 'REJECTED']),
    faultSide: z.enum(FAULT_SIDES).optional(),
    adminNote: z.string().trim().max(2000).optional(),
    reason: z.string().trim().min(1).max(2000),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === 'UPHELD' && value.faultSide === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['faultSide'],
        message: 'An upheld report needs a fault side',
      });
    }
  });

const viewerSchema = z
  .object({
    role: z.enum(['visitor', 'seller', 'buyer', 'admin']),
    isLeading: z.boolean(),
    blockedReason: z.string().min(1).nullable(),
  })
  .strict();

export const publicLotSchema = z
  .object({
    id: uuidSchema,
    type: listingTypeSchema,
    effectiveStatus: z.enum(EFFECTIVE_LISTING_STATES),
    currency: currencySchema,
    priceMinor: z.number().int().nonnegative().nullable(),
    minimumBidMinor: z.number().int().positive().nullable(),
    bidCount: z.number().int().nonnegative(),
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema.nullable(),
    contactWindowHours: z.number().int(),
    mark: z.enum(LOT_MARKS).nullable(),
    serverNow: isoDateTimeSchema,
    viewer: viewerSchema.nullable(),
  })
  .strict();

export const bidHistoryResponseSchema = z
  .object({
    bids: z
      .array(
        z
          .object({
            amountMinor: z.number().int().positive(),
            createdAt: isoDateTimeSchema,
            participantLabel: z.string().regex(/^Участник \d+$/),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();

const orderSummaryFields = {
  publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  dealCode: z.string().regex(/^\d{6}$/),
  status: orderStatusSchema,
  source: z.enum(ORDER_SOURCES),
  amountMinor: amountMinorSchema,
  currency: currencySchema,
  workTitle: z.string().trim().min(1).max(200),
  workPublicId: z.string().trim().min(1).max(16),
  role: z.enum(['buyer', 'seller', 'admin']),
  createdAt: isoDateTimeSchema,
};

export const orderSummarySchema = z.object(orderSummaryFields).strict();

const orderContactsSchema = z
  .object({
    email: z.string().email(),
    phone: z.string().nullable(),
    telegram: z.string().nullable(),
    instagram: z.string().nullable(),
    vk: z.string().nullable(),
  })
  .strict();

export const orderDetailSchema = orderSummarySchema
  .extend({
    contactDeadlineAt: isoDateTimeSchema.nullable(),
    offerExpiresAt: isoDateTimeSchema.nullable(),
    buyerComment: z.string().max(500).nullable(),
    sellerNote: z.string().max(1000).nullable(),
    failReason: z.enum(ORDER_FAIL_REASONS).nullable(),
    faultSide: z.enum(FAULT_SIDES).nullable(),
    completedAt: isoDateTimeSchema.nullable(),
    failedAt: isoDateTimeSchema.nullable(),
    buyerContacts: orderContactsSchema.nullable(),
    sellerContacts: orderContactsSchema.nullable(),
  })
  .strict();

export const attentionResponseSchema = z
  .object({
    items: z.array(
      z
        .object({
          kind: z.enum(ATTENTION_KINDS),
          orderPublicId: z.string().nullable(),
          listingId: uuidSchema.nullable(),
          productId: uuidSchema.nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export const reportSchema = z
  .object({
    id: uuidSchema,
    targetType: z.enum(REPORT_TARGETS),
    targetId: uuidSchema,
    reason: z.enum(REPORT_REASONS),
    text: z.string().max(1000).nullable(),
    status: z.enum(REPORT_STATUSES),
    faultSide: z.enum(FAULT_SIDES).nullable(),
    createdAt: isoDateTimeSchema,
    resolvedAt: isoDateTimeSchema.nullable(),
  })
  .strict();

export const trustSignalsSchema = z
  .object({
    completedAsSeller: z.number().int().nonnegative(),
    completedAsBuyer: z.number().int().nonnegative(),
    buyerStrikes: z.number().int().nonnegative(),
    sellerFaultFailures: z.number().int().nonnegative(),
    upheldReportsAgainst: z.number().int().nonnegative(),
    memberSince: isoDateTimeSchema,
    emailVerified: z.boolean(),
  })
  .strict();

export type CreateListingRequest = z.infer<typeof createListingRequestSchema>;
export type PlaceBidRequest = z.infer<typeof placeBidRequestSchema>;
export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>;
export type PublicLot = z.infer<typeof publicLotSchema>;
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
export type TrustSignals = z.infer<typeof trustSignalsSchema>;

import { z } from 'zod';

import { apiErrorCodeSchema } from './error';
import { isoDateTimeSchema, uuidSchema } from './primitives';

export const ANALYTICS_EVENT_NAMES = [
  'listing_viewed',
  'seller_viewed',
  'registration_started',
  'bid_cta_clicked',
  'bid_rejected',
] as const;

export const analyticsEventNameSchema = z.enum(ANALYTICS_EVENT_NAMES);
export type AnalyticsEventName = z.infer<typeof analyticsEventNameSchema>;

export const analyticsPlatformSchema = z.enum(['web', 'ios', 'android']);
export type AnalyticsPlatform = z.infer<typeof analyticsPlatformSchema>;

const optionalAttributionField = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .optional();

export const analyticsAttributionSchema = z
  .object({
    source: optionalAttributionField,
    medium: optionalAttributionField,
    campaign: optionalAttributionField,
    content: optionalAttributionField,
    referrer: optionalAttributionField,
    landingPath: optionalAttributionField,
  })
  .strict();

export type AnalyticsAttribution = z.infer<typeof analyticsAttributionSchema>;

export const listingViewedPropertiesSchema = z
  .object({
    productPublicId: z.string().trim().min(1).max(16),
    listingId: uuidSchema.optional(),
    sellerProfileId: uuidSchema.optional(),
  })
  .strict();

export const sellerViewedPropertiesSchema = z
  .object({
    sellerProfileId: uuidSchema,
    sellerSlug: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const registrationStartedPropertiesSchema = z.object({}).strict();

export const bidCtaClickedPropertiesSchema = z
  .object({
    listingId: uuidSchema,
    productPublicId: z.string().trim().min(1).max(16).optional(),
  })
  .strict();

export const bidRejectedPropertiesSchema = z
  .object({
    listingId: uuidSchema,
    errorCode: apiErrorCodeSchema,
    productPublicId: z.string().trim().min(1).max(16).optional(),
  })
  .strict();

export const analyticsEventInputSchema = z.discriminatedUnion('name', [
  z
    .object({
      name: z.literal('listing_viewed'),
      properties: listingViewedPropertiesSchema,
      clientCapturedAt: isoDateTimeSchema.optional(),
    })
    .strict(),
  z
    .object({
      name: z.literal('seller_viewed'),
      properties: sellerViewedPropertiesSchema,
      clientCapturedAt: isoDateTimeSchema.optional(),
    })
    .strict(),
  z
    .object({
      name: z.literal('registration_started'),
      properties: registrationStartedPropertiesSchema.default({}),
      clientCapturedAt: isoDateTimeSchema.optional(),
    })
    .strict(),
  z
    .object({
      name: z.literal('bid_cta_clicked'),
      properties: bidCtaClickedPropertiesSchema,
      clientCapturedAt: isoDateTimeSchema.optional(),
    })
    .strict(),
  z
    .object({
      name: z.literal('bid_rejected'),
      properties: bidRejectedPropertiesSchema,
      clientCapturedAt: isoDateTimeSchema.optional(),
    })
    .strict(),
]);

export const analyticsIngestRequestSchema = z
  .object({
    anonymousId: uuidSchema,
    environment: z.string().trim().min(1).max(32),
    platform: analyticsPlatformSchema.optional(),
    appVersion: z.string().trim().min(1).max(32).optional(),
    claimAcquisition: z.boolean().optional(),
    attribution: analyticsAttributionSchema.optional(),
    events: z.array(analyticsEventInputSchema).max(25).default([]),
  })
  .strict()
  .superRefine((payload, context) => {
    if (
      payload.events.length === 0 &&
      !payload.claimAcquisition &&
      !payload.attribution
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['events'],
        message:
          'events required unless claimAcquisition or attribution is present',
      });
    }
  });

export const analyticsIngestResponseSchema = z
  .object({
    accepted: z.number().int().nonnegative(),
  })
  .strict();

export type AnalyticsIngestRequest = z.infer<typeof analyticsIngestRequestSchema>;
export type AnalyticsIngestResponse = z.infer<
  typeof analyticsIngestResponseSchema
>;

export const adminAnalyticsPeriodSchema = z.enum([
  'today',
  '7d',
  '30d',
  '90d',
  'custom',
]);

export const adminAnalyticsQuerySchema = z
  .object({
    period: adminAnalyticsPeriodSchema.default('7d'),
    from: isoDateTimeSchema.optional(),
    to: isoDateTimeSchema.optional(),
    drilldown: z
      .enum([
        'auctions_without_bids',
        'new_users',
        'new_creators',
        'recent_bids',
        'recent_orders',
        'bid_rejected',
        'stuck_products',
        'stuck_sellers',
        'stale_live_listings',
      ])
      .optional(),
  })
  .strict()
  .superRefine((query, context) => {
    if (query.period === 'custom' && (!query.from || !query.to)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'custom period requires from and to',
        path: ['from'],
      });
    }
  });

export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;

const metricCountSchema = z.object({
  value: z.number().int().nonnegative(),
  definition: z.string().min(1),
  source: z.enum(['postgresql', 'analytics']),
});

export const adminAnalyticsOverviewSchema = z
  .object({
    period: adminAnalyticsPeriodSchema,
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    overview: z
      .object({
        users: metricCountSchema,
        newUsers: metricCountSchema,
        activeUsers: metricCountSchema,
        creators: metricCountSchema,
        liveAuctions: metricCountSchema,
        bids: metricCountSchema,
        endedAuctions: metricCountSchema,
        successfulAuctions: metricCountSchema,
      })
      .strict(),
    acquisition: z
      .object({
        bySource: z.array(
          z
            .object({
              source: z.string(),
              visitors: z.number().int().nonnegative(),
              signups: z.number().int().nonnegative(),
            })
            .strict(),
        ),
        visitorToSignupRate: z.number().nonnegative().nullable(),
      })
      .strict(),
    buyerFunnel: z
      .object({
        listingViewed: metricCountSchema,
        bidCtaClicked: metricCountSchema,
        bidAccepted: metricCountSchema,
        winners: metricCountSchema,
      })
      .strict(),
    sellerFunnel: z
      .object({
        registeredUsers: metricCountSchema,
        sellerProfiles: metricCountSchema,
        productsCreated: metricCountSchema,
        productsApproved: metricCountSchema,
        auctionsStarted: metricCountSchema,
        auctionsWithBids: metricCountSchema,
        auctionsSold: metricCountSchema,
      })
      .strict(),
    marketplace: z
      .object({
        liveAuctions: metricCountSchema,
        auctionsStarted: metricCountSchema,
        auctionsEnded: metricCountSchema,
        auctionsWithZeroBids: metricCountSchema,
        auctionsWithBids: metricCountSchema,
        averageBidsPerEndedAuction: z.number().nonnegative().nullable(),
        uniqueBidders: metricCountSchema,
        uniqueActiveSellers: metricCountSchema,
        medianSecondsToFirstBid: z.number().nonnegative().nullable(),
        auctionsReceivingBidRate: z.number().nonnegative().nullable(),
        auctionsSoldRate: z.number().nonnegative().nullable(),
      })
      .strict(),
    growth: z.array(
      z
        .object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          newUsers: z.number().int().nonnegative(),
          listingViews: z.number().int().nonnegative(),
          newSellers: z.number().int().nonnegative(),
          newListings: z.number().int().nonnegative(),
          bids: z.number().int().nonnegative(),
          orders: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    recent: z
      .object({
        users: z.array(
          z
            .object({
              id: uuidSchema,
              displayName: z.string(),
              createdAt: isoDateTimeSchema,
            })
            .strict(),
        ),
        creators: z.array(
          z
            .object({
              id: uuidSchema,
              fullName: z.string(),
              slug: z.string(),
              status: z.string(),
              createdAt: isoDateTimeSchema,
            })
            .strict(),
        ),
        listings: z.array(
          z
            .object({
              id: uuidSchema,
              productPublicId: z.string(),
              productTitle: z.string().nullable(),
              status: z.string(),
              createdAt: isoDateTimeSchema,
            })
            .strict(),
        ),
        bids: z.array(
          z
            .object({
              id: uuidSchema,
              listingId: uuidSchema,
              amount: z.string(),
              createdAt: isoDateTimeSchema,
            })
            .strict(),
        ),
        endedAuctions: z.array(
          z
            .object({
              id: uuidSchema,
              productPublicId: z.string(),
              productTitle: z.string().nullable(),
              bidCount: z.number().int().nonnegative(),
              closedAt: isoDateTimeSchema.nullable(),
            })
            .strict(),
        ),
        orders: z.array(
          z
            .object({
              publicId: z.string(),
              status: z.string(),
              finalAmount: z.string(),
              createdAt: isoDateTimeSchema,
            })
            .strict(),
        ),
      })
      .strict(),
    attention: z
      .object({
        staleLiveListings: z.number().int().nonnegative(),
        stuckProducts: z.number().int().nonnegative(),
        stuckSellers: z.number().int().nonnegative(),
        bidRejectedEvents: z.number().int().nonnegative(),
      })
      .strict(),
    drilldown: z
      .array(
        z
          .object({
            id: z.string(),
            label: z.string(),
            meta: z.string().optional(),
            href: z.string().optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export type AdminAnalyticsOverview = z.infer<
  typeof adminAnalyticsOverviewSchema
>;

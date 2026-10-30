import { describe, expect, it } from 'vitest';

import { apiErrorCodeSchema } from './error';
import { LISTING_STATUSES, LISTING_TYPES, ORDER_STATUSES } from './enums';
import {
  BID_STEP_TABLES,
  bidStepMinor,
  COMMERCE_CURRENCIES,
  COMMERCE_LIMITS,
  attentionResponseSchema,
  bidHistoryResponseSchema,
  createListingRequestSchema,
  createReportRequestSchema,
  failOrderRequestSchema,
  orderDetailSchema,
  orderNoteRequestSchema,
  orderSummarySchema,
  placeBidRequestSchema,
  publicLotSchema,
  purchaseRequestSchema,
  reportSchema,
  resolveReportRequestSchema,
  trustSignalsSchema,
} from './commerce';
import {
  notificationSettingsSchema,
  userContactsRequestSchema,
} from './user';

const DAY_MS = 24 * 60 * 60 * 1000;

function iso(offsetMs: number, origin = Date.now()): string {
  return new Date(origin + offsetMs).toISOString();
}

function auction(
  overrides: Record<string, unknown> = {},
  origin = Date.now(),
) {
  return {
    type: 'AUCTION' as const,
    currency: 'BYN' as const,
    startPriceMinor: 2_500,
    startsAt: iso(60_000, origin),
    endsAt: iso(60_000 + 2 * DAY_MS, origin),
    contactWindowHours: 24,
    ...overrides,
  };
}

function fixed(overrides: Record<string, unknown> = {}, origin = Date.now()) {
  return {
    type: 'FIXED' as const,
    currency: 'BYN' as const,
    priceMinor: 1_500,
    startsAt: iso(0, origin),
    contactWindowHours: 24,
    ...overrides,
  };
}

describe('bid step tables', () => {
  it.each([
    ['BYN', 2_499, 50],
    ['BYN', 2_500, 100],
    ['BYN', 9_999, 100],
    ['BYN', 10_000, 500],
    ['BYN', 49_999, 500],
    ['BYN', 50_000, 1_000],
    ['BYN', 99_999, 1_000],
    ['BYN', 100_000, 2_500],
    ['RUB', 49_999, 1_000],
    ['RUB', 50_000, 2_500],
    ['RUB', 249_999, 2_500],
    ['RUB', 250_000, 10_000],
    ['RUB', 999_999, 10_000],
    ['RUB', 1_000_000, 25_000],
    ['RUB', 2_499_999, 25_000],
    ['RUB', 2_500_000, 50_000],
  ] as const)(
    '%s current %i minor uses step %i',
    (currency, currentMinor, expected) => {
      expect(bidStepMinor(currency, currentMinor)).toBe(expected);
    },
  );

  it('keeps one open-ended row per currency', () => {
    for (const currency of COMMERCE_CURRENCIES) {
      const open = BID_STEP_TABLES[currency].filter(
        (row) => row.belowMinor === null,
      );
      expect(open).toHaveLength(1);
    }
  });
});

describe('createListingRequestSchema', () => {
  it('accepts a fixed price and an auction inside the duration window', () => {
    const origin = Date.now();
    expect(createListingRequestSchema.parse(fixed({}, origin))).toMatchObject({
      type: 'FIXED',
      priceMinor: 1_500,
    });
    expect(
      createListingRequestSchema.parse(
        auction(
          {
            startsAt: iso(60_000, origin),
            endsAt: iso(60_000 + DAY_MS, origin),
          },
          origin,
        ),
      ).type,
    ).toBe('AUCTION');
    expect(
      createListingRequestSchema.parse(
        auction(
          {
            startsAt: iso(60_000, origin),
            endsAt: iso(60_000 + 14 * DAY_MS, origin),
          },
          origin,
        ),
      ),
    ).toMatchObject({ type: 'AUCTION' });
  });

  it('defaults the contact window to 24 hours', () => {
    const { contactWindowHours: _ignored, ...withoutWindow } = fixed();
    expect(
      createListingRequestSchema.parse(withoutWindow).contactWindowHours,
    ).toBe(COMMERCE_LIMITS.defaultContactWindowHours);
  });

  it.each([
    ['currency', fixed({ currency: 'USD' })],
    ['zero price', fixed({ priceMinor: 0 })],
    ['negative price', fixed({ priceMinor: -1 })],
    ['price above the limit', fixed({ priceMinor: COMMERCE_LIMITS.maxAmountMinor + 1 })],
    ['auction shorter than 1 day', auction({ endsAt: iso(60_000 + DAY_MS - 1) })],
    ['auction longer than 14 days', auction({ endsAt: iso(60_000 + 14 * DAY_MS + 1) })],
    ['startsAt further than 30 days', auction({ startsAt: iso(30 * DAY_MS + 60_000), endsAt: iso(30 * DAY_MS + 60_000 + 2 * DAY_MS) })],
    ['priceMinor on an auction', auction({ priceMinor: 2_500 })],
    ['contact window outside the list', fixed({ contactWindowHours: 12 })],
    ['start price not a multiple of the step', auction({ startPriceMinor: 2_499 })],
  ])('rejects %s', (_label, input) => {
    expect(createListingRequestSchema.safeParse(input).success).toBe(false);
  });

  it('accepts a start exactly 30 days ahead and a step-aligned start price', () => {
    const origin = Date.now();
    const startsAt = iso(30 * DAY_MS - 1_000, origin);
    expect(
      createListingRequestSchema.safeParse(
        auction(
          {
            currency: 'RUB',
            startPriceMinor: 50_000,
            startsAt,
            endsAt: iso(30 * DAY_MS - 1_000 + 7 * DAY_MS, origin),
          },
          origin,
        ),
      ).success,
    ).toBe(true);
  });
});

describe('deal contact and notification contracts', () => {
  it.each([
    ['telegram handle', { telegram: '@seller' }],
    ['telegram link', { telegram: 'https://t.me/seller' }],
    ['instagram handle', { instagram: '@maker.name' }],
    ['instagram link', { instagram: 'https://instagram.com/maker' }],
    ['vk handle', { vk: '@club1' }],
    ['vk link', { vk: 'https://vk.com/club1' }],
    ['phone with 7 digits', { phone: '+1234567' }],
    ['phone with 15 digits', { phone: '+123456789012345' }],
  ])('accepts %s', (_label, contacts) => {
    expect(userContactsRequestSchema.parse(contacts)).toMatchObject(contacts);
  });

  it.each([
    ['telegram without a handle', { telegram: 'seller' }],
    ['telegram http link', { telegram: 'http://t.me/seller' }],
    ['instagram empty', { instagram: '' }],
    ['vk without https', { vk: 'vk.com/club1' }],
    ['phone without plus', { phone: '375291234567' }],
    ['phone shorter than 7 digits', { phone: '+123456' }],
    ['phone longer than 15 digits', { phone: '+1234567890123456' }],
  ])('rejects %s', (_label, contacts) => {
    expect(userContactsRequestSchema.safeParse(contacts).success).toBe(false);
  });

  it('accepts the outbid email setting and rejects extra keys', () => {
    expect(notificationSettingsSchema.parse({ outbidEmail: false })).toEqual({
      outbidEmail: false,
    });
    expect(
      notificationSettingsSchema.safeParse({ outbidEmail: true, sms: true })
        .success,
    ).toBe(false);
  });
});

describe('commerce request and response schemas', () => {
  const now = '2026-10-30T09:00:00.000Z';
  const lot = {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    type: 'AUCTION',
    effectiveStatus: 'LIVE',
    currency: 'BYN',
    priceMinor: 2_500,
    minimumBidMinor: 2_600,
    bidCount: 1,
    startsAt: now,
    endsAt: '2026-11-02T09:00:00.000Z',
    contactWindowHours: 24,
    mark: 'AUCTION',
    serverNow: now,
    viewer: {
      role: 'buyer',
      isLeading: false,
      blockedReason: null,
    },
  };

  it('parses a public lot and refuses contact fields on it', () => {
    expect(publicLotSchema.parse(lot).bidCount).toBe(1);
    expect(
      publicLotSchema.safeParse({ ...lot, contactPhone: '+1234567' }).success,
    ).toBe(false);
  });

  it('parses bid history as participant labels and refuses names', () => {
    expect(
      bidHistoryResponseSchema.parse({
        bids: [
          {
            amountMinor: 2_600,
            createdAt: now,
            participantLabel: 'Участник 1',
          },
        ],
      }).bids,
    ).toHaveLength(1);
    expect(
      bidHistoryResponseSchema.safeParse({
        bids: [
          {
            amountMinor: 2_600,
            createdAt: now,
            participantLabel: 'Участник 1',
            bidderName: 'Ann',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('parses bid, purchase, fail, note and report requests', () => {
    expect(
      placeBidRequestSchema.parse({
        amountMinor: 2_600,
        idempotencyKey: 'bid-key-1',
      }).amountMinor,
    ).toBe(2_600);
    expect(
      placeBidRequestSchema.parse({
        amountMinor: 100_000_001,
        idempotencyKey: 'bid-key-1',
        turnstileToken: '',
      }),
    ).toMatchObject({ amountMinor: 100_000_001, turnstileToken: '' });
    expect(
      placeBidRequestSchema.safeParse({
        amountMinor: 0,
        idempotencyKey: 'bid-key-1',
      }).success,
    ).toBe(false);
    expect(
      purchaseRequestSchema.parse({
        idempotencyKey: 'buy-key-1',
        comment: 'Pickup on Saturday',
      }).comment,
    ).toBe('Pickup on Saturday');
    expect(
      failOrderRequestSchema.parse({ reason: 'BUYER_REFUSED' }).reason,
    ).toBe('BUYER_REFUSED');
    expect(orderNoteRequestSchema.parse({ note: 'Called twice' }).note).toBe(
      'Called twice',
    );
    expect(
      createReportRequestSchema.parse({
        reason: 'NO_CONTACT',
        text: 'No answer',
      }).reason,
    ).toBe('NO_CONTACT');
    expect(
      resolveReportRequestSchema.parse({
        status: 'UPHELD',
        faultSide: 'BUYER',
        reason: 'Buyer never answered',
      }).status,
    ).toBe('UPHELD');
    expect(
      resolveReportRequestSchema.safeParse({
        status: 'UPHELD',
        reason: 'Missing fault',
      }).success,
    ).toBe(false);
  });

  it('keeps contacts off the order summary and on the order card', () => {
    const summary = {
      publicId: 'q7Xf2Kd9aB1',
      dealCode: '123456',
      status: 'ACTIVE',
      source: 'FIXED_PURCHASE',
      amountMinor: 1_500,
      currency: 'BYN',
      workTitle: 'Bowl',
      workPublicId: 'workpublic01',
      role: 'buyer',
      createdAt: now,
    };
    expect(orderSummarySchema.parse(summary).dealCode).toBe('123456');
    expect(
      orderSummarySchema.safeParse({ ...summary, phone: '+1234567' }).success,
    ).toBe(false);
    expect(
      orderDetailSchema.parse({
        ...summary,
        contactDeadlineAt: '2026-10-31T09:00:00.000Z',
        offerExpiresAt: null,
        buyerComment: null,
        sellerNote: null,
        failReason: null,
        faultSide: null,
        completedAt: null,
        failedAt: null,
        buyerContacts: {
          email: 'buyer@example.com',
          phone: '+1234567',
          telegram: null,
          instagram: null,
          vk: null,
        },
        sellerContacts: null,
        sellerContactHint: null,
      }).buyerContacts?.phone,
    ).toBe('+1234567');
  });

  it('parses attention, reports and trust signals', () => {
    expect(
      attentionResponseSchema.parse({
        items: [
          {
            kind: 'CONTACTS_REQUIRED',
            orderPublicId: null,
            listingId: null,
            productId: null,
          },
        ],
      }).items,
    ).toHaveLength(1);
    expect(
      reportSchema.parse({
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        targetType: 'ORDER',
        targetId: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        reason: 'FRAUD',
        text: null,
        status: 'OPEN',
        faultSide: null,
        createdAt: now,
        resolvedAt: null,
      }).status,
    ).toBe('OPEN');
    expect(
      trustSignalsSchema.parse({
        completedAsSeller: 1,
        completedAsBuyer: 3,
        buyerStrikes: 0,
        sellerFaultFailures: 0,
        upheldReportsAgainst: 0,
        memberSince: now,
        emailVerified: true,
      }).completedAsBuyer,
    ).toBe(3);
  });
});

describe('commerce error codes and listing enums', () => {
  it('publishes the commerce error codes', () => {
    for (const code of [
      'BID_ALREADY_LEADING',
      'BID_AMOUNT_INVALID',
      'BUYER_ORDER_LIMIT',
      'BUYER_BLOCKED',
      'BUYER_CONTACTS_REQUIRED',
      'IDEMPOTENCY_KEY_REUSED',
      'ORDER_TRANSITION_NOT_ALLOWED',
      'PRODUCT_IN_SALE',
      'PRODUCT_ALREADY_SOLD',
      'NO_NEXT_BIDDER',
      'DEAL_RULES_NOT_ACCEPTED',
    ]) {
      expect(apiErrorCodeSchema.safeParse(code).success).toBe(true);
    }
  });

  it('matches the commerce listing and order statuses', () => {
    expect([...LISTING_TYPES]).toEqual(['FIXED', 'AUCTION']);
    expect([...LISTING_STATUSES]).toEqual([
      'SCHEDULED',
      'LIVE',
      'ENDED',
      'CANCELLED',
    ]);
    expect([...ORDER_STATUSES]).toEqual([
      'OFFERED',
      'ACTIVE',
      'COMPLETED',
      'FAILED',
    ]);
  });
});

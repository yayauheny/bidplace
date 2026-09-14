import { describe, expect, it } from 'vitest';
import {
  activityStatusSchema,
  adminProductStatusUpdateRequestSchema,
  adminSellerStatusUpdateRequestSchema,
  ApiErrorCode,
  apiErrorResponseSchema,
  bidCreateRequestSchema,
  isEditableProductStatus,
  listingCreateRequestSchema,
  listingStatusSchema,
  productWriteRequestSchema,
  publicDiscoveryQuerySchema,
  publicProductSchema,
  publicSellerQuerySchema,
  portfolioWorksQuerySchema,
  portfolioWorkDetailResponseSchema,
  portfolioAuthorApplicationResponseSchema,
  portfolioDiscoveryFacetsResponseSchema,
  realtimeEventPayloadSchema,
  sellerOrderListQuerySchema,
  sellerOrderResponseSchema,
  sellerProductDetailResponseSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileUpdateRequestSchema,
} from '../src';

describe('shared contracts', () => {
  it('keeps discovery facets strict, non-empty, and normalized', () => {
    expect(
      portfolioDiscoveryFacetsResponseSchema.parse({
        materials: [' Холст '],
        cities: ['Минск'],
        tags: ['Живопись'],
      }),
    ).toEqual({
      materials: ['Холст'],
      cities: ['Минск'],
      tags: ['Живопись'],
    });
    expect(
      portfolioDiscoveryFacetsResponseSchema.safeParse({
        materials: [''],
        cities: [],
        tags: [],
      }).success,
    ).toBe(false);
    expect(
      portfolioDiscoveryFacetsResponseSchema.safeParse({
        materials: [],
        cities: [],
        tags: [],
        privateTag: ['draft'],
      }).success,
    ).toBe(false);
  });

  it('keeps portfolio public work responses free of commerce fields', () => {
    const work = {
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      publicId: 'portfolio01',
      title: 'Work',
      story: null,
      categoryId: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      technique: null,
      materials: null,
      dimensions: null,
      year: null,
      images: [
        {
          id: '4c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          position: 0,
          url: '/api/images/4c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          mimeType: 'image/jpeg',
          byteLength: 1,
          checksum: 'a'.repeat(64),
          width: 1,
          height: 1,
        },
      ],
      publishedAt: '2026-09-08T00:00:00.000Z',
    };
    const author = {
      id: '5c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      slug: 'author',
      fullName: 'Author',
      country: 'Belarus',
      discipline: 'Painting',
      profilePhotoUrl: '/api/sellers/author/photo',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Bio',
    };

    expect(
      portfolioWorkDetailResponseSchema.safeParse({
        work: { ...work, listing: null },
        author,
        relatedWorks: [],
      }).success,
    ).toBe(false);
  });

  it('accepts only portfolio newest or oldest work sorting', () => {
    expect(portfolioWorksQuerySchema.parse({ sort: 'oldest' }).sort).toBe(
      'oldest',
    );
    expect(
      portfolioWorksQuerySchema.safeParse({ sort: 'priceAsc' }).success,
    ).toBe(false);
  });

  it('keeps author application projections free of private handoff data', () => {
    expect(
      portfolioAuthorApplicationResponseSchema.safeParse({
        application: {
          slug: 'author',
          fullName: 'Author',
          country: 'Belarus',
          discipline: 'Painting',
          shortDescription: 'Bio',
          status: 'PENDING_REVIEW',
          handoffContactValue: '@private_contact',
        },
      }).success,
    ).toBe(false);
  });

  it('exposes contacted and failed-handoff buyer activity statuses', () => {
    expect(activityStatusSchema.safeParse('CONTACTED').success).toBe(true);
    expect(activityStatusSchema.safeParse('HANDOFF_FAILED').success).toBe(true);
    expect(activityStatusSchema.safeParse('AUCTION_CANCELLED').success).toBe(
      true,
    );
    expect(activityStatusSchema.safeParse('PENDING_CONTACT').success).toBe(
      false,
    );
  });

  it('accepts a draft Product without art-only fields', () => {
    expect(
      productWriteRequestSchema.safeParse({ title: 'Personal item' }).success,
    ).toBe(true);
  });
  it('keeps condition and packaging optional for public creator Products', () => {
    expect(publicProductSchema.shape.condition.safeParse(null).success).toBe(
      true,
    );
    expect(publicProductSchema.shape.packaging.safeParse(null).success).toBe(
      true,
    );
  });
  it('accepts an auction Listing only in BYN through server-owned currency', () => {
    expect(
      listingCreateRequestSchema.safeParse({
        startPrice: 10,
        startsAt: '2026-07-20T10:00:00.000Z',
        endsAt: '2026-07-20T11:00:00.000Z',
      }).success,
    ).toBe(true);
  });
  it('rejects an invalid Listing timeframe', () => {
    expect(
      listingCreateRequestSchema.safeParse({
        startPrice: 10,
        startsAt: '2026-07-20T11:00:00.000Z',
        endsAt: '2026-07-20T10:00:00.000Z',
      }).success,
    ).toBe(false);
  });
  it('accepts a bid amount but not client-owned Listing values', () => {
    expect(bidCreateRequestSchema.safeParse({ amount: 15 }).success).toBe(true);
    expect(
      bidCreateRequestSchema.safeParse({ amount: 15, currency: 'USD' }).success,
    ).toBe(false);
  });
  it('exposes listing realtime names without reserve or PII fields', () => {
    expect(
      realtimeEventPayloadSchema.safeParse({
        event: 'listing.updated',
        payload: {
          listingId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          currentPrice: 20,
          bidCount: 1,
          status: 'LIVE',
          endsAt: '2026-07-20T11:00:00.000Z',
        },
      }).success,
    ).toBe(true);
    expect(listingStatusSchema.safeParse('active').success).toBe(false);
  });
  it('requires a reason for limiting admin actions', () => {
    expect(
      adminSellerStatusUpdateRequestSchema.safeParse({ status: 'SUSPENDED' })
        .success,
    ).toBe(false);
    expect(
      adminProductStatusUpdateRequestSchema.safeParse({
        status: 'CHANGES_REQUESTED',
      }).success,
    ).toBe(false);
    expect(
      adminSellerStatusUpdateRequestSchema.safeParse({ status: 'APPROVED' })
        .success,
    ).toBe(true);
  });
  it('normalizes optional discovery pagination and trims search text', () => {
    expect(
      publicDiscoveryQuerySchema.parse({
        q: '  ceramic  ',
        author: '  marina  ',
        limit: '12',
        materials: ' clay, wood ',
        uniqueness: '  One  ',
        priceMin: '500',
      }),
    ).toEqual({
      page: 1,
      limit: 12,
      q: 'ceramic',
      author: 'marina',
      materials: ['clay', 'wood'],
      uniqueness: 'One',
      priceMin: 500,
      sort: 'newest',
    });
  });
  it('rejects invalid discovery ranges and unknown keys', () => {
    expect(publicDiscoveryQuerySchema.safeParse({ page: 0 }).success).toBe(
      false,
    );
    expect(publicDiscoveryQuerySchema.safeParse({ limit: 101 }).success).toBe(
      false,
    );
    expect(
      publicDiscoveryQuerySchema.safeParse({ extra: 'value' }).success,
    ).toBe(false);
    expect(publicDiscoveryQuerySchema.safeParse({ q: '   ' }).success).toBe(
      false,
    );
    expect(
      publicDiscoveryQuerySchema.safeParse({ q: 'a'.repeat(121) }).success,
    ).toBe(false);
    expect(
      publicDiscoveryQuerySchema.safeParse({ priceMin: 20, priceMax: 10 })
        .success,
    ).toBe(false);
    expect(
      publicDiscoveryQuerySchema.safeParse({ yearFrom: 2024, yearTo: 2020 })
        .success,
    ).toBe(false);
  });

  it('accepts only supported public seller query parameters', () => {
    expect(
      publicSellerQuerySchema.parse({ q: '  author  ', sort: 'name' }),
    ).toEqual({
      page: 1,
      limit: 20,
      q: 'author',
      sort: 'name',
    });
    expect(publicSellerQuerySchema.safeParse({ status: 'LIVE' }).success).toBe(
      false,
    );
  });

  it('keeps discipline validation aligned with the VARCHAR(160) column', () => {
    const base = {
      slug: 'creator',
      sellerType: 'creator' as const,
      discipline: 'Керамика',
      fullName: 'Creator',
      country: 'BY',
      city: 'Minsk',
      socialLink: 'https://example.com/creator',
      shortDescription: 'About creator',
      handoffContactType: 'TELEGRAM' as const,
      handoffContactValue: '@creator_name',
    };

    expect(sellerProfileCreateRequestSchema.safeParse(base).success).toBe(true);
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        ...base,
        socialLink: undefined,
      }).success,
    ).toBe(true);
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        ...base,
        socialLink: null,
      }).success,
    ).toBe(true);
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        ...base,
        city: undefined,
      }).success,
    ).toBe(false);
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        ...base,
        city: '',
      }).success,
    ).toBe(false);
    expect(
      sellerProfileUpdateRequestSchema.safeParse({
        discipline: 'a'.repeat(161),
      }).success,
    ).toBe(false);
  });

  it.each([
    ['https://example.com/creator', true],
    ['https://t.me/creator_name', true],
    ['http://example.com/creator', false],
    ['javascript:alert(1)', false],
    ['data:text/html,hi', false],
    ['file:///etc/passwd', false],
    ['/relative/path', false],
    ['ftp://example.com/file', false],
  ])('accepts only HTTPS public seller URLs: %s', (socialLink, expected) => {
    const parsed = sellerProfileCreateRequestSchema.safeParse({
      slug: 'creator',
      sellerType: 'creator',
      discipline: 'Керамика',
      fullName: 'Creator',
      country: 'BY',
      city: 'Minsk',
      socialLink,
      shortDescription: 'About creator',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@creator_name',
    });
    expect(parsed.success).toBe(expected);
  });

  it('accepts each structured public link independently and rejects empty strings', () => {
    const base = {
      slug: 'creator',
      sellerType: 'creator' as const,
      discipline: 'Керамика',
      fullName: 'Creator',
      country: 'BY',
      city: 'Minsk',
      shortDescription: 'About creator',
      handoffContactType: 'TELEGRAM' as const,
      handoffContactValue: '@creator_name',
    };

    expect(
      sellerProfileCreateRequestSchema.safeParse({
        ...base,
        telegramUrl: 'https://t.me/creator_name',
      }).success,
    ).toBe(true);
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        ...base,
        instagramUrl: 'https://instagram.com/creator',
      }).success,
    ).toBe(true);
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        ...base,
        websiteUrl: 'https://creator.example.com',
      }).success,
    ).toBe(true);
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        ...base,
        socialLink: '',
      }).success,
    ).toBe(false);
  });

  it('still accepts Telegram and Instagram handle forms on private handoff', () => {
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        slug: 'creator',
        sellerType: 'creator',
        discipline: 'Керамика',
        fullName: 'Creator',
        country: 'BY',
        city: 'Minsk',
        socialLink: 'https://example.com/creator',
        shortDescription: 'About creator',
        handoffContactType: 'TELEGRAM',
        handoffContactValue: '@creator_name',
      }).success,
    ).toBe(true);
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        slug: 'creator',
        sellerType: 'creator',
        discipline: 'Керамика',
        fullName: 'Creator',
        country: 'BY',
        city: 'Minsk',
        socialLink: 'https://example.com/creator',
        shortDescription: 'About creator',
        handoffContactType: 'INSTAGRAM',
        handoffContactValue: '@creator.name',
      }).success,
    ).toBe(true);
  });

  it('accepts unified API errors with business codes and optional details', () => {
    expect(
      apiErrorResponseSchema.safeParse({
        status: 400,
        code: ApiErrorCode.BID_TOO_LOW,
        message: 'Bid must be at least 11.50',
        details: { minimumBid: '11.50' },
      }).success,
    ).toBe(true);
    expect(
      apiErrorResponseSchema.safeParse({
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Request validation failed',
        details: {
          formErrors: [],
          fieldErrors: { amount: ['Required'] },
        },
      }).success,
    ).toBe(true);
    expect(
      apiErrorResponseSchema.safeParse({
        status: 500,
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      }).success,
    ).toBe(true);
    expect(
      apiErrorResponseSchema.safeParse({
        status: 400,
        code: 'UNKNOWN_CODE',
        message: 'nope',
      }).success,
    ).toBe(false);
  });
  it('treats rejected products as owner-editable without opening approved or live states', () => {
    expect(isEditableProductStatus('DRAFT')).toBe(true);
    expect(isEditableProductStatus('CHANGES_REQUESTED')).toBe(true);
    expect(isEditableProductStatus('REJECTED')).toBe(true);
    expect(isEditableProductStatus('PENDING_REVIEW')).toBe(false);
    expect(isEditableProductStatus('APPROVED')).toBe(false);
    expect(isEditableProductStatus('ARCHIVED')).toBe(false);
  });
  it('requires lastModerationReason on owner product detail', () => {
    expect(
      sellerProductDetailResponseSchema.shape.lastModerationReason.safeParse(
        null,
      ).success,
    ).toBe(true);
    expect(
      sellerProductDetailResponseSchema.shape.lastModerationReason.safeParse(
        'Добавьте подтверждение происхождения',
      ).success,
    ).toBe(true);
    expect(
      sellerProductDetailResponseSchema.safeParse({
        product: {},
        creationIntro: null,
        creationSteps: [],
      }).success,
    ).toBe(false);
  });

  it('requires frozen currency on Order projections', () => {
    const base = {
      order: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        publicId: 'orderPub001',
        listingId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        finalAmount: 120,
        contactDueAt: '2026-07-19T00:00:00.000Z',
        status: 'PENDING_CONTACT' as const,
        cancellationReason: null,
        createdAt: '2026-07-18T00:00:00.000Z',
        updatedAt: '2026-07-18T00:00:00.000Z',
      },
      productSummary: { publicId: 'product0011', title: 'Work' },
      buyerEmailAtClose: 'buyer@example.com',
    };
    expect(sellerOrderResponseSchema.safeParse(base).success).toBe(false);
    expect(
      sellerOrderResponseSchema.safeParse({
        ...base,
        order: { ...base.order, currency: 'BYN' },
      }).success,
    ).toBe(true);
  });

  it('paginates seller Order inbox without a client-supplied sellerId', () => {
    expect(sellerOrderListQuerySchema.parse({ limit: '10' })).toEqual({
      page: 1,
      limit: 10,
    });
    expect(
      sellerOrderListQuerySchema.safeParse({ sellerId: 'seller-id' }).success,
    ).toBe(false);
    expect(sellerOrderListQuerySchema.safeParse({ limit: 101 }).success).toBe(
      false,
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  adminProductStatusUpdateRequestSchema,
  adminSellerStatusUpdateRequestSchema,
  ANALYTICS_EVENT_NAMES,
  analyticsIngestRequestSchema,
  ApiErrorCode,
  apiErrorResponseSchema,
  isEditableProductStatus,
  listingStatusSchema,
  productWriteRequestSchema,
  portfolioAuthorsQuerySchema,
  portfolioWorksQuerySchema,
  portfolioWorkDetailResponseSchema,
  portfolioAuthorApplicationResponseSchema,
  sellerProductDetailResponseSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileUpdateRequestSchema,
} from '../src';

describe('shared contracts', () => {
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
      uniqueness: null,
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

    const publicWork = {
      ...work,
      sharePath: '/works/portfolio01',
    };
    const publicAuthor = {
      ...author,
      city: 'Minsk',
      practice: null,
      achievements: [],
      sharePath: '/authors/author',
    };
    expect(
      portfolioWorkDetailResponseSchema.parse({
        work: publicWork,
        author: publicAuthor,
        relatedWorks: [],
      }).work.uniqueness,
    ).toBeNull();
    expect(
      portfolioWorkDetailResponseSchema.parse({
        work: { ...publicWork, uniqueness: 'Единственный экземпляр' },
        author: publicAuthor,
        relatedWorks: [],
      }).work.uniqueness,
    ).toBe('Единственный экземпляр');
    expect(
      portfolioWorkDetailResponseSchema.safeParse({
        work: { ...publicWork, uniqueness: '' },
        author: publicAuthor,
        relatedWorks: [],
      }).success,
    ).toBe(false);
    expect(
      portfolioWorkDetailResponseSchema.parse({
        work: publicWork,
        author: publicAuthor,
        relatedWorks: [],
      }).work.sharePath,
    ).toBe('/works/portfolio01');
    expect(
      portfolioWorkDetailResponseSchema.safeParse({
        work,
        author: publicAuthor,
        relatedWorks: [],
      }).success,
    ).toBe(false);
  });

  it('keeps portfolio DTOs free of listing, price, bid and order keys', () => {
    const publicWork = {
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      publicId: 'portfolio01',
      title: 'Work',
      story: null,
      categoryId: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      technique: null,
      materials: null,
      dimensions: null,
      year: null,
      uniqueness: null,
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
      sharePath: '/works/portfolio01',
    };
    const publicAuthor = {
      id: '5c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      slug: 'author',
      fullName: 'Author',
      country: 'Belarus',
      city: 'Minsk',
      discipline: 'Painting',
      practice: null,
      profilePhotoUrl: '/api/sellers/author/photo',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Bio',
      achievements: [],
      sharePath: '/authors/author',
    };
    const detail = portfolioWorkDetailResponseSchema.parse({
      work: publicWork,
      author: publicAuthor,
      relatedWorks: [],
    });
    const commerceKey = /"(listing|listings|bid|bids|order|orders|startPrice|currentPrice|priceMin|priceMax)"/;
    expect(JSON.stringify(detail)).not.toMatch(commerceKey);
    expect(
      portfolioWorkDetailResponseSchema.safeParse({
        work: { ...publicWork, listing: null, currentPrice: 10 },
        author: publicAuthor,
        relatedWorks: [],
      }).success,
    ).toBe(false);
    expect(
      portfolioWorksQuerySchema.safeParse({ sort: 'priceDesc' }).success,
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

  it('accepts a draft Product without art-only fields', () => {
    expect(
      productWriteRequestSchema.safeParse({ title: 'Personal item' }).success,
    ).toBe(true);
  });
  it('keeps Prisma listing status enums until P4', () => {
    expect(listingStatusSchema.safeParse('LIVE').success).toBe(true);
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
  it('accepts only supported portfolio author query parameters', () => {
    expect(
      portfolioAuthorsQuerySchema.parse({ q: '  author  ', sort: 'name' }),
    ).toEqual({
      page: 1,
      limit: 20,
      q: 'author',
      sort: 'name',
    });
    expect(
      portfolioAuthorsQuerySchema.safeParse({ status: 'LIVE' }).success,
    ).toBe(false);
    expect(
      portfolioAuthorsQuerySchema.safeParse({ sort: 'activity' }).success,
    ).toBe(false);
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
        city: undefined,
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
  it('accepts work_viewed ingest and rejects leftover commerce event names', () => {
    const anonymousId = '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1';
    const listingId = '6c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1';
    expect([...ANALYTICS_EVENT_NAMES].sort()).toEqual([
      'registration_started',
      'seller_viewed',
      'work_viewed',
    ]);
    expect(
      analyticsIngestRequestSchema.safeParse({
        anonymousId,
        environment: 'test',
        events: [
          {
            name: 'work_viewed',
            properties: { productPublicId: 'portfolio01' },
          },
        ],
      }).success,
    ).toBe(true);
    const formerCommercePayloads = [
      {
        name: 'listing_viewed',
        properties: { productPublicId: 'portfolio01', listingId },
      },
      {
        name: 'bid_cta_clicked',
        properties: { listingId, productPublicId: 'portfolio01' },
      },
      {
        name: 'bid_rejected',
        properties: {
          listingId,
          productPublicId: 'portfolio01',
          errorCode: 'bid_below_minimum',
        },
      },
    ] as const;
    for (const event of formerCommercePayloads) {
      expect(
        analyticsIngestRequestSchema.safeParse({
          anonymousId,
          environment: 'test',
          events: [event],
        }).success,
      ).toBe(false);
    }
  });
});

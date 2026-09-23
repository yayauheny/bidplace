import { describe, expect, it } from 'vitest';
import {
  adminProductStatusUpdateRequestSchema,
  adminSellerStatusUpdateRequestSchema,
  acceptRulesResponseSchema,
  ApiErrorCode,
  apiErrorResponseSchema,
  isEditableProductStatus,
  listingStatusSchema,
  productWriteRequestSchema,
  publicProductSchema,
  portfolioWorksQuerySchema,
  portfolioWorkDetailResponseSchema,
  portfolioHomeResponseSchema,
  portfolioWorkListItemSchema,
  portfolioAuthorApplicationResponseSchema,
  portfolioDiscoveryFacetsResponseSchema,
  adminCuratorSelectionRequestSchema,
  sellerProductDetailResponseSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileUpdateRequestSchema,
  slugSchema,
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

  it('uses the authenticated user response for rules acceptance', () => {
    const user = {
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      phone: '+375291234567',
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      acceptedRulesVersion: 'MVP_RULES_V1',
      displayName: 'Seller',
      role: 'user',
      status: 'active',
      createdAt: '2026-09-23T00:00:00.000Z',
      updatedAt: '2026-09-23T00:00:00.000Z',
    };

    expect(acceptRulesResponseSchema.parse({ user })).toEqual({ user });
    expect(acceptRulesResponseSchema.safeParse({ ok: true }).success).toBe(
      false,
    );
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

  it('keeps curator note on the home selection, not catalog work items', () => {
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
      sharePath: '/works/portfolio01',
    };
    const author = {
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
      biography: null,
      shortDescription: 'Bio',
      achievements: [],
      sharePath: '/authors/author',
    };
    const curator = {
      ...author,
      id: '6c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      slug: 'vex',
      sharePath: '/authors/vex',
      profilePhotoUrl: '/api/sellers/vex/photo',
    };
    const openingWork = { ...work, author };

    expect(
      portfolioWorkListItemSchema.safeParse({ work, author, note: 'x' })
        .success,
    ).toBe(false);
    expect(
      portfolioHomeResponseSchema.safeParse({
        curatorSelection: { work, author, note: null },
        newWorks: [],
        newAuthors: [],
      }).success,
    ).toBe(false);
    expect(
      portfolioHomeResponseSchema.parse({
        curatorSelection: { curator, work: openingWork, note: null },
        newWorks: [],
        newAuthors: [],
      }).curatorSelection?.note,
    ).toBeNull();
    expect(
      portfolioHomeResponseSchema.parse({
        curatorSelection: {
          curator,
          work: openingWork,
          note: ' Главная визуальная находка этой недели. ',
        },
        newWorks: [],
        newAuthors: [],
      }).curatorSelection,
    ).toMatchObject({
      curator: { slug: 'vex' },
      work: { author: { slug: 'author' } },
      note: 'Главная визуальная находка этой недели.',
    });
    expect(
      adminCuratorSelectionRequestSchema.safeParse({
        publicId: 'portfolio01',
        note: null,
      }).success,
    ).toBe(false);
    expect(
      adminCuratorSelectionRequestSchema.parse({
        publicId: 'portfolio01',
        curatorSlug: 'bala_klava',
        note: null,
      }),
    ).toEqual({
      publicId: 'portfolio01',
      curatorSlug: 'bala_klava',
      note: null,
    });
    expect(slugSchema.safeParse('bala_klava').success).toBe(true);
    expect(slugSchema.safeParse('bala__klava').success).toBe(false);
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
  it('keeps condition and packaging optional for public creator Products', () => {
    expect(publicProductSchema.shape.condition.safeParse(null).success).toBe(
      true,
    );
    expect(publicProductSchema.shape.packaging.safeParse(null).success).toBe(
      true,
    );
  });
  it('rejects an unknown listing leftover status', () => {
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
        status: 500,
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
        requestId: 'req-123',
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
    expect(
      sellerProductDetailResponseSchema.shape.editingRevision.safeParse({
        id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
        version: 2,
        status: 'DRAFT',
        updatedAt: '2026-09-22T10:00:00.000Z',
      }).success,
    ).toBe(true);
    expect(
      sellerProductDetailResponseSchema.shape.editingRevision.safeParse(null)
        .success,
    ).toBe(true);
  });
});

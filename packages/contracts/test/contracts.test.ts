import { describe, expect, it } from 'vitest';
import {
  adminProductStatusUpdateRequestSchema,
  adminSellerStatusUpdateRequestSchema,
  acceptRulesResponseSchema,
  emailOtpRequestSchema,
  emailOtpVerifyRequestSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  registrationEmailRequestSchema,
  claimSlugRequestSchema,
  claimSlugResponseSchema,
  newAccountSlugSchema,
  ApiErrorCode,
  apiErrorResponseSchema,
  isCountryCode,
  isEditableProductStatus,
  listCountries,
  listingStatusSchema,
  normalizeCatalogName,
  productWriteRequestSchema,
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

const registrationLegal = {
  agreement: { version: 'portfolio-legal-2026-10-12', confirmed: true },
  privacy: { version: 'portfolio-legal-2026-10-12', confirmed: true },
  dataConsent: { version: 'portfolio-legal-2026-10-12', confirmed: true },
  age18Confirmed: true,
};

describe('shared contracts', () => {
  it.each(['PRODUCT_STATE_CONFLICT', 'PRODUCT_IN_SALE'])(
    'accepts public %s errors',
    (code) => {
      expect(
        apiErrorResponseSchema.parse({
          status: 409,
          code,
          message: 'Product conflict',
        }),
      ).toMatchObject({ code, status: 409 });
    },
  );

  it.each([2, 3, 20, 21, 121])(
    'validates %i-character new nicknames at every write boundary',
    (length) => {
      const slug = 'a'.repeat(length);
      const valid = length >= 3 && length <= 20;
      expect(newAccountSlugSchema.safeParse(slug).success).toBe(valid);
      expect(
        registerRequestSchema.safeParse({
          email: 'author@example.com',
          password: 'password123',
          slug,
          legal: registrationLegal,
        }).success,
      ).toBe(valid);
      expect(claimSlugRequestSchema.safeParse({ slug }).success).toBe(valid);
    },
  );

  it.each(['ab', 'a'.repeat(120)])(
    'reads a historical nickname %s without applying new-choice limits',
    (slug) => {
      expect(claimSlugResponseSchema.parse({ slug })).toEqual({ slug });
    },
  );

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
      slug: 'a'.repeat(120),
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
      publicEmail: null,
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

  it('accepts draft and submitted application revisions with their hydration token', () => {
    for (const status of ['DRAFT', 'PENDING_REVIEW'] as const) {
      expect(
        portfolioAuthorApplicationResponseSchema.safeParse({
          application: {
            slug: 'author',
            fullName: 'Author',
            country: 'Belarus',
            city: 'Minsk',
            discipline: 'Painting',
            practice: null,
            shortDescription: 'Bio',
            status,
            applicationStage: status === 'DRAFT' ? 'CONTACTS' : null,
          },
          editingRevision: {
            id: '0a0d82a1-0317-49eb-904f-a8bc87d311a5',
            version: 1,
            status,
            updatedAt: '2026-09-23T00:00:00.000Z',
          },
          achievements: [],
        }).success,
      ).toBe(true);
    }
  });

  it('reads partial editing applications independently from the published parent status', () => {
    const draft = {
      application: {
        slug: 'author',
        fullName: 'Author',
        country: 'Belarus',
        city: 'Minsk',
        discipline: null,
        practice: null,
        shortDescription: null,
        status: 'DRAFT',
        applicationStage: 'CONTACTS',
      },
      editingRevision: null,
      achievements: [],
    };

    expect(
      portfolioAuthorApplicationResponseSchema.safeParse(draft).success,
    ).toBe(true);
    expect(
      portfolioAuthorApplicationResponseSchema.safeParse({
        ...draft,
        application: { ...draft.application, status: 'APPROVED' },
        editingRevision: {
          id: '22222222-2222-4222-8222-222222222222',
          version: 2,
          status: 'DRAFT',
          updatedAt: '2026-10-12T00:00:00.000Z',
        },
      }).success,
    ).toBe(true);
  });

  it('normalizes public email and rejects impossible achievement calendar dates', () => {
    expect(
      sellerProfileCreateRequestSchema.parse({
        fullName: 'Author',
        country: 'BY',
        city: 'Minsk',
        publicEmail: ' AUTHOR@EXAMPLE.COM ',
      }).publicEmail,
    ).toBe('author@example.com');
    expect(
      portfolioAuthorApplicationResponseSchema.safeParse({
        application: {
          slug: 'author',
          fullName: 'Author',
          country: 'Belarus',
          city: 'Minsk',
          discipline: 'Painting',
          practice: null,
          shortDescription: 'Bio',
          status: 'PENDING_REVIEW',
          applicationStage: null,
        },
        editingRevision: null,
        achievements: [
          {
            id: '0a0d82a1-0317-49eb-904f-a8bc87d311a5',
            occurredDate: { year: 2025, month: 2, day: 29 },
            body: 'Exhibition',
            image: null,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('accepts a draft Product without art-only fields', () => {
    expect(
      productWriteRequestSchema.safeParse({ title: 'Personal item' }).success,
    ).toBe(true);
    expect(
      productWriteRequestSchema.safeParse({ materials: 'Clay' }).success,
    ).toBe(false);
    expect(
      productWriteRequestSchema.safeParse({ technique: 'Oil' }).success,
    ).toBe(false);
    expect(normalizeCatalogName('Ⅰ')).toBe(normalizeCatalogName('I'));
    expect(normalizeCatalogName('  ХОЛСТ  ')).toBe('холст');
  });
  it('rejects an unknown listing leftover status', () => {
    expect(listingStatusSchema.safeParse('active').success).toBe(false);
  });
  it('requires a reason and an explicit target for limiting admin actions', () => {
    const sellerParent = {
      kind: 'parent' as const,
      status: 'APPROVED' as const,
      updatedAt: '2026-09-26T12:00:00.000Z',
    };
    const productParent = {
      kind: 'parent' as const,
      status: 'APPROVED' as const,
      updatedAt: '2026-09-26T12:00:00.000Z',
    };
    expect(
      adminSellerStatusUpdateRequestSchema.safeParse({
        status: 'SUSPENDED',
        target: sellerParent,
      }).success,
    ).toBe(false);
    expect(
      adminProductStatusUpdateRequestSchema.safeParse({
        status: 'CHANGES_REQUESTED',
        target: productParent,
      }).success,
    ).toBe(false);
    expect(
      adminSellerStatusUpdateRequestSchema.safeParse({ status: 'APPROVED' })
        .success,
    ).toBe(false);
    expect(
      adminSellerStatusUpdateRequestSchema.safeParse({
        status: 'APPROVED',
        target: sellerParent,
      }).success,
    ).toBe(true);
  });
  it('accepts only the country picker list', () => {
    const listed = listCountries();
    expect(listed.length).toBeGreaterThan(200);
    expect(listed.every((country) => isCountryCode(country.code))).toBe(true);
    expect(isCountryCode('BY')).toBe(true);
    expect(isCountryCode('GB')).toBe(true);
    expect(isCountryCode('EU')).toBe(false);
    expect(isCountryCode('UN')).toBe(false);
    expect(isCountryCode('UK')).toBe(false);
    expect(isCountryCode('Belarus')).toBe(false);
  });

  it('keeps discipline validation aligned with the VARCHAR(160) column', () => {
    const base = {
      discipline: 'Керамика',
      fullName: 'Creator',
      country: 'BY',
      city: 'Minsk',
      socialLink: 'https://example.com/creator',
      shortDescription: 'About creator',
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
    ).toBe(true);
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
      discipline: 'Керамика',
      fullName: 'Creator',
      country: 'BY',
      city: 'Minsk',
      socialLink,
      shortDescription: 'About creator',
    });
    expect(parsed.success).toBe(expected);
  });

  it('accepts each structured public link independently and rejects empty strings', () => {
    const base = {
      discipline: 'Керамика',
      fullName: 'Creator',
      country: 'BY',
      city: 'Minsk',
      shortDescription: 'About creator',
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

  it('rejects future-commerce handoff fields in author creation', () => {
    expect(
      sellerProfileCreateRequestSchema.safeParse({
        discipline: 'Керамика',
        fullName: 'Creator',
        country: 'BY',
        city: 'Minsk',
        socialLink: 'https://example.com/creator',
        shortDescription: 'About creator',
        handoffContactType: 'TELEGRAM',
        handoffContactValue: '@creator_name',
      }).success,
    ).toBe(false);
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

const proof = 'synthetic-turnstile-proof';
const key = 'idem-key-1';

describe('auth challenge requests', () => {
  it('requires a Turnstile proof and idempotency key on OTP send, OTP verify, and forgot password', () => {
    expect(emailOtpRequestSchema.safeParse({}).success).toBe(false);
    expect(
      emailOtpRequestSchema.safeParse({ idempotencyKey: key }).success,
    ).toBe(false);
    expect(
      emailOtpRequestSchema.safeParse({ turnstileToken: proof }).success,
    ).toBe(false);
    expect(
      emailOtpRequestSchema.safeParse({
        idempotencyKey: 'short',
        turnstileToken: proof,
      }).success,
    ).toBe(false);
    expect(
      emailOtpRequestSchema.safeParse({
        idempotencyKey: key,
        turnstileToken: '',
      }).success,
    ).toBe(false);
    expect(
      emailOtpRequestSchema.parse({
        idempotencyKey: key,
        turnstileToken: proof,
      }),
    ).toEqual({
      idempotencyKey: key,
      turnstileToken: proof,
    });

    expect(
      emailOtpVerifyRequestSchema.safeParse({ code: '123456' }).success,
    ).toBe(false);
    expect(
      emailOtpVerifyRequestSchema.safeParse({
        code: '123456',
        idempotencyKey: 'short',
      }).success,
    ).toBe(false);
    expect(
      emailOtpVerifyRequestSchema.parse({
        code: '123456',
        idempotencyKey: key,
      }),
    ).toEqual({
      code: '123456',
      idempotencyKey: key,
    });

    expect(
      forgotPasswordRequestSchema.safeParse({ email: 'author@example.com' })
        .success,
    ).toBe(false);
    expect(
      forgotPasswordRequestSchema.safeParse({
        email: 'author@example.com',
        idempotencyKey: key,
      }).success,
    ).toBe(false);
    expect(
      forgotPasswordRequestSchema.safeParse({
        email: 'author@example.com',
        turnstileToken: proof,
      }).success,
    ).toBe(false);
    expect(
      forgotPasswordRequestSchema.parse({
        email: 'Author@Example.com',
        idempotencyKey: key,
        turnstileToken: proof,
      }),
    ).toEqual({
      email: 'author@example.com',
      idempotencyKey: key,
      turnstileToken: proof,
    });
  });

  it('requires proof on registration email send and keeps it optional for password login', () => {
    expect(
      registerRequestSchema.safeParse({
        email: 'author@example.com',
        password: 'password123',
        slug: 'author',
      }).success,
    ).toBe(false);
    expect(registrationEmailRequestSchema.safeParse({ email: 'author@example.com', idempotencyKey: key }).success).toBe(false);
    expect(registrationEmailRequestSchema.parse({ email: 'author@example.com', idempotencyKey: key, turnstileToken: proof }).turnstileToken).toBe(proof);
    expect(registerRequestSchema.parse({
      email: 'author@example.com', password: 'password123', slug: 'author', legal: registrationLegal,
    })).not.toHaveProperty('turnstileToken');

    expect(registerRequestSchema.safeParse({
      email: 'author@example.com',
      password: 'password123',
      slug: 'author',
      legal: { ...registrationLegal, age18Confirmed: false },
    }).success).toBe(false);
    expect(registerRequestSchema.safeParse({
      email: 'author@example.com',
      password: 'password123',
      slug: 'author',
      legal: { ...registrationLegal, dataConsent: { version: registrationLegal.dataConsent.version, confirmed: false } },
    }).success).toBe(false);

    const login = { email: 'author@example.com', password: 'password123' };
    expect(loginRequestSchema.parse(login)).toEqual(login);
    expect(
      loginRequestSchema.parse({ ...login, turnstileToken: proof })
        .turnstileToken,
    ).toBe(proof);
    expect(
      loginRequestSchema.safeParse({ ...login, turnstileToken: '' }).success,
    ).toBe(false);
  });
});

it('bounds new analytics windows and forbids raw paths, identities and timestamps', async () => {
  const { analyticsFoundationQuerySchema, webAnalyticsRequestSchema } =
    await import('../src/analytics');
  expect(
    analyticsFoundationQuerySchema.safeParse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2027-01-01T00:00:00.000Z',
    }).success,
  ).toBe(false);
  for (const payload of [
    {
      events: [
        {
          eventId: '00000000-0000-4000-8000-000000000001',
          page: { page: 'home', url: '/?q=private' },
        },
      ],
    },
    { events: [], environment: 'production' },
    {
      events: [
        {
          eventId: '00000000-0000-4000-8000-000000000001',
          page: { page: 'author', slug: 'x'.repeat(121) },
        },
      ],
    },
  ])
    expect(webAnalyticsRequestSchema.safeParse(payload).success).toBe(false);
});

import { describe, expect, it } from 'vitest';

import {
  ADMIN_MODERATION_DEFAULT_LIMIT,
  ADMIN_MODERATION_MAX_LIMIT,
  adminModerationListQuerySchema,
  adminProductStatusUpdateRequestSchema,
  adminProductsResponseSchema,
  adminSellerProfileSchema,
  adminSellerProfilesResponseSchema,
  adminSellerStatusUpdateRequestSchema,
  encodeAdminModerationCursor,
} from '../src/admin';

const updatedAt = '2026-09-26T12:00:00.000Z';
const sellerId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000004';
const revisionId = '00000000-0000-4000-8000-000000000005';

const sellerContent = {
  slug: 'author',
  fullName: 'Author',
  discipline: 'Керамика',
  country: 'BY',
  city: 'Minsk',
  practice: null,
  biography: null,
  socialLink: null,
  telegramUrl: null,
  instagramUrl: null,
  websiteUrl: null,
  publicEmail: null,
  shortDescription: 'About',
};

describe('admin moderation contracts', () => {
  it('requires an explicit moderation target and keeps review content nullable', () => {
    expect(
      adminSellerStatusUpdateRequestSchema.safeParse({
        status: 'APPROVED',
      }).success,
    ).toBe(false);
    expect(
      adminProductStatusUpdateRequestSchema.safeParse({
        status: 'ARCHIVED',
        reason: 'Archive',
        target: {
          kind: 'revision',
          id: revisionId,
          updatedAt,
        },
      }).success,
    ).toBe(false);

    const parsed = adminSellerProfileSchema.parse({
      id: sellerId,
      userId,
      parentStatus: 'APPROVED',
      parentUpdatedAt: updatedAt,
      sellerType: 'creator',
      applicationStage: null,
      createdAt: updatedAt,
      parent: sellerContent,
      reviewTarget: {
        id: revisionId,
        version: 2,
        status: 'PENDING_REVIEW',
        updatedAt,
        submittedAt: updatedAt,
        content: {
          ...sellerContent,
          city: null,
          profilePhoto: null,
          achievements: [],
        },
      },
      lastModerationReason: null,
      hasBlockingListing: false,
    });

    expect(parsed.reviewTarget?.content.city).toBeNull();
    expect(parsed.parent.city).toBe('Minsk');
  });

  it('defaults moderation pages to 50, caps them at 100, and rejects a bad cursor', () => {
    expect(adminModerationListQuerySchema.parse({}).limit).toBe(
      ADMIN_MODERATION_DEFAULT_LIMIT,
    );
    expect(adminModerationListQuerySchema.parse({}).filter).toBe('ALL');
    expect(
      adminModerationListQuerySchema.parse({
        limit: '100',
        filter: 'PENDING_REVIEW',
        search: '  Анна  ',
      }),
    ).toEqual({
      cursor: undefined,
      limit: ADMIN_MODERATION_MAX_LIMIT,
      filter: 'PENDING_REVIEW',
      search: 'Анна',
    });
    expect(
      adminModerationListQuerySchema.parse({ search: '   ' }).search,
    ).toBeUndefined();

    const cursor = encodeAdminModerationCursor({
      createdAt: updatedAt,
      id: sellerId,
    });
    expect(adminModerationListQuerySchema.parse({ cursor }).cursor).toBe(
      cursor,
    );
    expect(
      adminSellerProfilesResponseSchema.safeParse({
        sellerProfiles: [],
        nextCursor: cursor,
      }).success,
    ).toBe(true);
    expect(
      adminProductsResponseSchema.safeParse({
        products: [],
        nextCursor: null,
      }).success,
    ).toBe(true);

    for (const cursorValue of [
      'not-a-cursor',
      '',
      'null',
      cursor.slice(0, 8),
    ]) {
      expect(
        adminModerationListQuerySchema.safeParse({ cursor: cursorValue })
          .success,
      ).toBe(false);
    }
    expect(adminModerationListQuerySchema.safeParse({ limit: 0 }).success).toBe(
      false,
    );
    expect(
      adminModerationListQuerySchema.safeParse({ limit: 101 }).success,
    ).toBe(false);
    expect(
      adminModerationListQuerySchema.safeParse({ filter: 'DRAFT' }).success,
    ).toBe(false);
    expect(
      adminSellerProfilesResponseSchema.safeParse({ sellerProfiles: [] })
        .success,
    ).toBe(false);
  });

  it('accepts a legacy seller with no review target', () => {
    expect(
      adminSellerProfileSchema.parse({
        id: sellerId,
        userId,
        parentStatus: 'PENDING_REVIEW',
        parentUpdatedAt: updatedAt,
        sellerType: 'creator',
        applicationStage: null,
        createdAt: updatedAt,
        parent: sellerContent,
        reviewTarget: null,
        lastModerationReason: null,
        hasBlockingListing: false,
      }).reviewTarget,
    ).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import {
  adminProductStatusUpdateRequestSchema,
  adminSellerProfileSchema,
  adminSellerStatusUpdateRequestSchema,
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

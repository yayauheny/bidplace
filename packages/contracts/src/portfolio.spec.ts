import { describe, expect, it } from 'vitest';

import {
  portfolioCabinetWorksQuerySchema,
  portfolioCabinetWorksResponseSchema,
  portfolioAchievementSchema,
  portfolioAchievementWriteRequestSchema,
} from './portfolio';
import { publicSellerProfileSchema } from './seller-profile';

describe('portfolio cabinet contracts', () => {
  it('uses bounded owner pagination and keeps revision state separate from work visibility', () => {
    expect(portfolioCabinetWorksQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
    });

    expect(
      portfolioCabinetWorksResponseSchema.parse({
        works: [
          {
            id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
            publicId: 'cabinetwork',
            title: 'Published work with an edit',
            status: 'APPROVED',
            editingRevisionStatus: 'PENDING_REVIEW',
            updatedAt: '2026-09-24T10:00:00.000Z',
            moderationMessage: null,
            coverImage: null,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      }),
    ).toMatchObject({
      works: [{ status: 'APPROVED', editingRevisionStatus: 'PENDING_REVIEW' }],
    });
  });
});

describe('achievement write and historical read contracts', () => {
  const date = { year: 2025, month: 3, day: null };
  const input = { occurredDate: date, body: 'Групповая выставка' };

  it('accepts only a text achievement with an object date', () => {
    expect(portfolioAchievementWriteRequestSchema.parse(input)).toEqual(input);
    expect(
      portfolioAchievementWriteRequestSchema.safeParse({
        ...input,
        occurredDate: JSON.stringify(date),
      }).success,
    ).toBe(false);
    expect(
      portfolioAchievementWriteRequestSchema.safeParse({
        ...input,
        image: null,
      }).success,
    ).toBe(false);
  });

  it('keeps historical public media URLs readable in both projections', () => {
    const achievement = {
      id: '3b2e93b2-1428-40fc-a15a-b9cd98e422b6',
      occurredDate: date,
      body: input.body,
      image: {
        url: 'https://media.bid.place/assets/11111111-1111-4111-8111-111111111111/p1/preview.webp',
        mimeType: 'image/webp',
        byteLength: 128,
        checksum: 'a'.repeat(64),
      },
    };
    expect(portfolioAchievementSchema.parse(achievement)).toEqual(achievement);
    expect(
      publicSellerProfileSchema.shape.achievements.parse([achievement]),
    ).toEqual([achievement]);
  });
});

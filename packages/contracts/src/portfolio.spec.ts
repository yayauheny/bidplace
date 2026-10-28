import { describe, expect, it } from 'vitest';

import {
  portfolioCabinetWorksQuerySchema,
  portfolioCabinetWorksResponseSchema,
  portfolioAchievementWriteRequestSchema,
  portfolioWorksQuerySchema,
} from './portfolio';

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

describe('achievement writes', () => {
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
});

describe('public catalog category selection', () => {
  const sculpture = '10000000-0000-4000-8000-000000000099';
  const painting = '10000000-0000-4000-8000-000000000098';

  it('accepts comma-separated or array categories and preserves legacy single ID', () => {
    expect(portfolioWorksQuerySchema.parse({ categories: `${sculpture},${painting}` }).categories)
      .toEqual([sculpture, painting]);
    expect(portfolioWorksQuerySchema.parse({ categories: [sculpture] }).categories)
      .toEqual([sculpture]);
    expect(portfolioWorksQuerySchema.parse({ category: sculpture }).category)
      .toBe(sculpture);
  });

  it('rejects invalid or excessive category lists', () => {
    expect(portfolioWorksQuerySchema.safeParse({ categories: 'not-a-uuid' }).success)
      .toBe(false);
    expect(portfolioWorksQuerySchema.safeParse({ categories: [] }).success)
      .toBe(false);
    expect(portfolioWorksQuerySchema.safeParse({ categories: Array(21).fill(sculpture) }).success)
      .toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import {
  portfolioCabinetWorksQuerySchema,
  portfolioCabinetWorksResponseSchema,
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

import { describe, expect, it } from 'vitest';

import { createApiClient } from '../src';

const authorApplication = {
  application: {
    slug: 'author',
    fullName: 'Author',
    country: 'Belarus',
    city: 'Minsk',
    discipline: 'Painting',
    practice: null,
    shortDescription: 'Bio',
    status: 'PENDING_REVIEW',
  },
  editingRevision: {
    id: '0a0d82a1-0317-49eb-904f-a8bc87d311a5',
    version: 1,
    status: 'PENDING_REVIEW',
    updatedAt: '2026-09-23T00:00:00.000Z',
  },
  achievements: [],
};

describe('portfolio client', () => {
  it('parses submitted author applications with the revision hydration token', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () =>
        new Response(JSON.stringify(authorApplication), {
          headers: { 'content-type': 'application/json' },
        }),
    });

    await expect(
      client.portfolio.submitAuthorApplication(),
    ).resolves.toMatchObject({
      application: { status: 'PENDING_REVIEW' },
      editingRevision: {
        status: 'PENDING_REVIEW',
        updatedAt: '2026-09-23T00:00:00.000Z',
      },
    });
  });
});

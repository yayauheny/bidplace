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

  it('calls the server-owned author onboarding advance operation', async () => {
    const calls: RequestInfo[] = [];
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (input) => {
        calls.push(input);
        return new Response(JSON.stringify({
          application: {
            ...authorApplication.application,
            discipline: null,
            shortDescription: null,
            status: 'DRAFT',
            applicationStage: 'ABOUT',
          },
          editingRevision: { ...authorApplication.editingRevision, status: 'DRAFT' },
          achievements: [],
        }), { headers: { 'content-type': 'application/json' } });
      },
    });

    await expect(client.portfolio.advanceAuthorApplication()).resolves.toMatchObject({
      application: { applicationStage: 'ABOUT' },
    });
    expect(String(calls[0])).toContain('/api/author/application/advance');
  });

  it('serializes a structured achievement date for multipart upload', async () => {
    let formData: FormData | undefined;
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (_input, init) => {
        formData = init?.body as FormData;
        return new Response(JSON.stringify({
          achievement: {
            id: '0a0d82a1-0317-49eb-904f-a8bc87d311a5',
            occurredDate: { year: 2025, month: 3, day: null },
            body: 'Show',
            image: null,
          },
        }), { headers: { 'content-type': 'application/json' } });
      },
    });

    await client.portfolio.addAuthorAchievement({
      occurredDate: { year: 2025, month: 3, day: null },
      body: 'Show',
    });

    expect(formData?.get('occurredDate')).toBe(
      JSON.stringify({ year: 2025, month: 3, day: null }),
    );
  });
});

import { describe, expect, it } from 'vitest';

import { createApiClient } from '../src';

const sellerId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000004';
const revisionId = '00000000-0000-4000-8000-000000000005';

function sellerResponse() {
  return {
    sellerProfile: {
      id: sellerId,
      userId,
      slug: 'author',
      sellerType: 'creator',
      discipline: 'Керамика',
      fullName: 'Author',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      biography: null,
      profilePhotoUrl: '/api/sellers/author/photo',
      socialLink: null,
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      publicEmail: null,
      shortDescription: 'About',
      handoffContactType: null,
      handoffContactValue: null,
      handoffInitiator: null,
      status: 'APPROVED',
      applicationStage: null,
      createdAt: '2026-09-26T12:00:00.000Z',
      updatedAt: '2026-09-26T12:00:00.000Z',
    },
    editingRevision: null,
  };
}

describe('admin client', () => {
  it('sends an explicit seller target and keeps the profile response envelope', async () => {
    let requestBody = '';
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (_url, init) => {
        requestBody = String(init?.body ?? '');
        return new Response(JSON.stringify(sellerResponse()), {
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    await expect(
      client.admin.updateSellerStatus(sellerId, {
        status: 'APPROVED',
        target: {
          kind: 'revision',
          id: revisionId,
          updatedAt: '2026-09-26T12:00:00.000Z',
        },
      }),
    ).resolves.toMatchObject({
      sellerProfile: { status: 'APPROVED' },
    });
    expect(JSON.parse(requestBody)).toMatchObject({
      status: 'APPROVED',
      target: { kind: 'revision', id: revisionId },
    });
  });

  it('loads a seller revision photo as a private blob', async () => {
    let requested = '';
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      getAccessToken: () => 'admin-token',
      fetchImpl: async (url, init) => {
        requested = String(url);
        expect(new Headers(init?.headers).get('authorization')).toBe(
          'Bearer admin-token',
        );
        return new Response(new Uint8Array([1, 2, 3]), {
          headers: { 'content-type': 'image/png' },
        });
      },
    });

    const photo = await client.admin.getSellerRevisionPhoto(sellerId, revisionId);
    expect(requested).toBe(
      `https://api.example.test/api/admin/seller-profiles/${sellerId}/revisions/${revisionId}/photo`,
    );
    expect(photo.size).toBe(3);
  });

  it('loads a product image with the admin bearer token', async () => {
    const imageId = '00000000-0000-4000-8000-000000000008';
    let requested = '';
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      getAccessToken: () => 'admin-token',
      fetchImpl: async (url, init) => {
        requested = String(url);
        expect(new Headers(init?.headers).get('authorization')).toBe(
          'Bearer admin-token',
        );
        return new Response(new Uint8Array([4, 5, 6, 7]), {
          headers: { 'content-type': 'image/png' },
        });
      },
    });

    const image = await client.admin.getProductImage(imageId);
    expect(requested).toBe(`https://api.example.test/api/images/${imageId}`);
    expect(image.size).toBe(4);
  });
});

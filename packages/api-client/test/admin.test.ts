import { describe, expect, it } from 'vitest';
import { encodeAdminModerationCursor } from '@bidplace/contracts';

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

    const photo = await client.admin.getSellerRevisionPhoto(
      sellerId,
      revisionId,
    );
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

  it('sends a moderation page query and returns the next cursor', async () => {
    const cursor = encodeAdminModerationCursor({
      createdAt: '2026-09-26T12:00:00.000Z',
      id: sellerId,
    });
    const requested: string[] = [];
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (url, init) => {
        requested.push(String(url));
        if (String(url).includes('/seller-profiles')) {
          expect(init?.signal).toBe(controller.signal);
        }
        const path = new URL(String(url)).pathname;
        const body = path.endsWith('/products')
          ? { products: [], nextCursor: null }
          : { sellerProfiles: [], nextCursor: cursor };
        return new Response(JSON.stringify(body), {
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    const controller = new AbortController();

    const sellers = await client.admin.listSellerProfiles(
      {
        filter: 'PENDING_REVIEW',
        search: '  Ceramic  ',
        limit: 25,
        cursor,
      },
      { signal: controller.signal },
    );
    const products = await client.admin.listProducts();

    const sellerUrl = new URL(requested[0] ?? '');
    expect(sellerUrl.pathname).toBe('/api/admin/seller-profiles');
    expect(sellerUrl.searchParams.get('filter')).toBe('PENDING_REVIEW');
    expect(sellerUrl.searchParams.get('search')).toBe('Ceramic');
    expect(sellerUrl.searchParams.get('limit')).toBe('25');
    expect(sellerUrl.searchParams.get('cursor')).toBe(cursor);
    expect(sellers.nextCursor).toBe(cursor);

    const productUrl = new URL(requested[1] ?? '');
    expect(productUrl.pathname).toBe('/api/admin/products');
    expect(productUrl.searchParams.get('filter')).toBe('ALL');
    expect(productUrl.searchParams.get('limit')).toBe('50');
    expect(productUrl.searchParams.get('search')).toBeNull();
    expect(productUrl.searchParams.get('cursor')).toBeNull();
    expect(products.nextCursor).toBeNull();
  });

  it('rejects an invalid moderation cursor before the list request', async () => {
    let called = false;
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () => {
        called = true;
        return new Response('{}');
      },
    });

    expect(() => client.admin.listProducts({ cursor: 'not-a-cursor' })).toThrow(
      /Invalid moderation cursor/,
    );
    expect(called).toBe(false);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '../src/errors';
import { createRequestContext } from '../src/request';
import { createSellersClient } from '../src/sellers';

const photo = new Blob(['portrait'], { type: 'image/png' });
const profile = {
  slug: 'synthetic-author',
  fullName: 'Synthetic Author',
  country: 'BY',
  city: 'Minsk',
};

function client(fetchImpl: typeof fetch) {
  return createSellersClient(
    createRequestContext({ baseUrl: 'https://api.example.test', fetchImpl }),
  );
}

describe('seller profile create', () => {
  it('rejects a nickname outside the slug contract before any request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    expect(() =>
      client(fetchImpl).createProfile({ ...profile, slug: 'БЕ' }, photo),
    ).toThrow(ApiClientError);
    let rejected: unknown;
    expect(() => {
      try {
        client(fetchImpl).createProfile(
          { ...profile, slug: 'BE', publicEmail: 'not-an-email' },
          photo,
        );
      } catch (error) {
        rejected = error;
        throw error;
      }
    }).toThrow(ApiClientError);
    expect(rejected).toBeInstanceOf(ApiClientError);
    expect((rejected as ApiClientError).details).toMatchObject({
      fieldErrors: {
        slug: [
          'Используйте маленькие латинские буквы и цифры. Между ними можно поставить дефис или подчёркивание.',
        ],
        publicEmail: ['Введите корректный email'],
      },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends a contract-valid nickname', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({
        sellerProfile: {
          id: '22222222-2222-4222-8222-222222222222',
          userId: '11111111-1111-4111-8111-111111111111',
          slug: 'synthetic-author',
          sellerType: 'creator',
          discipline: null,
          fullName: 'Synthetic Author',
          country: 'BY',
          city: 'Minsk',
          practice: null,
          biography: null,
          profilePhotoUrl: '/api/sellers/synthetic-author/photo',
          socialLink: null,
          telegramUrl: null,
          instagramUrl: null,
          websiteUrl: null,
          publicEmail: null,
          shortDescription: null,
          handoffContactType: null,
          handoffContactValue: null,
          handoffInitiator: null,
          status: 'DRAFT',
          applicationStage: null,
          createdAt: '2026-10-06T14:14:00.000Z',
          updatedAt: '2026-10-06T14:14:00.000Z',
        },
        editingRevision: {
          id: '33333333-3333-4333-8333-333333333333',
          version: 1,
          status: 'DRAFT',
          updatedAt: '2026-10-06T14:14:00.000Z',
        },
      }),
    );
    const created = await client(fetchImpl).createProfile(profile, photo);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://api.example.test/api/seller/profile');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(FormData);
    const body = init?.body as FormData;
    expect(body.get('slug')).toBe('synthetic-author');
    expect(body.get('fullName')).toBe('Synthetic Author');
    expect(body.get('profilePhoto')).toBeInstanceOf(Blob);
    expect(created.sellerProfile.slug).toBe('synthetic-author');
  });
});

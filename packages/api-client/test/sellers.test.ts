import { describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '../src/errors';
import { createRequestContext } from '../src/request';
import { createSellersClient } from '../src/sellers';

const savedProfileResponse = {
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
};

const photo = new Blob(['portrait'], { type: 'image/png' });
const profile = {
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
  it('rejects an independent slug and an invalid public email before any request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    expect(() =>
      client(fetchImpl).createProfile(
        { ...profile, slug: 'synthetic-author' } as never,
        photo,
      ),
    ).toThrow(ApiClientError);
    let rejected: unknown;
    expect(() => {
      try {
        client(fetchImpl).createProfile(
          { ...profile, publicEmail: 'not-an-email' },
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
        publicEmail: ['Введите корректный email'],
      },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the author profile without an independent slug', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(savedProfileResponse),
    );
    const created = await client(fetchImpl).createProfile(profile, photo);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://api.example.test/api/seller/profile');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(FormData);
    const body = init?.body as FormData;
    expect(body.get('fullName')).toBeNull();
    expect(body.get('profilePhoto')).toBeInstanceOf(Blob);
    expect(JSON.parse(String(body.get('data')))).toEqual({
      fullName: 'Synthetic Author',
      country: 'BY',
      city: 'Minsk',
    });
    expect(created.sellerProfile.slug).toBe('synthetic-author');
  });
});

describe('seller profile update envelope', () => {
  it('sends an explicit null city inside the data part, never as a top-level field', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(savedProfileResponse),
    );

    await client(fetchImpl).updateProfile({ city: null }, photo);

    const [, init] = fetchImpl.mock.calls[0] ?? [];
    const body = init?.body as FormData;
    expect(body.has('city')).toBe(false);
    expect(JSON.parse(String(body.get('data')))).toEqual({ city: null });
    expect(body.get('profilePhoto')).toBeInstanceOf(Blob);
  });

  it('sends a profile update without a photo as data only', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(savedProfileResponse),
    );

    await client(fetchImpl).updateProfile({ city: null, country: 'BY' });

    const [, init] = fetchImpl.mock.calls[0] ?? [];
    const body = init?.body as FormData;
    expect(body.get('profilePhoto')).toBeNull();
    expect(JSON.parse(String(body.get('data')))).toEqual({
      city: null,
      country: 'BY',
    });
  });
});

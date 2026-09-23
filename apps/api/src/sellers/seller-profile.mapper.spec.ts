import { describe, expect, it } from 'vitest';

import {
  toPublicSellerProfile,
  toSellerProfileResponse,
} from './seller-profile.mapper';

describe('toSellerProfileResponse', () => {
  it('omits profile photo storage fields from the response contract', () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const response = toSellerProfileResponse({
      id: '0a0d82a1-0317-49eb-904f-a8bc87d311a5',
      userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      slug: 'seller-slug',
      fullName: 'Seller',
      sellerType: 'creator',
      discipline: 'Керамика',
      country: 'BY',
      city: 'Минск',
      practice: null,
      biography: null,
      socialLink: 'https://example.com/seller',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Short',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
      createdAt: now,
      updatedAt: now,
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: 1024,
      profilePhotoChecksum: 'checksum',
      profilePhotoData: new Uint8Array([1, 2, 3]),
    } as never);

    expect(response.sellerProfile.profilePhotoUrl).toBe(
      '/api/sellers/seller-slug/photo',
    );
    expect(response.editingRevision).toBeNull();
    expect(response.sellerProfile).not.toHaveProperty('profilePhotoMimeType');
    expect(response.sellerProfile).not.toHaveProperty('profilePhotoByteLength');
    expect(response.sellerProfile).not.toHaveProperty('profilePhotoChecksum');
    expect(response.sellerProfile).not.toHaveProperty('profilePhotoData');
  });

  it('overlays public owner fields from the editing revision', () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const response = toSellerProfileResponse({
      id: '0a0d82a1-0317-49eb-904f-a8bc87d311a5',
      userId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
      slug: 'live-slug',
      fullName: 'Live name',
      sellerType: 'creator',
      discipline: 'Керамика',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      biography: null,
      socialLink: 'https://example.com/live',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Live bio',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
      createdAt: now,
      updatedAt: now,
      editingRevision: {
        id: '2a0d82a1-0317-49eb-904f-a8bc87d311a5',
        version: 2,
        status: 'DRAFT',
        updatedAt: now,
        slug: 'draft-slug',
        discipline: 'Живопись',
        fullName: 'Draft name',
        country: 'BY',
        city: 'Grodno',
        practice: null,
        biography: null,
        socialLink: 'https://example.com/draft',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Draft bio',
      },
    } as never);

    expect(response.sellerProfile.status).toBe('APPROVED');
    expect(response.sellerProfile.fullName).toBe('Draft name');
    expect(response.sellerProfile.city).toBe('Grodno');
    expect(response.sellerProfile.profilePhotoUrl).toBe(
      '/api/sellers/draft-slug/photo',
    );
    expect(response.editingRevision).toEqual({
      id: '2a0d82a1-0317-49eb-904f-a8bc87d311a5',
      version: 2,
      status: 'DRAFT',
      updatedAt: now.toISOString(),
    });
  });
});

describe('toPublicSellerProfile', () => {
  it('keeps structured public links while excluding private handoff fields', () => {
    const profile = toPublicSellerProfile({
      id: '2b2e93b2-1428-40fc-a15a-b9cd98e422b6',
      slug: 'maker',
      sellerType: 'creator',
      discipline: 'Керамика',
      fullName: 'Maker',
      country: 'BY',
      socialLink: 'https://example.com/maker',
      telegramUrl: 'https://t.me/maker',
      instagramUrl: 'https://instagram.com/maker',
      websiteUrl: null,
      shortDescription: 'Short bio',
      publishedRevision: {
        achievements: [
          {
            id: '3b2e93b2-1428-40fc-a15a-b9cd98e422b6',
            occurredAt: new Date('2025-03-02T00:00:00.000Z'),
            body: 'Групповая выставка',
            mimeType: null,
            byteLength: null,
            checksum: null,
            objectKey: null,
          },
        ],
      },
    });

    expect(profile).toMatchObject({
      id: '2b2e93b2-1428-40fc-a15a-b9cd98e422b6',
      telegramUrl: 'https://t.me/maker',
      instagramUrl: 'https://instagram.com/maker',
      websiteUrl: null,
      achievements: [
        {
          id: '3b2e93b2-1428-40fc-a15a-b9cd98e422b6',
          occurredAt: '2025-03-02T00:00:00.000Z',
          body: 'Групповая выставка',
          image: null,
        },
      ],
    });
    expect(profile).not.toHaveProperty('handoffContactType');
    expect(profile).not.toHaveProperty('handoffContactValue');
  });
});

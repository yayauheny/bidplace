import { describe, expect, it } from 'vitest';

import { toSellerProfileResponse } from './seller-profile.mapper';

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
      socialLink: 'https://example.com/seller',
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
    expect(response.sellerProfile).not.toHaveProperty('profilePhotoMimeType');
    expect(response.sellerProfile).not.toHaveProperty('profilePhotoByteLength');
    expect(response.sellerProfile).not.toHaveProperty('profilePhotoChecksum');
    expect(response.sellerProfile).not.toHaveProperty('profilePhotoData');
  });
});

import { describe, expect, it } from 'vitest';

import { InvalidPersistenceValueError } from '../core/contracts';
import { toContractSellerProfile } from './seller-profile.mapper';

describe('seller profile mapper', () => {
  it('maps a raw seller profile record to the contract shape', () => {
    expect(
      toContractSellerProfile({
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        userId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        slug: 'demo-seller',
        sellerType: 'creator',
        storeName: 'Demo Store',
        country: 'BY',
        contactPreference: 'telegram',
        socialLink: 'https://example.com',
        shortDescription: 'Short bio',
        status: 'active',
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
      }),
    ).toEqual({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      userId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      slug: 'demo-seller',
      sellerType: 'creator',
      storeName: 'Demo Store',
      country: 'BY',
      contactPreference: 'telegram',
      socialLink: 'https://example.com',
      shortDescription: 'Short bio',
      status: 'active',
      createdAt: '2026-07-13T12:00:00.000Z',
      updatedAt: '2026-07-13T12:00:00.000Z',
    });
  });

  it.each([
    ['sellerType', { sellerType: 'invalid' }],
    ['status', { status: 'invalid' }],
  ] as const)('rejects invalid seller profile %s values', (_, patch) => {
    expect(() =>
      toContractSellerProfile({
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        userId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        slug: 'demo-seller',
        sellerType: 'creator',
        storeName: 'Demo Store',
        country: 'BY',
        contactPreference: 'telegram',
        socialLink: 'https://example.com',
        shortDescription: 'Short bio',
        status: 'active',
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
        ...patch,
      }),
    ).toThrow(InvalidPersistenceValueError);
  });
});

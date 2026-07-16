import { describe, expect, it } from 'vitest';

import { InvalidPersistenceValueError } from '../core/contracts';
import { toContractLot } from './lot.mapper';

describe('lot mapper', () => {
  it('maps a raw lot record to the contract shape', () => {
    expect(
      toContractLot({
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a2222',
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
        title: 'Signed Ceramic Vase',
        description: 'Handmade ceramic vase.',
        condition: 'excellent',
        lotImages: [{ id: '9cb88056-f0dc-4309-84e4-090af8ace1e2', position: 0 }],
        status: 'draft',
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
      }),
    ).toEqual({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a2222',
      sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
      title: 'Signed Ceramic Vase',
      description: 'Handmade ceramic vase.',
      condition: 'excellent',
      images: ['/api/images/9cb88056-f0dc-4309-84e4-090af8ace1e2'],
      status: 'draft',
      createdAt: '2026-07-13T12:00:00.000Z',
      updatedAt: '2026-07-13T12:00:00.000Z',
    });
  });

  it('rejects invalid lot status values', () => {
    expect(() =>
      toContractLot({
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a2222',
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
        title: 'Signed Ceramic Vase',
        description: 'Handmade ceramic vase.',
        condition: 'excellent',
        lotImages: [],
        status: 'invalid',
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
      }),
    ).toThrow(InvalidPersistenceValueError);
  });
});

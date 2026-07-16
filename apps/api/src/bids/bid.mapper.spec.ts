import { describe, expect, it } from 'vitest';
import { Decimal } from '@bidplace/database';

import { InvalidPersistenceValueError } from '../core/contracts';
import { toContractBid } from './bid.mapper';

describe('bid mapper', () => {
  it('maps a raw bid record to the contract shape', () => {
    expect(
      toContractBid({
        id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        amount: new Decimal(125),
        status: 'winning',
        createdAt: new Date('2026-07-13T12:10:00.000Z'),
        updatedAt: new Date('2026-07-13T12:10:00.000Z'),
      }),
    ).toEqual({
      id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
      amount: 125,
      status: 'winning',
      createdAt: '2026-07-13T12:10:00.000Z',
      updatedAt: '2026-07-13T12:10:00.000Z',
    });
  });

  it('rejects invalid bid status values', () => {
    expect(() =>
      toContractBid({
        id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        amount: new Decimal(125),
        status: 'bad',
        createdAt: new Date('2026-07-13T12:10:00.000Z'),
        updatedAt: new Date('2026-07-13T12:10:00.000Z'),
      }),
    ).toThrow(InvalidPersistenceValueError);
  });
});

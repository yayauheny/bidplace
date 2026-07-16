import { describe, expect, it } from 'vitest';
import { Decimal } from '@bidplace/database';

import { InvalidPersistenceValueError } from '../core/contracts';
import {
  toAuctionDetailItem,
  toAuctionListItem,
  toContractAuction,
} from './auction.mapper';

function createAuctionRecord(overrides: Partial<Parameters<typeof toContractAuction>[0]> = {}) {
  const d = (value: number | string) => new Decimal(value);

  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
    sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
    slug: 'demo-auction',
    startPrice: d(100),
    reservePrice: d(150),
    currentPrice: d(120),
    currency: 'USD',
    bidStep: d(5),
    startsAt: new Date('2026-07-13T12:00:00.000Z'),
    endsAt: new Date('2026-07-14T12:00:00.000Z'),
    status: 'active',
    bidCount: 1,
    winnerBidId: null,
    buyNowPrice: null,
    createdAt: new Date('2026-07-13T12:00:00.000Z'),
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

describe('auction mapper', () => {
  it('maps a raw auction record to the contract shape', () => {
    expect(toContractAuction(createAuctionRecord())).toEqual({
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      slug: 'demo-auction',
      startPrice: 100,
      reservePrice: 150,
      currentPrice: 120,
      currency: 'USD',
      bidStep: 5,
      startsAt: '2026-07-13T12:00:00.000Z',
      endsAt: '2026-07-14T12:00:00.000Z',
      status: 'active',
      bidCount: 1,
      winnerBidId: null,
      buyNowPrice: null,
      createdAt: '2026-07-13T12:00:00.000Z',
      updatedAt: '2026-07-13T12:00:00.000Z',
    });
  });

  it('rejects invalid auction status values', () => {
    expect(() =>
      toContractAuction(
        createAuctionRecord({
          status: 'invalid',
        }),
      ),
    ).toThrow(InvalidPersistenceValueError);
  });

  it('maps nested public auction records', () => {
    expect(
      toAuctionListItem({
        ...createAuctionRecord(),
        lot: {
          id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
          sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
          categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
          title: 'Signed Ceramic Vase',
          description: 'Handmade ceramic vase.',
          condition: 'excellent',
          images: ['/uploads/lots/vase.jpg'],
          status: 'published',
          createdAt: new Date('2026-07-13T12:00:00.000Z'),
          updatedAt: new Date('2026-07-13T12:00:00.000Z'),
        },
        sellerProfile: {
          id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
          userId: '9d5e8f46-5f7d-4c1a-9f7c-3d4c8d7a1111',
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
        },
      }),
    ).toMatchObject({
      auction: { status: 'active' },
      lot: { status: 'published' },
      sellerProfile: { status: 'active' },
    });
  });

  it('maps detail records with bids', () => {
    expect(
      toAuctionDetailItem({
        ...createAuctionRecord(),
        lot: {
          id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
          sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
          categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
          title: 'Signed Ceramic Vase',
          description: 'Handmade ceramic vase.',
          condition: 'excellent',
          images: ['/uploads/lots/vase.jpg'],
          status: 'published',
          createdAt: new Date('2026-07-13T12:00:00.000Z'),
          updatedAt: new Date('2026-07-13T12:00:00.000Z'),
        },
        sellerProfile: {
          id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
          userId: '9d5e8f46-5f7d-4c1a-9f7c-3d4c8d7a1111',
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
        },
        bids: [
          {
            id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
            auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
            bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
            amount: new Decimal(125),
            status: 'winning',
            createdAt: new Date('2026-07-13T12:10:00.000Z'),
            updatedAt: new Date('2026-07-13T12:10:00.000Z'),
          },
        ],
      }),
    ).toMatchObject({
      bids: [{ status: 'winning', amount: 125 }],
    });
  });
});

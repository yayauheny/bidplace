import { describe, expect, it, vi } from 'vitest';
import { ActivityService } from './activity.service';

const date = new Date('2026-07-18T12:00:00.000Z');
const amount = { toNumber: () => 10 };

function bid(
  status: 'LIVE' | 'ENDED',
  leading: boolean,
  orderStatus?: 'PENDING_CONTACT' | 'COMPLETED' | 'CANCELLED',
) {
  const ownBid = { id: 'own-bid', listingId: 'listing-id', createdAt: date };
  return {
    ...ownBid,
    listing: {
      id: 'listing-id',
      productId: 'product-id',
      status,
      startsAt: date,
      originalEndsAt: date,
      endsAt: date,
      currentPrice: amount,
      bidCount: 1,
      closedAt: status === 'ENDED' ? date : null,
      createdAt: date,
      updatedAt: date,
      auctionRules: { startPrice: amount },
      product: { publicId: 'product0001', title: 'Product' },
      orders: orderStatus
        ? [{ buyerId: 'user-id', status: orderStatus, publicId: 'orderPub001' }]
        : [],
      bids: [{ id: leading ? 'own-bid' : 'other-bid' }],
    },
  };
}

describe('ActivityService', () => {
  it.each([
    ['LEADING', bid('LIVE', true)],
    ['OUTBID', bid('LIVE', false)],
    ['WON', bid('ENDED', true)],
    ['LOST', bid('ENDED', false)],
    ['AWAITING_SELLER_CONTACT', bid('ENDED', true, 'PENDING_CONTACT')],
    ['COMPLETED', bid('ENDED', true, 'COMPLETED')],
    ['WIN_CANCELLED', bid('ENDED', true, 'CANCELLED')],
  ])(
    'derives %s from Listing, Bid and Order state',
    async (expected, record) => {
      const prisma = { bid: { findMany: vi.fn().mockResolvedValue([record]) } };
      const result = await new ActivityService(prisma as never).get('user-id');
      expect(result.activity[0]?.status).toBe(expected);
    },
  );
});

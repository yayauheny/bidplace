import { describe, expect, it, vi } from 'vitest';

import type { ActivityStatus, OrderStatus } from '@bidplace/contracts';

import { ActivityService } from './activity.service';

const date = new Date('2026-07-18T12:00:00.000Z');
const amount = { toNumber: () => 10 };

function bid(
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED',
  leading: boolean,
  orderStatus?: OrderStatus,
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
    ['LEADING', bid('LIVE', true), null],
    ['OUTBID', bid('LIVE', false), null],
    ['OUTBID', bid('SCHEDULED', true), null],
    ['OUTBID', bid('CANCELLED', true), null],
    ['WON', bid('ENDED', true), null],
    ['LOST', bid('ENDED', false), null],
    [
      'AWAITING_SELLER_CONTACT',
      bid('ENDED', true, 'PENDING_CONTACT'),
      'orderPub001',
    ],
    ['CONTACTED', bid('ENDED', true, 'CONTACTED'), 'orderPub001'],
    ['COMPLETED', bid('ENDED', true, 'COMPLETED'), 'orderPub001'],
    ['HANDOFF_FAILED', bid('ENDED', true, 'HANDOFF_FAILED'), 'orderPub001'],
    ['WIN_CANCELLED', bid('ENDED', true, 'CANCELLED'), null],
  ] satisfies Array<[ActivityStatus, ReturnType<typeof bid>, string | null]>)(
    'derives %s from Listing, Bid and Order state',
    async (expected, record, orderPublicId) => {
      const prisma = { bid: { findMany: vi.fn().mockResolvedValue([record]) } };
      const result = await new ActivityService(prisma as never).get('user-id');
      expect(result.activity).toHaveLength(1);
      expect(result.activity[0]?.status).toBe(expected);
      expect(result.activity[0]?.orderPublicId).toBe(orderPublicId);
    },
  );

  it('keeps one card per listing and omits cancelled order navigation', async () => {
    const laterBid = {
      id: 'later-bid',
      listingId: 'listing-id',
      createdAt: new Date('2026-07-18T13:00:00.000Z'),
      listing: bid('ENDED', true, 'CANCELLED').listing,
    };
    const prisma = {
      bid: {
        findMany: vi
          .fn()
          .mockResolvedValue([laterBid, bid('ENDED', true, 'CANCELLED')]),
      },
    };
    const result = await new ActivityService(prisma as never).get('user-id');
    expect(result.activity).toHaveLength(1);
    expect(result.activity[0]).toMatchObject({
      status: 'WIN_CANCELLED',
      orderPublicId: null,
      product: { publicId: 'product0001' },
    });
  });
});

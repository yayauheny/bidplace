import { describe, expect, it, vi } from 'vitest';

import type { ActivityStatus, OrderStatus } from '@bidplace/contracts';

import { ActivityService } from './activity.service';

const date = new Date('2026-07-18T12:00:00.000Z');
const amount = { toNumber: () => 10 };

function order(
  status: OrderStatus,
  publicId = 'orderPub001',
  createdAt = date,
  id = publicId,
) {
  return { id, buyerId: 'user-id', status, publicId, createdAt };
}

function bid(
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED',
  leading: boolean,
  orders: ReturnType<typeof order>[] = [],
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
      orders,
      bids: [{ id: leading ? 'own-bid' : 'other-bid' }],
    },
  };
}

async function project(record: ReturnType<typeof bid>) {
  const prisma = { bid: { findMany: vi.fn().mockResolvedValue([record]) } };
  const result = await new ActivityService(prisma as never).get('user-id');
  return { activity: result.activity[0], findMany: prisma.bid.findMany };
}

describe('ActivityService', () => {
  it.each([
    ['LEADING', bid('LIVE', true), null],
    ['OUTBID', bid('LIVE', false), null],
    ['OUTBID', bid('SCHEDULED', true), null],
    ['AUCTION_CANCELLED', bid('CANCELLED', true), null],
    ['WON', bid('ENDED', true), null],
    ['LOST', bid('ENDED', false), null],
    [
      'AWAITING_SELLER_CONTACT',
      bid('ENDED', true, [order('PENDING_CONTACT')]),
      'orderPub001',
    ],
    ['CONTACTED', bid('ENDED', true, [order('CONTACTED')]), 'orderPub001'],
    ['COMPLETED', bid('ENDED', true, [order('COMPLETED')]), 'orderPub001'],
    [
      'HANDOFF_FAILED',
      bid('ENDED', true, [order('HANDOFF_FAILED')]),
      'orderPub001',
    ],
    ['WIN_CANCELLED', bid('ENDED', true, [order('CANCELLED')]), null],
  ] satisfies Array<[ActivityStatus, ReturnType<typeof bid>, string | null]>)(
    'derives %s from Listing, Bid and Order state',
    async (expected, record, orderPublicId) => {
      const result = await project(record);
      expect(result.activity).toMatchObject({ status: expected, orderPublicId });
    },
  );

  it('loads only current buyer Orders in an explicit deterministic order', async () => {
    const result = await project(bid('ENDED', true));

    expect(result.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          listing: expect.objectContaining({
            include: expect.objectContaining({
              orders: {
                where: { buyerId: 'user-id' },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                select: {
                  id: true,
                  buyerId: true,
                  status: true,
                  publicId: true,
                  createdAt: true,
                },
              },
            }),
          }),
        }),
      }),
    );
  });

  it('prefers a current Order over cancelled history in either input order', async () => {
    const cancelled = order(
      'CANCELLED',
      'cancelled01',
      new Date('2026-07-19T10:00:00.000Z'),
      'cancelled-id',
    );
    const current = order(
      'CONTACTED',
      'contacted01',
      new Date('2026-07-18T10:00:00.000Z'),
      'contacted-id',
    );

    for (const orders of [
      [cancelled, current],
      [current, cancelled],
    ]) {
      const result = await project(bid('ENDED', true, orders));
      expect(result.activity).toMatchObject({
        status: 'CONTACTED',
        orderPublicId: 'contacted01',
      });
    }
  });

  it('uses createdAt and id as stable tie-breakers for equally relevant Orders', async () => {
    const older = order(
      'PENDING_CONTACT',
      'olderorder1',
      new Date('2026-07-18T10:00:00.000Z'),
      'older-id',
    );
    const newerLowerId = order(
      'CONTACTED',
      'newerorder1',
      new Date('2026-07-19T10:00:00.000Z'),
      'a-id',
    );
    const newerHigherId = order(
      'COMPLETED',
      'newerorder2',
      new Date('2026-07-19T10:00:00.000Z'),
      'z-id',
    );

    for (const orders of [
      [older, newerLowerId, newerHigherId],
      [newerHigherId, older, newerLowerId],
    ]) {
      const result = await project(bid('ENDED', true, orders));
      expect(result.activity).toMatchObject({
        status: 'COMPLETED',
        orderPublicId: 'newerorder2',
      });
    }
  });

  it('keeps one card per listing and omits cancelled Order navigation', async () => {
    const laterBid = {
      id: 'later-bid',
      listingId: 'listing-id',
      createdAt: new Date('2026-07-18T13:00:00.000Z'),
      listing: bid('ENDED', true, [order('CANCELLED')]).listing,
    };
    const prisma = {
      bid: {
        findMany: vi
          .fn()
          .mockResolvedValue([laterBid, bid('ENDED', true, [order('CANCELLED')])]),
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

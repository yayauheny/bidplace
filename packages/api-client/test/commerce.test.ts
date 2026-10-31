import { describe, expect, it } from 'vitest';

import { createApiClient } from '../src';

const now = '2026-10-30T09:00:00.000Z';
const listingId = '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1';
const productId = '11111111-1111-4111-8111-111111111111';
const idempotencyKey = 'bid-key-1';

const lot = {
  id: listingId,
  type: 'AUCTION',
  effectiveStatus: 'LIVE',
  currency: 'BYN',
  priceMinor: 2_500,
  minimumBidMinor: 2_600,
  bidCount: 1,
  startsAt: now,
  endsAt: '2026-11-02T09:00:00.000Z',
  contactWindowHours: 24,
  mark: 'AUCTION',
  serverNow: now,
  viewer: {
    role: 'buyer',
    isLeading: true,
    blockedReason: null,
  },
};

const placedBid = {
  bid: {
    id: '33333333-3333-4333-8333-333333333333',
    amountMinor: 2_600,
    createdAt: now,
    participantLabel: 'Участник 1',
  },
  lot,
};

const orders = {
  orders: [
    {
      publicId: 'q7Xf2Kd9aB1',
      dealCode: '123456',
      status: 'ACTIVE',
      source: 'FIXED_PURCHASE',
      amountMinor: 2_500,
      currency: 'BYN',
      workTitle: 'Bowl',
      workPublicId: 'work1',
      coverImageUrl: null,
      role: 'buyer',
      createdAt: now,
    },
  ],
};

function client(fetchImpl: typeof fetch) {
  return createApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl,
  });
}

describe('commerce client', () => {
  it('places a bid on the listing path and parses the bid and lot', async () => {
    const calls: { url: string; method: string; body: unknown }[] = [];
    const api = client(async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method ?? 'GET',
        body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
      });
      return new Response(JSON.stringify(placedBid), {
        headers: { 'content-type': 'application/json' },
      });
    });

    await expect(
      api.commerce.placeBid(listingId, {
        amountMinor: 2_600,
        idempotencyKey,
      }),
    ).resolves.toEqual(placedBid);
    expect(calls).toEqual([
      {
        url: `https://api.example.test/api/listings/${listingId}/bids`,
        method: 'POST',
        body: { amountMinor: 2_600, idempotencyKey },
      },
    ]);

    const rejected = client(async () => {
      throw new Error('fetch should not run');
    });
    expect(() =>
      rejected.commerce.placeBid(listingId, {
        amountMinor: 2_600,
        idempotencyKey: 'short',
      }),
    ).toThrow(expect.objectContaining({ kind: 'validation' }));
  });

  it('lists the caller orders for a role and state', async () => {
    const calls: { url: string; method: string; body: unknown }[] = [];
    const api = client(async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method ?? 'GET',
        body: init?.body,
      });
      return new Response(JSON.stringify(orders), {
        headers: { 'content-type': 'application/json' },
      });
    });

    await expect(
      api.commerce.listOrders({ role: 'buyer', state: 'open' }),
    ).resolves.toEqual(orders);
    expect(calls).toEqual([
      {
        url: 'https://api.example.test/api/me/orders?role=buyer&state=open',
        method: 'GET',
        body: undefined,
      },
    ]);
  });

  it('adds a favorite with PUT and accepts an empty 204', async () => {
    const calls: { url: string; method: string; body: unknown }[] = [];
    const api = client(async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method ?? 'GET',
        body: init?.body,
      });
      return new Response(null, { status: 204 });
    });

    await expect(api.commerce.addFavorite(productId)).resolves.toBeUndefined();
    expect(calls).toEqual([
      {
        url: `https://api.example.test/api/works/${productId}/favorite`,
        method: 'PUT',
        body: undefined,
      },
    ]);
  });
});

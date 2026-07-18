import { describe, expect, it } from 'vitest';

import { realtimeEventPayloadSchema } from '@bidplace/contracts';

const listing = {
  listingId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
  currentPrice: 25,
  bidCount: 2,
  status: 'LIVE' as const,
  endsAt: '2026-07-18T12:00:00.000Z',
};

describe('realtime event contracts', () => {
  it('accepts the PII-free Listing update payload', () => {
    expect(realtimeEventPayloadSchema.safeParse({ event: 'listing.updated', payload: listing }).success).toBe(true);
  });

  it('rejects buyer contact data in a Bid event', () => {
    const result = realtimeEventPayloadSchema.safeParse({
      event: 'bid.placed',
      payload: {
        ...listing,
        bid: {
          id: '7a728f95-6c4d-4f35-a3fd-a7b9903a3182',
          listingId: listing.listingId,
          amount: 25,
          createdAt: '2026-07-18T11:00:00.000Z',
          bidderAlias: 'Bidder 7a728f',
          buyerPhone: '+375290000000',
        },
      },
    });

    expect(result.success).toBe(false);
  });
});

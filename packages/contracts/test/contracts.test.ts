import { describe, expect, it } from 'vitest';

import {
  auctionCreateRequestSchema,
  auctionEndedEventPayloadSchema,
  auctionStatusSchema,
  auctionUpdatedEventPayloadSchema,
  bidCreateRequestSchema,
  bidPlacedEventPayloadSchema,
  loginRequestSchema,
  registerRequestSchema,
  sellerProfileCreateRequestSchema,
} from '../src';

describe('shared contracts', () => {
  it('accepts valid register payloads', () => {
    const result = registerRequestSchema.safeParse({
      email: 'seller@example.com',
      password: 'super-secret',
      phone: '+15555550123',
      displayName: 'Demo Seller',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid login payloads', () => {
    const result = loginRequestSchema.safeParse({
      email: 'not-an-email',
      password: '',
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid seller profile payloads', () => {
    const result = sellerProfileCreateRequestSchema.safeParse({
      slug: 'demo-store',
      sellerType: 'creator',
      storeName: 'Demo Store',
      country: 'BY',
      contactPreference: 'telegram',
      socialLink: 'https://example.com',
      shortDescription: 'Short bio',
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown auction statuses', () => {
    expect(auctionStatusSchema.safeParse('pending').success).toBe(false);
  });

  it('accepts valid auction create payloads', () => {
    const result = auctionCreateRequestSchema.safeParse({
      lotId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      slug: 'demo-auction',
      startPrice: 100,
      reservePrice: 150,
      currency: 'USD',
      startsAt: '2026-07-13T12:00:00.000Z',
      endsAt: '2026-07-14T12:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid bid amounts', () => {
    expect(bidCreateRequestSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it('accepts websocket auction update payloads', () => {
    const result = auctionUpdatedEventPayloadSchema.safeParse({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 120,
      bidCount: 3,
      status: 'active',
      endsAt: '2026-07-14T12:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });

    expect(result.success).toBe(true);
  });

  it('accepts websocket bid placed payloads', () => {
    const result = bidPlacedEventPayloadSchema.safeParse({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 125,
      bidCount: 4,
      bid: {
        id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        amount: 125,
        status: 'active',
        createdAt: '2026-07-13T12:10:00.000Z',
        updatedAt: '2026-07-13T12:10:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts websocket auction ended payloads', () => {
    const result = auctionEndedEventPayloadSchema.safeParse({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      status: 'sold',
      winnerBidId: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
      reserveReached: true,
    });

    expect(result.success).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { bidCreateRequestSchema, listingCreateRequestSchema, listingStatusSchema, productWriteRequestSchema, realtimeEventPayloadSchema } from '../src';

describe('shared contracts', () => {
  it('accepts a draft Product without art-only fields', () => {
    expect(productWriteRequestSchema.safeParse({ title: 'Personal item' }).success).toBe(true);
  });
  it('accepts an auction Listing only in BYN through server-owned currency', () => {
    expect(listingCreateRequestSchema.safeParse({ startPrice: 10, startsAt: '2026-07-20T10:00:00.000Z', endsAt: '2026-07-20T11:00:00.000Z' }).success).toBe(true);
  });
  it('rejects an invalid Listing timeframe', () => {
    expect(listingCreateRequestSchema.safeParse({ startPrice: 10, startsAt: '2026-07-20T11:00:00.000Z', endsAt: '2026-07-20T10:00:00.000Z' }).success).toBe(false);
  });
  it('accepts a bid amount but not client-owned Listing values', () => {
    expect(bidCreateRequestSchema.safeParse({ amount: 15 }).success).toBe(true);
    expect(bidCreateRequestSchema.safeParse({ amount: 15, currency: 'USD' }).success).toBe(false);
  });
  it('exposes listing realtime names without reserve or PII fields', () => {
    expect(realtimeEventPayloadSchema.safeParse({ event: 'listing.updated', payload: { listingId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1', currentPrice: 20, bidCount: 1, status: 'LIVE', endsAt: '2026-07-20T11:00:00.000Z' } }).success).toBe(true);
    expect(listingStatusSchema.safeParse('active').success).toBe(false);
  });
});

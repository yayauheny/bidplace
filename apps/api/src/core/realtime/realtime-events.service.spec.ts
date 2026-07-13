import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RealtimeEventsService } from './realtime-events.service';

describe('RealtimeEventsService', () => {
  const realtimeGateway = {
    emitToAuction: vi.fn(),
  };

  const service = new RealtimeEventsService(realtimeGateway as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('publishes auction updated events through the gateway', () => {
    const payload = {
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 120,
      bidCount: 2,
      status: 'active' as const,
      endsAt: '2026-07-13T14:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    };

    expect(service.publishAuctionUpdated(payload)).toEqual(payload);
    expect(realtimeGateway.emitToAuction).toHaveBeenCalledWith(
      payload.auctionId,
      'auction.updated',
      payload,
    );
  });

  it('publishes bid placed events through the gateway', () => {
    const payload = {
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      bid: {
        id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        amount: 120,
        status: 'winning' as const,
        createdAt: '2026-07-13T12:10:00.000Z',
        updatedAt: '2026-07-13T12:10:00.000Z',
      },
      currentPrice: 120,
      bidCount: 2,
    };

    expect(service.publishBidPlaced(payload)).toEqual(payload);
    expect(realtimeGateway.emitToAuction).toHaveBeenCalledWith(
      payload.auctionId,
      'bid.placed',
      payload,
    );
  });

  it('publishes auction ended events through the gateway', () => {
    const payload = {
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      status: 'sold' as const,
      winnerBidId: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
      reserveReached: true,
    };

    expect(service.publishAuctionEnded(payload)).toEqual(payload);
    expect(realtimeGateway.emitToAuction).toHaveBeenCalledWith(
      payload.auctionId,
      'auction.ended',
      payload,
    );
  });
});

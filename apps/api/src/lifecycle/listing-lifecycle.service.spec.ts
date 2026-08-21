import { describe, expect, it, vi } from 'vitest';

import { ListingLifecycleService } from './listing-lifecycle.service';

describe('ListingLifecycleService', () => {
  it('only activates scheduled listings with approved product/seller and handoff', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const scheduled = {
      id: 'listing-id',
      currentPrice: { toNumber: () => 10 },
      bidCount: 0,
      endsAt: new Date('2026-07-31T13:00:00.000Z'),
    };
    const prisma = {
      listing: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([scheduled])
          .mockResolvedValueOnce([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: vi.fn(),
    };
    const service = new ListingLifecycleService(
      prisma as never,
      { now: () => now } as never,
      {} as never,
      { emit: vi.fn() } as never,
    );

    await service.run();

    expect(prisma.listing.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        status: 'SCHEDULED',
        startsAt: { lte: now },
        endsAt: { gt: now },
        product: {
          status: 'APPROVED',
          sellerProfile: {
            status: 'APPROVED',
            handoffContactType: { not: null },
            handoffContactValue: { not: null },
          },
        },
      },
      select: { id: true, currentPrice: true, bidCount: true, endsAt: true },
    });
    expect(prisma.listing.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'listing-id',
        status: 'SCHEDULED',
        product: {
          status: 'APPROVED',
          sellerProfile: {
            status: 'APPROVED',
            handoffContactType: { not: null },
            handoffContactValue: { not: null },
          },
        },
      },
      data: { status: 'LIVE' },
    });
  });

  it('continues closing remaining expired listings when one close throws', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const prisma = {
      listing: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ id: 'listing-a' }, { id: 'listing-b' }]),
      },
    };
    const service = new ListingLifecycleService(
      prisma as never,
      { now: () => now } as never,
      {} as never,
      { emit: vi.fn() } as never,
    );
    const close = vi
      .spyOn(service, 'close')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(true);

    await service.run();

    expect(close).toHaveBeenNthCalledWith(1, 'listing-a', now);
    expect(close).toHaveBeenNthCalledWith(2, 'listing-b', now);
  });
});

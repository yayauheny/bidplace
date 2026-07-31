import { describe, expect, it, vi } from 'vitest';

import { ListingLifecycleService } from './listing-lifecycle.service';

describe('ListingLifecycleService', () => {
  it('only activates scheduled listings whose product and seller remain approved', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const scheduled = {
      id: 'listing-id',
      currentPrice: { toNumber: () => 10 },
      bidCount: 0,
      endsAt: new Date('2026-07-31T13:00:00.000Z'),
    };
    const prisma = {
      listing: {
        findMany: vi.fn().mockResolvedValueOnce([scheduled]).mockResolvedValueOnce([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const service = new ListingLifecycleService(
      prisma as never,
      { now: () => now } as never,
      {} as never,
      { emit: vi.fn() } as never,
    );

    await service.run();

    expect(prisma.listing.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'listing-id',
        status: 'SCHEDULED',
        product: {
          status: 'APPROVED',
          sellerProfile: { status: 'APPROVED' },
        },
      },
      data: { status: 'LIVE' },
    });
  });
});

import { describe, expect, it, vi } from 'vitest';

import {
  EXPIRED_SCHEDULED_AUDIT_REASON,
  ListingLifecycleService,
} from './listing-lifecycle.service';
import { sellerProfileHandoffSelect } from '../sellers/seller-profile.mapper';

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
          .mockResolvedValueOnce([])
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

  it('cancels expired SCHEDULED listings without creating an Order', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const endsAt = new Date('2026-07-31T11:00:00.000Z');
    const tx = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'expired-scheduled',
          status: 'SCHEDULED',
          endsAt,
          currentPrice: { toNumber: () => 10 },
          bidCount: 0,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      auditEvent: { create: vi.fn() },
    };
    const emit = vi.fn();
    const prisma = {
      listing: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ id: 'expired-scheduled' }])
          .mockResolvedValueOnce([]),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      order: { create: vi.fn() },
    };
    const service = new ListingLifecycleService(
      prisma as never,
      { now: () => now } as never,
      {} as never,
      { emit } as never,
    );

    await service.run();

    expect(prisma.listing.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { status: 'SCHEDULED', endsAt: { lte: now } },
      }),
    );
    expect(tx.listing.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'expired-scheduled',
        status: 'SCHEDULED',
        endsAt: { lte: now },
      },
      data: { status: 'CANCELLED', closedAt: now },
    });
    expect(tx.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: null,
        targetType: 'LISTING',
        targetId: 'expired-scheduled',
        oldStatus: 'SCHEDULED',
        newStatus: 'CANCELLED',
        reason: EXPIRED_SCHEDULED_AUDIT_REASON,
      },
    });
    expect(emit).toHaveBeenCalledWith(
      'expired-scheduled',
      'listing.updated',
      expect.objectContaining({ status: 'CANCELLED' }),
    );
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('loads seller handoff fields without profile photo bytes after close', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const tx = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'listing-id',
          status: 'LIVE',
          endsAt: now,
          currentPrice: { toNumber: () => 10 },
          bidCount: 1,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const findUnique = vi.fn().mockResolvedValue({
      id: 'listing-id',
      status: 'LIVE',
      product: { sellerProfile: { userId: 'seller-id', status: 'APPROVED' } },
    });
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      listing: { findUnique },
    };
    const service = new ListingLifecycleService(
      prisma as never,
      { now: () => now } as never,
      {} as never,
      { emit: vi.fn() } as never,
    );

    await service.close('listing-id', now);

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'listing-id' },
      include: {
        product: {
          include: {
            sellerProfile: { select: sellerProfileHandoffSelect },
          },
        },
      },
    });
  });
});

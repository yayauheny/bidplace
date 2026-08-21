import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminListingEmergencyService } from './admin-listing-emergency.service';

const realtime = {
  emit: vi.fn(),
};

function createService(prisma: unknown) {
  return new AdminListingEmergencyService(prisma as never, realtime as never);
}

describe('AdminListingEmergencyService', () => {
  afterEach(() => {
    vi.mocked(realtime.emit).mockReset();
  });

  it('cancels a live listing, writes audit, and emits realtime update', async () => {
    const tx = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'listing-1',
          status: 'LIVE',
          currentPrice: { toNumber: () => 100 },
          bidCount: 2,
          endsAt: new Date('2026-08-21T12:00:00.000Z'),
        }),
        update: vi.fn().mockResolvedValue({
          id: 'listing-1',
          status: 'CANCELLED',
          currentPrice: { toNumber: () => 100 },
          bidCount: 2,
          endsAt: new Date('2026-08-21T12:00:00.000Z'),
        }),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await expect(
      createService(prisma).emergencyCancel('admin-1', 'listing-1', {
        reason: 'Prohibited item',
      }),
    ).resolves.toEqual({ ok: true });

    expect(tx.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetType: 'LISTING',
        oldStatus: 'LIVE',
        newStatus: 'CANCELLED',
      }),
    });
    expect(realtime.emit).toHaveBeenCalledWith(
      'listing-1',
      'listing.updated',
      expect.objectContaining({ status: 'CANCELLED' }),
    );
  });

  it('returns ok without audit when listing is already cancelled', async () => {
    const tx = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'listing-1',
          status: 'CANCELLED',
          currentPrice: { toNumber: () => 100 },
          bidCount: 0,
          endsAt: new Date('2026-08-21T12:00:00.000Z'),
        }),
        update: vi.fn(),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await expect(
      createService(prisma).emergencyCancel('admin-1', 'listing-1', {
        reason: 'Repeat',
      }),
    ).resolves.toEqual({ ok: true });

    expect(tx.listing.update).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
    expect(realtime.emit).not.toHaveBeenCalled();
  });
});

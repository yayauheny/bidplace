import { Prisma } from '@bidplace/database';
import { describe, expect, it, vi } from 'vitest';

import { CommerceGuards } from './commerce-guards';

const now = new Date('2020-06-01T00:00:00.000Z');
const buyerId = '66666666-6666-4666-8666-666666666666';
const sellerId = '77777777-7777-4777-8777-777777777777';

const listing = {
  id: '88888888-8888-4888-8888-888888888888',
  sellerUserId: sellerId,
  type: 'FIXED' as const,
  status: 'LIVE' as const,
  startsAt: new Date('2020-05-01T00:00:00.000Z'),
  endsAt: null,
  bidCount: 0,
};

function transaction() {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ now }]),
    bid: { findFirst: vi.fn().mockResolvedValue(null) },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        role: 'user',
        status: 'active',
        emailVerifiedAt: now,
        purchaseHolds: [],
      }),
    },
  };
}

describe('buyer eligibility locks', () => {
  it('does not lock the viewer while describing a public lot', async () => {
    const lockUsers = vi.fn();
    const guards = new CommerceGuards({ lockUsers } as never);
    const tx = transaction();

    await expect(
      guards.describeBuyer(tx as unknown as Prisma.TransactionClient, {
        userId: buyerId,
        listing,
        now,
      }),
    ).resolves.toEqual({ blockedReason: null, isLeading: false });
    expect(lockUsers).not.toHaveBeenCalled();
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });

  it('locks the buyer before deciding eligibility', async () => {
    const lockUsers = vi.fn(async () => undefined);
    const guards = new CommerceGuards({ lockUsers } as never);
    const tx = transaction();

    await guards.assertBuyerEligible(tx as unknown as Prisma.TransactionClient, {
      userId: buyerId,
      listing,
    });
    expect(lockUsers).toHaveBeenCalledWith(tx, [buyerId]);
  });
});

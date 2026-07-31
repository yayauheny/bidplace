import { describe, expect, it, vi } from 'vitest';

import { BidsService } from './bids.service';

describe('BidsService', () => {
  it('rejects admin accounts before evaluating a bid', async () => {
    const service = new BidsService({} as never, {} as never, {} as never);

    await expect(
      service.place('admin-id', 'admin', 'listing-id', 'request-id', {
        amount: 100,
      }),
    ).rejects.toThrow('Administrators cannot place bids');
  });

  it.each([
    ['CHANGES_REQUESTED', 'APPROVED'],
    ['APPROVED', 'SUSPENDED'],
  ] as const)(
    'rejects a LIVE listing when Product is %s and SellerProfile is %s',
    async (productStatus, sellerStatus) => {
      const now = new Date('2026-07-31T12:00:00.000Z');
      const tx = {
        bid: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        listing: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'listing-id',
            status: 'LIVE',
            startsAt: new Date('2026-07-31T11:00:00.000Z'),
            endsAt: new Date('2026-07-31T13:00:00.000Z'),
            product: {
              status: productStatus,
              sellerProfile: {
                userId: 'seller-id',
                status: sellerStatus,
              },
            },
            auctionRules: {},
          }),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({
            emailVerifiedAt: now,
            termsAcceptances: [
              { rulesVersion: 'MVP_RULES_V1', acceptedAt: now },
            ],
          }),
        },
      };
      const prisma = {
        $transaction: vi.fn(async (callback: (client: object) => Promise<unknown>) =>
          callback(tx),
        ),
      };
      const service = new BidsService(
        prisma as never,
        { now: () => now } as never,
        {} as never,
      );

      await expect(
        service.place('buyer-id', 'user', 'listing-id', 'request-id', {
          amount: 11,
        }),
      ).rejects.toThrow('Listing is not open for bids');
      expect(tx.listing.findUnique).toHaveBeenCalledOnce();
    },
  );
});

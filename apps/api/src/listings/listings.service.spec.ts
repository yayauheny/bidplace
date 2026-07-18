import { describe, expect, it, vi } from 'vitest';

import { ListingsService } from './listings.service';

describe('ListingsService', () => {
  it('does not expose an internal Listing to another user', async () => {
    const prisma = {
      listing: {
        findUnique: vi.fn().mockResolvedValue({
          product: { sellerProfile: { userId: 'seller-id' } },
          auctionRules: null,
        }),
      },
    };
    const service = new ListingsService(prisma as never);

    await expect(service.get('other-user', 'user', 'listing-id'))
      .rejects.toThrow('Listing is not available');
  });
});

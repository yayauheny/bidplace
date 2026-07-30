import { describe, expect, it } from 'vitest';

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
});

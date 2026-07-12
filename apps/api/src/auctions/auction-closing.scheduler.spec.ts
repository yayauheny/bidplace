import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuctionClosingScheduler } from './auction-closing.scheduler';

describe('AuctionClosingScheduler', () => {
  const auctionClosingService = {
    closeExpiredAuctions: vi.fn(),
  };

  const scheduler = new AuctionClosingScheduler(
    auctionClosingService as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('runs the close cycle on a fixed interval', async () => {
    auctionClosingService.closeExpiredAuctions.mockResolvedValue([]);

    scheduler.onModuleInit();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(auctionClosingService.closeExpiredAuctions).toHaveBeenCalledTimes(1);

    scheduler.onModuleDestroy();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(auctionClosingService.closeExpiredAuctions).toHaveBeenCalledTimes(1);
  });
});

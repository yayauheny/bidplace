import { describe, expect, it, vi, beforeEach } from 'vitest';

import { Clock } from '../core/time';
import { AuctionLifecycleService } from './auction-closing.service';
import { AuctionLifecycleScheduler } from './auction-closing.scheduler';

describe('AuctionLifecycleScheduler', () => {
  class TestClock extends Clock {
    now = vi.fn(() => new Date('2026-07-13T12:30:00.000Z'));
  }
  const clock = new TestClock();
  const auctionLifecycleService = {
    runLifecycleCycle: vi.fn(),
  } satisfies Pick<AuctionLifecycleService, 'runLifecycleCycle'>;

  const scheduler = new AuctionLifecycleScheduler(
    auctionLifecycleService,
    clock,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    clock.now.mockReturnValue(new Date('2026-07-13T12:30:00.000Z'));
  });

  it('runs one awaited lifecycle cycle using a single clock value', async () => {
    auctionLifecycleService.runLifecycleCycle.mockResolvedValue(undefined);

    await scheduler.runLifecycleCycle();

    expect(clock.now).toHaveBeenCalledTimes(1);
    expect(auctionLifecycleService.runLifecycleCycle).toHaveBeenCalledWith(
      new Date('2026-07-13T12:30:00.000Z'),
    );
  });

  it('swallows lifecycle errors after logging them', async () => {
    auctionLifecycleService.runLifecycleCycle.mockRejectedValue(
      new Error('boom'),
    );

    await expect(scheduler.runLifecycleCycle()).resolves.toBeUndefined();
  });
});

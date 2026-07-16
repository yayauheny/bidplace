import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes expired buckets lazily on access', () => {
    const service = new RateLimitService({
      maxBuckets: 10,
      cleanupIntervalMs: 1_000,
    });

    expect(service.consume('user-1', 1, 100, 0)).toBe(true);
    expect(service.consume('user-1', 1, 100, 50)).toBe(false);
    expect(service.consume('user-1', 1, 100, 101)).toBe(true);

    service.onModuleDestroy();
  });

  it('evicts the oldest bucket when max capacity is reached', () => {
    const service = new RateLimitService({
      maxBuckets: 2,
      cleanupIntervalMs: 1_000,
    });

    expect(service.consume('user-1', 1, 1_000, 0)).toBe(true);
    expect(service.consume('user-2', 1, 2_000, 0)).toBe(true);
    expect(service.consume('user-3', 1, 3_000, 0)).toBe(true);
    expect(service.consume('user-1', 1, 1_000, 0)).toBe(true);

    service.onModuleDestroy();
  });

  it('stops the periodic cleanup timer on module destroy', () => {
    const service = new RateLimitService({
      maxBuckets: 10,
      cleanupIntervalMs: 1_000,
    });

    expect(vi.getTimerCount()).toBe(1);

    service.onModuleDestroy();

    expect(vi.getTimerCount()).toBe(0);
  });
});

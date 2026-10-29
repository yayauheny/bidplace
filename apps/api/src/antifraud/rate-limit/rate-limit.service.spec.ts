import { describe, expect, it, vi } from 'vitest';
import { RateLimitService } from './rate-limit.service';
describe('RateLimitService', () => {
  it('propagates storage failure without admitting a request', async () => {
    const failure = new Error('synthetic storage failure');
    const service = new RateLimitService({ $queryRaw: vi.fn().mockRejectedValue(failure) } as never);
    await expect(service.consume('key', 1, 60_000)).rejects.toBe(failure);
  });
  it('rejects overlong keys instead of colliding through truncation', async () => {
    const query = vi.fn();
    const service = new RateLimitService({ $queryRaw: query } as never);
    await expect(service.consume('x'.repeat(201), 1, 60_000)).rejects.toThrow(RangeError);
    expect(query).not.toHaveBeenCalled();
  });
});

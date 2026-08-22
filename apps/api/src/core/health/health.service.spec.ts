import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthService } from './health.service';

describe('HealthService', () => {
  const prisma = {
    $queryRaw: vi.fn(),
  };

  let service: HealthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HealthService(prisma as never);
  });

  it('returns liveness status without touching the database', () => {
    expect(service.getStatus()).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns ready status when the database responds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.getReadyStatus()).resolves.toEqual({
      status: 'ok',
      database: 'ok',
      timestamp: expect.any(String),
    });
  });

  it('returns error ready status when the database is unavailable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(service.getReadyStatus()).resolves.toEqual({
      status: 'error',
      database: 'unavailable',
      timestamp: expect.any(String),
    });
  });
});

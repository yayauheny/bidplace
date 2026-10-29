import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../database';
import { SystemClock } from '../time/clock';
import { TickService, type TickJob } from './tick.service';

function setup() {
  const prisma = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    systemHeartbeat: { findUnique: vi.fn().mockResolvedValue(null) },
  };
  return {
    prisma,
    service: new TickService(
      prisma as unknown as PrismaService,
      new SystemClock(),
    ),
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('TickService', () => {
  it('runs jobs in registration order with the same date and deadline', async () => {
    const { service, prisma } = setup();
    const now = new Date('2000-01-01');
    const calls: string[] = [];
    const first = vi.fn<TickJob['run']>(async () => {
      calls.push('first');
      return 2;
    });
    const second = vi.fn<TickJob['run']>(async () => {
      calls.push('second');
      return 3;
    });
    service.register({ name: 'first', run: first });
    service.register({ name: 'second', run: second });
    const started = Date.now();
    expect(await service.run(now)).toEqual({
      skipped: false,
      jobs: [
        { name: 'first', processed: 2, failed: false },
        { name: 'second', processed: 3, failed: false },
      ],
    });
    expect(calls).toEqual(['first', 'second']);
    expect(first.mock.calls[0]).toEqual([
      now,
      { deadline: expect.any(Number) },
    ]);
    expect(second.mock.calls[0]).toEqual(first.mock.calls[0]);
    const deadline = first.mock.calls[0]![1].deadline;
    expect(deadline).toBeGreaterThanOrEqual(started + 20_000);
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });

  it('logs only the failed job name, continues, and preserves the heartbeat', async () => {
    const { service, prisma } = setup();
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    service.register({
      name: 'broken',
      run: async () => {
        throw new Error('private payload');
      },
    });
    service.register({ name: 'next', run: async () => 4 });
    expect((await service.run()).jobs).toEqual([
      { name: 'broken', processed: 0, failed: true },
      { name: 'next', processed: 4, failed: false },
    ]);
    expect(error).toHaveBeenCalledExactlyOnceWith('Tick job failed: broken');
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('holds the running flag until an overdue job settles and skips remaining work', async () => {
    vi.useFakeTimers();
    const { service, prisma } = setup();
    let finish!: (processed: number) => void;
    const remaining = vi.fn(async () => 1);
    const slow = vi
      .fn()
      .mockResolvedValue(1)
      .mockImplementationOnce(
        () =>
          new Promise<number>((resolve) => {
            finish = resolve;
          }),
      );
    service.register({ name: 'slow', run: slow });
    service.register({ name: 'remaining', run: remaining });
    const first = service.run();
    await vi.advanceTimersByTimeAsync(20_001);
    expect(await service.run()).toEqual({ skipped: true, jobs: [] });
    finish(1);
    expect(await first).toEqual({
      skipped: false,
      jobs: [
        { name: 'slow', processed: 1, failed: false },
        { name: 'remaining', processed: 0, failed: false },
      ],
    });
    expect(remaining).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
    expect((await service.run()).skipped).toBe(false);
  });

  it('does not publish success when the last job consumes the deadline', async () => {
    vi.useFakeTimers();
    const { service, prisma } = setup();
    service.register({
      name: 'slow',
      run: async () => {
        vi.advanceTimersByTime(20_000);
        return 0;
      },
    });
    await service.run();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('releases the running flag when heartbeat persistence fails', async () => {
    const { service, prisma } = setup();
    prisma.$executeRaw.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.run()).rejects.toThrow('database unavailable');
    expect(await service.run()).toEqual({ skipped: false, jobs: [] });
  });

  it('reads the persisted heartbeat and returns null before first success', async () => {
    const { service, prisma } = setup();
    expect(await service.lastSucceededAt()).toBeNull();
    const at = new Date();
    prisma.systemHeartbeat.findUnique.mockResolvedValueOnce({ at } as never);
    expect(await service.lastSucceededAt()).toBe(at);
    expect(prisma.systemHeartbeat.findUnique).toHaveBeenCalledWith({
      where: { name: 'tick' },
    });
  });

  it('starts one unreferenced 30-second timer and clears it on destroy', async () => {
    vi.useFakeTimers();
    const { service } = setup();
    const run = vi.spyOn(service, 'run');
    const interval = vi.spyOn(globalThis, 'setInterval');
    service.onApplicationBootstrap();
    service.onApplicationBootstrap();
    expect(interval).toHaveBeenCalledTimes(1);
    expect(interval.mock.results[0]!.value.hasRef()).toBe(false);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(run).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('handles a scheduled persistence failure without an unhandled rejection', async () => {
    vi.useFakeTimers();
    const { service, prisma } = setup();
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    prisma.$executeRaw.mockRejectedValueOnce(
      new Error('private connection details'),
    );
    service.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(60_000);
    service.onModuleDestroy();
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledExactlyOnceWith('Scheduled tick failed');
  });
});

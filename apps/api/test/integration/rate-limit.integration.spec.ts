import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AntifraudService } from '../../src/antifraud';
import { PrismaService } from '../../src/core/database';
import { TickService } from '../../src/core/tick/tick.service';
import { createHttpTestApp, type HttpTestApp } from './http-test-app';
import { createIntegrationDatabaseContext, type IntegrationDatabaseContext } from './test-database';

let database: IntegrationDatabaseContext;
let first: HttpTestApp;
let second: HttpTestApp;
beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  first = await createHttpTestApp(database.databaseUrl);
  second = await createHttpTestApp(database.databaseUrl);
});
afterAll(async () => { await first?.close(); await second?.close(); await database?.cleanup(); });
function service(client = first) { return client.app.get(AntifraudService); }
describe('persistent rate limits', () => {
  it('preserves an exhausted limit after restart and across connections', async () => {
    expect(await service().consumeRateLimit('restart', 1, 60_000)).toBe(true);
    expect(await service(second).consumeRateLimit('restart', 1, 60_000)).toBe(false);
    await first.close();
    first = await createHttpTestApp(database.databaseUrl);
    expect(await service().consumeRateLimit('restart', 1, 60_000)).toBe(false);
  });
  it('admits exactly ten of twenty concurrent requests across instances', async () => {
    const instances = [service(), service(second)];
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => instances[i % 2]!.consumeRateLimit('concurrent', 10, 60_000)));
    expect(results.filter(Boolean)).toHaveLength(10);
  });
  it('starts a fresh window after expiration', async () => {
    expect(await service().consumeRateLimit('expired', 1, 60_000)).toBe(true);
    await database.prisma.$executeRaw`UPDATE rate_limit_counters SET window_start = now() - interval '2 minutes', expires_at = now() - interval '1 minute' WHERE key = 'expired'`;
    expect(await service(second).consumeRateLimit('expired', 1, 60_000)).toBe(true);
  });
  it('cleans only old expired windows and preserves active long windows', async () => {
    await service().consumeRateLimit('old', 1, 60_000);
    await service().consumeRateLimit('long', 1, 3 * 24 * 60 * 60_000);
    await database.prisma.$executeRaw`UPDATE rate_limit_counters SET window_start = now() - interval '2 days' WHERE key IN ('old', 'long')`;
    await database.prisma.$executeRaw`UPDATE rate_limit_counters SET expires_at = now() - interval '1 day' WHERE key = 'old'`;
    const result = await first.app.get(TickService).run();
    expect(result.jobs).toContainEqual({ name: 'antifraud-cleanup', processed: 1, failed: false });
    expect(await service(second).consumeRateLimit('long', 1, 3 * 24 * 60 * 60_000)).toBe(false);
    expect(await service(second).consumeRateLimit('old', 1, 60_000)).toBe(true);
  });

  it('skips a concurrently renewed locked counter without waiting or resetting its limit', async () => {
    await service().consumeRateLimit('cleanup-race', 1, 60_000);
    await database.prisma.$executeRaw`UPDATE rate_limit_counters SET window_start = now() - interval '2 days', expires_at = now() - interval '1 day' WHERE key = 'cleanup-race'`;
    let releaseRenewal!: () => void;
    let reportRenewed!: () => void;
    const held = new Promise<void>((resolve) => { releaseRenewal = resolve; });
    const renewed = new Promise<void>((resolve) => { reportRenewed = resolve; });
    const renewal = database.prisma.$transaction(async (tx) => {
      const query = vi.spyOn(first.app.get(PrismaService), '$queryRaw').mockImplementation(tx.$queryRaw.bind(tx));
      try {
        expect(await service().consumeRateLimit('cleanup-race', 1, 60_000)).toBe(true);
      } finally {
        query.mockRestore();
      }
      reportRenewed();
      await held;
    });
    await Promise.race([renewed, renewal]);
    const cleanup = second.app.get(TickService).run();
    let result;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      result = await Promise.race([
        cleanup,
        new Promise<undefined>((resolve) => { timer = setTimeout(() => resolve(undefined), 500); }),
      ]);
    } finally {
      clearTimeout(timer);
      releaseRenewal();
      await renewal;
      await cleanup;
    }
    expect(result, 'cleanup must skip locked counters before the renewal commits').toBeDefined();
    expect(result?.jobs).toContainEqual({ name: 'antifraud-cleanup', processed: 0, failed: false });
    expect(await service(second).consumeRateLimit('cleanup-race', 1, 60_000)).toBe(false);
  });

});

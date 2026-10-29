import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TickService } from '../../src/core/tick/tick.service';
import { createHttpTestApp, type HttpTestApp } from './http-test-app';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const secret = 'synthetic-internal-tick-test-key-32';
let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let tick: TickService;
beforeAll(async () => {
  vi.stubEnv('INTERNAL_TICK_SECRET', secret);
  database = await createIntegrationDatabaseContext();
  http = await createHttpTestApp(database.databaseUrl);
  tick = http.app.get(TickService, { strict: false });
});
afterAll(async () => {
  await http?.close();
  await database?.cleanup();
  vi.unstubAllEnvs();
});
function request(
  path = '/api/internal/tick',
  header?: string,
  method = 'POST',
) {
  return fetch(`${http.baseUrl}${path}`, {
    method,
    headers: header ? { 'X-Internal-Tick': header } : {},
  });
}
describe('private tick HTTP and database boundary', () => {
  it.each([undefined, 'wrong', 'x'.repeat(secret.length)])(
    'conceals the endpoint with a missing or wrong secret (%s)',
    async (header) => {
      expect((await request('/api/internal/tick', header)).status).toBe(404);
    },
  );
  it('accepts repeated private calls without a session, origin, marker or rate limit', async () => {
    expect(await tick.lastSucceededAt()).toBeNull();
    const first = await request('/api/internal/tick', secret);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ skipped: false, jobs: [] });
    const at = await tick.lastSucceededAt();
    expect(at).toBeInstanceOf(Date);
    const [dbNow] = await database.prisma.$queryRaw<
      { at: Date }[]
    >`SELECT now() AS at`;
    expect(Math.abs(dbNow!.at.getTime() - at!.getTime())).toBeLessThan(5_000);
    const responses = await Promise.all(
      Array.from({ length: 35 }, () => request('/api/internal/tick', secret)),
    );
    expect(responses.every((response) => response.status === 200)).toBe(true);
    const bodies = await Promise.all(
      responses.map(async (response) => z.object({ skipped: z.boolean(), jobs: z.array(z.unknown()) }).passthrough().parse(await response.json())),
    );
    expect(
      bodies.every(
        (body) => typeof body.skipped === 'boolean' && Array.isArray(body.jobs),
      ),
    ).toBe(true);
    const restarted = new TickService(database.prisma as never, {
      now: () => new Date(),
    });
    expect(await restarted.lastSucceededAt()).toEqual(
      await tick.lastSucceededAt(),
    );
  });
  it.each([
    ['/api/internal/tick', 'PUT'],
    ['/api/internal/tick/', 'POST'],
    ['/api/internal/tick/other', 'POST'],
    ['/api/auth/login', 'POST'],
  ])('retains CSRF protection for %s %s', async (path, method) => {
    expect((await request(path, secret, method)).status).toBe(403);
  });
  it('stores database execution time instead of the supplied job date and preserves it after failure', async () => {
    await tick.run(new Date('2000-01-01'));
    const before = await tick.lastSucceededAt();
    expect(before!.getUTCFullYear()).toBeGreaterThan(2020);
    tick.register({
      name: 'broken',
      run: async () => {
        throw new Error('synthetic failure');
      },
    });
    const result = await request('/api/internal/tick', secret);
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      skipped: false,
      jobs: [{ name: 'broken', processed: 0, failed: true }],
    });
    expect(await tick.lastSucceededAt()).toEqual(before);
  });
});

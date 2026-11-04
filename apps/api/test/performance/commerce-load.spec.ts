import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFile, execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem, loadavg } from 'node:os';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

import { createCommerceTestDatabase, startCommerceTestApi } from '../commerce-test-runtime';
import { createPermissionFixture } from '../integration/permission-fixtures';

it('reports all three independent 50-bid runs without hiding a latency failure', async () => {
  const root = resolve(__dirname, '../../../..');
  const output = resolve(root, 'apps/mobile/test-results/commerce-load', randomUUID());
  await mkdir(output, { recursive: true });
  const conditions = {
    sha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    scriptSha256: createHash('sha256').update(readFileSync(resolve(root, 'scripts/perf/parallel-bids.mjs'))).digest('hex'),
    node: process.version,
    platform: process.platform, arch: process.arch,
    pnpm: execFileSync('pnpm', ['--version'], { cwd: root, encoding: 'utf8' }).trim(),
    build: 'nest build; NODE_ENV=test APP_ENV=local; test Turnstile; no browser/build during measurement',
    resources: { cpus: cpus().length, memoryBytes: totalmem() },
    concurrency: 50, runs: 3,
    database: 'existing disposable cluster; OS/DB caches not flushed; fresh schema each run',
    data: 'fresh schema and permission fixture, new API process/application per run, 50 new buyers',
    warmup: 'logins and one lot read; bid route cold; setup/auth excluded; full response body timed',
  };
  await writeFile(resolve(output, 'conditions.json'), JSON.stringify(conditions, null, 2));
  console.log(JSON.stringify({ phase: 'conditions', output, conditions }));
  const reports: Array<{ run: number; exitCode: number; report: { correctness: { pass: boolean }; latency: { pass: boolean } }; load: number[] }> = [];
  for (let run = 1; run <= 3; run += 1) {
    const database = await createCommerceTestDatabase();
    let api: Awaited<ReturnType<typeof startCommerceTestApi>> | undefined;
    try {
      api = await startCommerceTestApi(database.databaseUrl, 0, 'http://127.0.0.1:3011');
      const fixture = await createPermissionFixture(database.prisma);
      await database.prisma.user.update({ where: { id: fixture.sellers.approved.id }, data: { contactPhone: '+375291110088' } });
      const url = new URL(database.databaseUrl);
      url.searchParams.set('options', `-c search_path=${database.schemaName}`);
      const [postgres] = await database.prisma.$queryRaw<Array<{ version: string }>>`SELECT version() AS version`;
      if (!postgres) throw new Error('PostgreSQL version is unavailable');
      const load = loadavg();
      let stdout: string;
      let exitCode = 0;
      try {
        ({ stdout } = await promisify(execFile)(process.execPath, [resolve(root, 'scripts/perf/parallel-bids.mjs')], {
          cwd: root, env: {
            ...process.env, PERF_BASE_URL: api.baseUrl, PERF_DATABASE_URL: url.toString(),
            PERF_SELLER_EMAIL: fixture.sellers.approved.email, PERF_PASSWORD: fixture.sellers.approved.password,
            PERF_TICK_SECRET: api.tickSecret,
          },
        }));
      } catch (error) {
        if (!(error instanceof Error) || !('stdout' in error) || typeof error.stdout !== 'string' || !('code' in error) || typeof error.code !== 'number') throw error;
        stdout = error.stdout;
        exitCode = error.code;
      }
      const report = JSON.parse(stdout.trim()) as typeof reports[number]['report'];
      const result = { run, exitCode, report, load, postgres: postgres.version };
      reports.push(result);
      await writeFile(resolve(output, `run-${run}.json`), JSON.stringify(result, null, 2));
      console.log(JSON.stringify(result));
    } finally { try { await api?.close(); } finally { await database.cleanup(); } }
  }
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ conditions, reports }, null, 2));
  expect(reports).toHaveLength(3);
  expect(reports.every(({ report }) => report.correctness.pass), 'correctness').toBe(true);
  expect(reports.every(({ report, exitCode }) => report.latency.pass && exitCode === 0), 'p95 <= 1500ms on every run').toBe(true);
});

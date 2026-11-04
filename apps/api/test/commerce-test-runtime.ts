import { fork } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createIntegrationDatabaseContext } from './integration/test-database';

const requireApi = createRequire(join(__dirname, '../package.json'));
const { assertDisposableTarget } = requireApi('../../scripts/perf/bid-load-check.mjs') as {
  assertDisposableTarget: (target: { baseUrl: string; databaseUrl: string }) => void;
};

export async function createCommerceTestDatabase() {
  const url = process.env.INTEGRATION_DATABASE_URL;
  if (!url) throw new Error('INTEGRATION_DATABASE_URL is required; no default/reset');
  assertDisposableTarget({ baseUrl: 'http://127.0.0.1', databaseUrl: url });
  return createIntegrationDatabaseContext('auth_browser_');
}

export async function startCommerceTestApi(databaseUrl: string, port: number, origin: string) {
  const tickSecret = randomBytes(32).toString('hex');
  const child = fork(join(__dirname, 'commerce-test-server.mjs'), [], {
    env: {
      PATH: process.env.PATH, NODE_ENV: 'test', APP_ENV: 'local', DATABASE_URL: databaseUrl,
      BIDPLACE_ENV_FILE: join(tmpdir(), `bidplace-no-env-${randomUUID()}`),
      COMMERCE_TEST_PORT: String(port), CORS_ORIGIN: origin, TRUST_PROXY: 'true', TEST_EMAIL_BYPASS: 'false',
      SESSION_SECRET: randomBytes(32).toString('hex'), OTP_HASH_SECRET: randomBytes(32).toString('hex'),
      INTERNAL_TICK_SECRET: tickSecret, TURNSTILE_VERIFIER: 'test', TURNSTILE_HOSTNAME: 'localhost',
    },
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
  async function close() {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    const deadline = setTimeout(() => child.kill('SIGKILL'), 5000);
    try { await exited; } finally { clearTimeout(deadline); }
  }
  try {
    const baseUrl = await new Promise<string>((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', () => reject(new Error('Commerce test API exited before ready')));
      child.once('message', (message: unknown) => {
        if (message && typeof message === 'object' && 'baseUrl' in message && typeof message.baseUrl === 'string') resolve(message.baseUrl);
        else reject(new Error('Commerce test API failed to start'));
      });
    });
    return { baseUrl, tickSecret, close };
  } catch (error) { await close(); throw error; }
}

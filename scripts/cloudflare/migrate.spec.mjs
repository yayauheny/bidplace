import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';
import { root } from './config.mjs';

function rejected(args, databaseUrl) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/cloudflare/migrate.mjs'), ...args], {
    encoding: 'utf8', env: { PATH: process.env.PATH, ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}) },
  });
  assert.notEqual(result.status, 0);
  return result.stderr;
}

test('migration requires explicit environment and production confirmation', () => {
  assert.match(rejected([], undefined), /Choose staging or production/);
  assert.match(rejected(['production'], undefined), /confirm-production/);
  assert.match(rejected(['staging'], undefined), /Supply DATABASE_URL/);
});

test('invalid or non-Neon migration URLs fail without printing credentials', () => {
  for (const url of ['not-a-url-local-secret-canary',
    'postgresql://user:local-secret-canary@db.example.invalid/database?sslmode=require',
    'postgresql://user:local-secret-canary@ep-test.neon.tech/database']) {
    const output = rejected(['staging'], url);
    assert.doesNotMatch(output, /local-secret-canary/);
    assert.match(output, /Invalid migration DATABASE_URL|Neon endpoint with sslmode=require/);
  }
});
